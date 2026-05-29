package com.season.app.dto.cart;

import lombok.Data;

@Data
public class CartItemResponse {
    private String productId;
    private String productName;
    private String variantSku;
    private Double price;
    private Integer quantity;
    private Integer stock;
    private String image;
}

