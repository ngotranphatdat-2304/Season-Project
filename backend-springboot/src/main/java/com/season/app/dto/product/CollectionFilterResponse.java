package com.season.app.dto.product;

import lombok.Data;

@Data
public class CollectionFilterResponse {
    private String id;
    private String name;
    private String slug;
    private Integer inStockCount;
}

