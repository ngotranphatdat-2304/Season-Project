package com.season.app.dto.auth;

import lombok.Data;

@Data
public class LoginResponseData {
    private AuthUserResponse user;
    private String accessToken;
    private String refreshToken;
}

