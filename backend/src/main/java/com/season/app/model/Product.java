package com.season.app.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "products")
public class Product {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String slug;

    // @org.springframework.data.mongodb.core.mapping.Field(targetType = org.springframework.data.mongodb.core.mapping.FieldType.OBJECT_ID)
    private String collectionId;

    private String brand;

    @Builder.Default
    private Integer salePercent = 0;

    @Builder.Default
    private ProductAvailability availability = ProductAvailability.IN_STOCK;

    private String description;

    @Builder.Default
    private List<Variant> variants = new ArrayList<>();

    @Builder.Default
    private Rating rating = Rating.builder().build();

    @Builder.Default
    private Boolean isActive = true;

    private ProductType type;

    private Specifications specifications;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public enum FrameMaterial {
        Acetate,
        Metal
    }

    public enum FrameSize {
        Small,
        Medium,
        Big
    }

    public enum ProductGender {
        Male,
        Female,
        Unisex
    }

    public enum ProductAvailability {
        IN_STOCK("in_stock"),
        OUT_OF_STOCK("out_of_stock"),
        PRE_ORDER("pre_order");

        private final String value;

        ProductAvailability(String value) {
            this.value = value;
        }

        @JsonValue
        public String getValue() {
            return value;
        }

        @JsonCreator
        public static ProductAvailability fromValue(String value) {
            for (ProductAvailability availability : values()) {
                if (availability.value.equals(value)) {
                    return availability;
                }
            }
            throw new IllegalArgumentException("Unknown availability: " + value);
        }
    }

    public enum ProductType {
        EYEGLASSES("Eyeglasses"),
        SUNGLASSES("Sunglasses");

        private final String value;

        ProductType(String value) {
            this.value = value;
        }

        @JsonValue
        public String getValue() {
            return value;
        }

        @JsonCreator
        public static ProductType fromValue(String value) {
            for (ProductType type : values()) {
                if (type.value.equals(value)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Unknown product type: " + value);
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Rating {

        @Builder.Default
        private Double avg = 0.0;

        @Builder.Default
        private Integer count = 0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Variant {

        private String sku;

        private String color;

        private Double price;

        @Builder.Default
        private List<String> images = new ArrayList<>();

        @Builder.Default
        private Boolean isDefault = false;

        private Integer stock;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Specifications {

        private FrameType frameType;

        @Builder.Default
        private ProductGender gender = ProductGender.Unisex;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FrameType {

        private FrameMaterial material;

        private FrameSizeDetail size;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FrameSizeDetail {

        private FrameSize label;

        private String image;
    }
}
