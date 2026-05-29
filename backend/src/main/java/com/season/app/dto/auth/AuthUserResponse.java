package com.season.app.dto.auth;

import lombok.Data;

@Data
public class AuthUserResponse {
    private String id;
    private String email;
    private String name;
    private String phone;
    private String avatar;
    private String role;
    private String status;
    private Boolean isActive;
}

