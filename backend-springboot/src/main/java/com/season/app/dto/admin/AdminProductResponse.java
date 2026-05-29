package com.season.app.dto.admin;

import com.season.app.model.Product;
import java.time.Instant;
import java.util.List;
import lombok.Data;

@Data
public class AdminProductResponse {
    private String id;
    private String name;
    private String slug;
    private Product.ProductType type;
    private String collectionId;
    private String collectionName;
    private String brand;
    private Integer salePercent;
    private Product.ProductAvailability availability;
    private String description;
    private Boolean isActive;
    private SpecificationsResponse specifications;
    private List<Product.Variant> variants;
    private Product.Rating rating;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    public static class SpecificationsResponse {
        private Product.ProductGender gender;
        private FrameTypeResponse frameType;
    }

    @Data
    public static class FrameTypeResponse {
        private Product.FrameMaterial material;
        private AdminFrameSizeInput size;
    }
}

