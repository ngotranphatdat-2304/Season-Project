package com.season.app.dto.admin;

import java.time.Instant;
import lombok.Data;

@Data
public class AdminCollectionResponse {
    private String id;
    private String name;
    private String slug;
    private Integer inStockCount;
    private Instant createdAt;
    private Instant updatedAt;
}

