package com.season.app.dto.checkout;

import com.season.app.model.CheckoutSession;
import com.season.app.model.Order;
import java.util.List;
import lombok.Data;

@Data
public class CompletedCheckoutSessionResponse {
    private String status = "completed";
    private String redirectTo;
    private OrderSummary order;

    @Data
    public static class OrderSummary {
        private String orderId;
        private String customerEmail;
        private Order.PaymentMethod paymentMethod;
        private Order.ShippingAddress shippingAddress;
        private List<CheckoutSession.ItemSnapshot> items;
        private Double subtotalAmount;
        private Double shippingFee;
        private Double totalAmount;
        private String currency;
    }
}

