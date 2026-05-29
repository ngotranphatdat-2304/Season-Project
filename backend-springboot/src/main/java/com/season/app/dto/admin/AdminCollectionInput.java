package com.season.app.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminCollectionInput {
    @NotBlank(message = "name is required")
    private String name;

    @NotBlank(message = "slug is required")
    private String slug;
}

