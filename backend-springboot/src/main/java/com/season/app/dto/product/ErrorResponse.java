package com.season.app.dto.product;

import lombok.Data;

@Data
public class ErrorResponse {
    private Boolean success = false;
    private ErrorBody error;

    @Data
    public static class ErrorBody {
        private Integer statusCode;
        private String code;
        private String message;
        private Object details;
    }
}

