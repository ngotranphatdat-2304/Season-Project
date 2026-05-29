package com.season.app.dto.admin;

import com.season.app.model.Order;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminOrdersQuery {
    @NotNull
    @Min(1)
    private Integer page;

    @NotNull
    @Min(1)
    private Integer limit;

    private Order.OrderStatus status;
    private Order.PaymentStatus paymentStatus;
}

