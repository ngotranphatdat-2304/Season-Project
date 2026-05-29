package com.season.app.dto.product;

import java.util.List;
import lombok.Data;

@Data
public class ProductSearchResponseData {
    private List<SearchProductResponse> records;
    private Long total;
}

