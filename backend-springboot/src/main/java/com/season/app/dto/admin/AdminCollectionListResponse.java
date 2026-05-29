package com.season.app.dto.admin;

import java.util.List;
import lombok.Data;

@Data
public class AdminCollectionListResponse {
    private List<AdminCollectionResponse> records;
    private Long total;
}

