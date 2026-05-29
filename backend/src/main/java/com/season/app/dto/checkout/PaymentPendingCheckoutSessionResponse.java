package com.season.app.dto.checkout;

import lombok.Data;

@Data
public class PaymentPendingCheckoutSessionResponse {
    private String status = "payment_pending";
    private String redirectTo;
}

