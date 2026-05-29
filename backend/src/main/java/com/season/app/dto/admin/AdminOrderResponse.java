package com.season.app.dto.admin;

import com.season.app.model.Order;
import java.time.Instant;
import java.util.List;
import lombok.Data;

@Data
public class AdminOrderResponse {
    private String id;
    private String userId;
    private String customerName;
    private String customerEmail;
    private List<AdminOrderItemResponse> items;
    private Order.OrderStatus status;
    private Order.PaymentStatus paymentStatus;
    private Order.PaymentMethod paymentMethod;
    private Order.ShippingAddress shippingAddress;
    private Double subtotalAmount;
    private Double discountAmount;
    private Double shippingFee;
    private Double taxAmount;
    private Double totalAmount;
    private String currency;
    private Instant placedAt;
    private Instant cancelledAt;
    private Instant deliveredAt;
    private Instant createdAt;
    private Instant updatedAt;
}

