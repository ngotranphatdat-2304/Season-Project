package com.season.app.dto.auth;

import lombok.Data;

@Data
public class RefreshTokenResponseData {
    private String accessToken;
    private String refreshToken;
}

