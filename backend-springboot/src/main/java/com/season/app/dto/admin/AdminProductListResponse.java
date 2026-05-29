package com.season.app.dto.admin;

import java.util.List;
import lombok.Data;

@Data
public class AdminProductListResponse {
    private List<AdminProductResponse> records;
    private Long total;
    private Integer page;
    private Integer limit;
    private Integer totalPages;
}

