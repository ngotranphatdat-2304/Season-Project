package com.season.app.exception;

import com.season.app.dto.product.ErrorResponse;
import com.season.app.service.AuthService;
import com.season.app.service.CartService;
import com.season.app.service.CheckoutSessionService;
import com.season.app.service.PayOSService;
import org.springframework.http.HttpStatus;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Xử lý lỗi chuẩn của Spring (ví dụ ném ra từ Controller)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
        String code = getDefaultCodeForStatus(ex.getStatusCode().value());
        return buildErrorResponse(ex.getStatusCode().value(), code, ex.getReason());
    }

    // 2. Xử lý Custom Error từ các Service ném ra
    @ExceptionHandler({
            AuthService.AuthServiceError.class,
            CartService.CartServiceError.class,
            CheckoutSessionService.CheckoutSessionServiceError.class,
            PayOSService.PayOSServiceError.class
    })
    public ResponseEntity<ErrorResponse> handleServiceErrors(RuntimeException ex) {
        int statusCode = 400; // Mặc định
        try {
            // Dùng Reflection để lấy statusCode từ class con
            statusCode = (int) ex.getClass().getMethod("getStatusCode").invoke(ex);
        } catch (Exception ignored) {}

        String code = getDefaultCodeForStatus(statusCode);
        return buildErrorResponse(statusCode, code, ex.getMessage());
    }

    // 3. Xử lý lỗi Validate (@Valid) từ DTO
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> details = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                details.put(error.getField(), error.getDefaultMessage())
        );

        ErrorResponse res = new ErrorResponse();
        ErrorResponse.ErrorBody body = new ErrorResponse.ErrorBody();
        body.setStatusCode(400);
        body.setCode("VALIDATION_ERROR");
        body.setMessage("Request validation failed");
        body.setDetails(details);
        res.setError(body);

        return ResponseEntity.status(400).body(res);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        return buildErrorResponse(415, "UNSUPPORTED_MEDIA_TYPE", "Request must be multipart/form-data");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return buildErrorResponse(405, "METHOD_NOT_ALLOWED", "Request method is not supported");
    }

    @ExceptionHandler({
            MissingServletRequestPartException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<ErrorResponse> handleMissingMultipartFields(Exception ex) {
        return buildErrorResponse(400, "BAD_REQUEST", "faceImage, productId, and variantSku are required");
    }

    // 4. Bắt toàn bộ lỗi rác / lỗi hệ thống chưa lường trước
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllOtherExceptions(Exception ex) {
        ex.printStackTrace(); // Log ra console để debug
        return buildErrorResponse(500, "INTERNAL_SERVER_ERROR", "Internal server error");
    }

    // --- Hàm tiện ích ---
    private ResponseEntity<ErrorResponse> buildErrorResponse(int statusCode, String code, String message) {
        ErrorResponse res = new ErrorResponse();
        ErrorResponse.ErrorBody body = new ErrorResponse.ErrorBody();
        body.setStatusCode(statusCode);
        body.setCode(code);
        body.setMessage(message);
        res.setError(body);
        return ResponseEntity.status(statusCode).body(res);
    }

    private String getDefaultCodeForStatus(int statusCode) {
        return switch (statusCode) {
            case 400 -> "BAD_REQUEST";
            case 401 -> "UNAUTHORIZED";
            case 403 -> "FORBIDDEN";
            case 404 -> "NOT_FOUND";
            case 409 -> "CONFLICT";
            case 429 -> "TOO_MANY_REQUESTS";
            default -> statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR";
        };
    }
}
