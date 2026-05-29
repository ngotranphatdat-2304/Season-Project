package com.season.app.dto.admin;

import java.util.List;
import lombok.Data;

@Data
public class AdminOrderListResponse {
    private List<AdminOrderResponse> records;
    private Long total;
    private Integer page;
    private Integer limit;
    private Integer totalPages;
}

