package com.season.app.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class AdminRegisterInput extends RegisterInput {
    @NotBlank(message = "adminSecret is required")
    private String adminSecret;
}

