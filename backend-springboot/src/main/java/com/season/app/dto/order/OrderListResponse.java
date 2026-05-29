package com.season.app.dto.order;

import java.util.List;
import lombok.Data;

@Data
public class OrderListResponse {
    private List<CheckoutOrderResponse> records;
    private Long total;
    private Integer page;
    private Integer limit;
    private Integer totalPages;
}

