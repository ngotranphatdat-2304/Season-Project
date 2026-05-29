package com.season.app.dto.admin;

import com.season.app.model.Order;
import lombok.Data;

@Data
public class AdminOrderUpdateInput {
    private Order.OrderStatus status;
    private Order.PaymentStatus paymentStatus;
}

