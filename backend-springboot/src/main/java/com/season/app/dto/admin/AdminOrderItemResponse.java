package com.season.app.dto.admin;

import lombok.Data;

@Data
public class AdminOrderItemResponse {
    private String productId;
    private String productName;
    private String variantSku;
    private Integer quantity;
    private Double unitPrice;
    private Double lineTotal;
}

