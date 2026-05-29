package com.season.app.dto.order;

import lombok.Data;

@Data
public class CheckoutOrderItemResponse {
    private String productId;
    private String productName;
    private String variantSku;
    private Integer quantity;
    private Double unitPrice;
    private Double lineTotal;
}

