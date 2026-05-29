package com.season.app.dto.product;

import com.season.app.model.Product;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ProductResponse extends BaseProductResponse {
    private Product.Specifications specifications;
}

