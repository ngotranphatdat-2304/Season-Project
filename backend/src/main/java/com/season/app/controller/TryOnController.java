package com.season.app.controller;

import com.season.app.dto.tryon.TryOnGenerateResponse;
import com.season.app.service.TryOnService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/try-on")
public class TryOnController {
    private final TryOnService tryOnService;

    public TryOnController(TryOnService tryOnService) {
        this.tryOnService = tryOnService;
    }

    @PostMapping(value = "/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TryOnGenerateResponse> generateTryOn(
            @RequestParam("faceImage") MultipartFile faceImage,
            @RequestParam("productId") String productId,
            @RequestParam("variantSku") String variantSku,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(tryOnService.generateTryOn(faceImage, productId, variantSku, readClientIp(request)));
    }

    private String readClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && forwardedFor.trim().isEmpty() == false) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}
