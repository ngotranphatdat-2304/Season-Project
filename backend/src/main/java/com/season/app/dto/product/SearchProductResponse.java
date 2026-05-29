package com.season.app.dto.product;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SearchProductResponse extends ProductResponse {
    private Double score;
}

