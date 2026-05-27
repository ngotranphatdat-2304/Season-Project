package com.season.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserAddressInput {
    
    private String label; // Optional
    
    @NotBlank(message = "address is required")
    private String address;
    
    private Boolean isDefault; // Optional
}
