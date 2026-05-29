package com.season.app.dto.checkout;

import lombok.Data;

@Data
public class CheckoutCompleteResponse {
    private String orderId;
    private String token;
}

