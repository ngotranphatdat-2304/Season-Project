package com.season.app.service;

import com.season.app.model.Order;
import com.season.app.util.DateTimeUtil;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AdminService {
    public boolean isCompletedOrder(Order order) {
        return order.getStatus() == Order.OrderStatus.DELIVERED
                && order.getPaymentStatus() == Order.PaymentStatus.PAID;
    }

    public List<DateTimeUtil.DayLabel> getLastSevenDays() {
        return DateTimeUtil.getLastSevenDays();
    }
}

