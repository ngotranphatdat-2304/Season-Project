package com.season.app.dto.checkout;

import lombok.Data;

@Data
public class CheckoutPaymentStatusResponse {
    private String status; // paid | pending | cancelled | failed | expired
    private String orderId;
    private String token;
    private String redirectTo;
    private String message;
}

