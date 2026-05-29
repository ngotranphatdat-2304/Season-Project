package com.season.app.dto.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateCartItemInput {
    @NotBlank(message = "productId is required")
    private String productId;

    @NotNull(message = "quantity is required")
    @Min(value = 1, message = "quantity must be >= 1")
    private Integer quantity;
}

