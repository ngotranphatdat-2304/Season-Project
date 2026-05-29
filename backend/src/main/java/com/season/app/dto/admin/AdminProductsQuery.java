package com.season.app.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminProductsQuery {
    @NotNull
    @Min(1)
    private Integer page;

    @NotNull
    @Min(1)
    private Integer limit;

    private String q;
    private String collectionId;
    private Boolean isActive;
}

