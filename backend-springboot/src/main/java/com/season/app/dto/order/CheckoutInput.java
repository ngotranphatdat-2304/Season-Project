package com.season.app.dto.order;

import com.season.app.model.Order;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutInput {
    @NotNull(message = "shippingAddress is required")
    private Order.ShippingAddress shippingAddress;

    private Order.PaymentMethod paymentMethod;
}

