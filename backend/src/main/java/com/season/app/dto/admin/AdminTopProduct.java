package com.season.app.dto.admin;

import lombok.Data;

@Data
public class AdminTopProduct {
    private String productId;
    private String productName;
    private Long unitsSold;
    private Double revenue;
}

