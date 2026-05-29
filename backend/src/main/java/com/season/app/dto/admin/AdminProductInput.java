package com.season.app.dto.admin;

import com.season.app.model.Product;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class AdminProductInput {
    @NotBlank(message = "name is required")
    private String name;

    @NotBlank(message = "slug is required")
    private String slug;

    @NotNull(message = "type is required")
    private Product.ProductType type;

    @NotBlank(message = "collectionId is required")
    private String collectionId;

    @NotBlank(message = "brand is required")
    private String brand;

    @NotNull(message = "salePercent is required")
    @Min(value = 0, message = "salePercent must be >= 0")
    @Max(value = 100, message = "salePercent must be <= 100")
    private Integer salePercent;

    @NotNull(message = "availability is required")
    private Product.ProductAvailability availability;

    @NotBlank(message = "description is required")
    private String description;

    @NotNull(message = "isActive is required")
    private Boolean isActive;

    @NotNull(message = "specifications is required")
    @Valid
    private SpecificationsInput specifications;

    @NotNull(message = "variants is required")
    @Valid
    private List<AdminProductVariantInput> variants;

    @Data
    public static class SpecificationsInput {
        @NotNull(message = "gender is required")
        private Product.ProductGender gender;

        @NotNull(message = "frameType is required")
        @Valid
        private FrameTypeInput frameType;
    }

    @Data
    public static class FrameTypeInput {
        @NotNull(message = "material is required")
        private Product.FrameMaterial material;

        @NotNull(message = "size is required")
        @Valid
        private AdminFrameSizeInput size;
    }
}

