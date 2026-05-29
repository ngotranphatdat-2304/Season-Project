package com.season.app.dto.admin;

import com.season.app.model.Product;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminFrameSizeInput {
    @NotNull(message = "label is required")
    private Product.FrameSize label;

    @NotBlank(message = "image is required")
    private String image;
}

