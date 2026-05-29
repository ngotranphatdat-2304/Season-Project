package com.season.app.dto.product;

import java.util.List;
import lombok.Data;

@Data
public class ProductsResponseData {
    private List<ProductResponse> records;
    private Long total;
}

