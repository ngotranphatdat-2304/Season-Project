package com.season.app.dto.checkout;

import com.season.app.model.Order;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutCompleteInput {
    @Email
    private String customerEmail;

    @NotNull(message = "shippingAddress is required")
    private Order.ShippingAddress shippingAddress;

    @NotNull(message = "paymentMethod is required")
    private Order.PaymentMethod paymentMethod; // cash_on_delivery | bank_transfer
}

