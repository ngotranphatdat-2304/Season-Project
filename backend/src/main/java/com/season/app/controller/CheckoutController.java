package com.season.app.controller;

import com.season.app.dto.checkout.CheckoutCompleteInput;
import com.season.app.dto.checkout.CheckoutCompleteResponse;
import com.season.app.dto.checkout.CheckoutInitResponse;
import com.season.app.dto.checkout.CheckoutPayOSInitResponse;
import com.season.app.dto.checkout.CheckoutPaymentStatusResponse;
import com.season.app.service.CheckoutSessionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    @Autowired
    private CheckoutSessionService checkoutSessionService;

    @PostMapping("/init")
    public ResponseEntity<CheckoutInitResponse> initCheckout(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId) {
        
        String ownerId = principal != null ? principal.getName() : guestId;
        boolean isUser = principal != null;
        
        CheckoutInitResponse response = checkoutSessionService.createCheckoutSession(ownerId, isUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{token}")
    public ResponseEntity<?> getCheckoutSession(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId,
            @PathVariable("token") String token) {
        
        String ownerId = principal != null ? principal.getName() : guestId;
        boolean isUser = principal != null;

        return ResponseEntity.ok(checkoutSessionService.getCheckoutSessionByToken(token, ownerId, isUser));
    }

    @PostMapping("/{token}/complete")
    public ResponseEntity<CheckoutCompleteResponse> completeCheckout(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId,
            @PathVariable("token") String token,
            @Valid @RequestBody CheckoutCompleteInput input) {
        
        String ownerId = principal != null ? principal.getName() : guestId;
        boolean isUser = principal != null;

        CheckoutCompleteResponse response = checkoutSessionService.completeCheckoutSession(token, ownerId, isUser, input);
        return ResponseEntity.ok(response);
    }

    // --- Endpoint tích hợp PayOS (Mới bổ sung để đồng bộ thiết lập checkout-api.ts) ---
    @PostMapping("/{token}/payos")
    public ResponseEntity<CheckoutPayOSInitResponse> initPayOSPayment(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId,
            @PathVariable("token") String token,
            @Valid @RequestBody CheckoutCompleteInput input) {
            
        String ownerId = principal != null ? principal.getName() : guestId;
        boolean isUser = principal != null;

        CheckoutPayOSInitResponse response = checkoutSessionService.initPayOSPayment(token, ownerId, isUser, input);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payment-status")
    public ResponseEntity<CheckoutPaymentStatusResponse> getPaymentStatus(
            @RequestParam("token") String token,
            @RequestParam("orderId") String orderId) {
            
        CheckoutPaymentStatusResponse response = checkoutSessionService.getPaymentStatus(token, orderId);
        return ResponseEntity.ok(response);
    }
}