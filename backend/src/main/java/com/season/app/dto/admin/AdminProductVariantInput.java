package com.season.app.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class AdminProductVariantInput {
    @NotBlank(message = "sku is required")
    private String sku;

    private String color;

    @NotNull(message = "price is required")
    @Min(value = 0, message = "price must be >= 0")
    private Double price;

    @NotNull(message = "images is required")
    private List<String> images;

    private String tryOnImage;

    private String tryOnModel;

    @NotNull(message = "isDefault is required")
    private Boolean isDefault;

    @NotNull(message = "stock is required")
    @Min(value = 0, message = "stock must be >= 0")
    private Integer stock;
}
