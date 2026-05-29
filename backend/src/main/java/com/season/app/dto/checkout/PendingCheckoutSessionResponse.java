package com.season.app.dto.checkout;

import com.season.app.model.CheckoutSession;
import java.time.Instant;
import java.util.List;
import lombok.Data;

@Data
public class PendingCheckoutSessionResponse {
    private String status = "pending";
    private String token;
    private List<CheckoutSession.ItemSnapshot> items;
    private Integer itemCount;
    private Double subtotalAmount;
    private Double shippingFee;
    private Double totalAmount;
    private String currency;
    private Instant expiresAt;
}

