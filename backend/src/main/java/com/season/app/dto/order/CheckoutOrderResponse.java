package com.season.app.dto.order;

import com.season.app.model.Order;
import java.util.List;
import lombok.Data;

@Data
public class CheckoutOrderResponse {
    private String id;
    private String userId;
    private String guestId;
    private String customerEmail;
    private String checkoutToken;
    private List<CheckoutOrderItemResponse> items;
    private Order.OrderStatus status;
    private Order.PaymentStatus paymentStatus;
    private Order.PaymentMethod paymentMethod;
    private Order.ShippingAddress shippingAddress;
    private Double subtotalAmount;
    private Double totalAmount;
    private String currency;
}

