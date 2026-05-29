package com.season.app.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

// Sử dụng ResponseStatusException để Spring tự động trả về HTTP Status code tương ứng
public class UserServiceException extends ResponseStatusException {
    public UserServiceException(HttpStatus status, String reason) {
        super(status, reason);
    }
}