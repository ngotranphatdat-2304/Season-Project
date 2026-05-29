package com.season.app.dto.checkout;

import lombok.Data;

@Data
public class CheckoutPayOSInitResponse {
    private String orderId;
    private String token;
    private String checkoutUrl;
}

