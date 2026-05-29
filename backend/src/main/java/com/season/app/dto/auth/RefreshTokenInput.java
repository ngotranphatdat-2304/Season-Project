package com.season.app.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenInput {
    @NotBlank(message = "refreshToken is required")
    private String refreshToken;
}

