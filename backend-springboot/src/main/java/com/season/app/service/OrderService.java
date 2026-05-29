package com.season.app.service;

import com.season.app.model.Order;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private static final Map<Order.OrderStatus, List<Order.OrderStatus>> ORDER_STATUS_TRANSITIONS = Map.of(
            Order.OrderStatus.PENDING, List.of(Order.OrderStatus.CONFIRMED, Order.OrderStatus.SHIPPED, Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED),
            Order.OrderStatus.CONFIRMED, List.of(Order.OrderStatus.SHIPPED, Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED),
            Order.OrderStatus.SHIPPED, List.of(Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED),
            Order.OrderStatus.DELIVERED, List.of(),
            Order.OrderStatus.CANCELLED, List.of()
    );

    public boolean isOrderStatusTransitionAllowed(Order.OrderStatus currentStatus, Order.OrderStatus nextStatus) {
        if (currentStatus == nextStatus) {
            return true;
        }
        return ORDER_STATUS_TRANSITIONS.getOrDefault(currentStatus, List.of()).contains(nextStatus);
    }

    public boolean isRetryableCheckoutConflict(Throwable error) {
        if (error == null) {
            return false;
        }

        String message = error.getMessage();
        if (message == null || message.trim().isEmpty()) {
            return false;
        }

        return message.contains("WriteConflict")
                || message.contains("TemporarilyUnavailable")
                || message.contains("TransientTransactionError")
                || message.contains("UnknownTransactionCommitResult");
    }
}

