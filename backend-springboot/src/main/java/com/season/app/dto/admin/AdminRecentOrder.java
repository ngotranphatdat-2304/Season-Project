package com.season.app.dto.admin;

import com.season.app.model.Order;
import java.time.Instant;
import lombok.Data;

@Data
public class AdminRecentOrder {
    private String id;
    private String customerName;
    private String customerEmail;
    private Double totalAmount;
    private Order.OrderStatus status;
    private Order.PaymentStatus paymentStatus;
    private Instant placedAt;
}

