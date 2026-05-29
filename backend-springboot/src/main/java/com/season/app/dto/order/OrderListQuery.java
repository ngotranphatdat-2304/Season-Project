package com.season.app.dto.order;

import com.season.app.model.Order;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderListQuery {
    @NotNull
    @Min(1)
    private Integer page;

    @NotNull
    @Min(1)
    private Integer limit;

    private Order.OrderStatus status;
}

