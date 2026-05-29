package com.season.app.dto.product;

import com.season.app.model.Product;
import java.util.List;
import lombok.Data;

@Data
public class BaseProductResponse {
    private String id;
    private String name;
    private String slug;
    private Product.ProductType type;
    private String brand;
    private String collectionId;
    private Integer salePercent;
    private Product.ProductAvailability availability;
    private String description;
    private List<Product.Variant> variants;
    private Product.Rating rating;
    private Boolean isActive;
}

