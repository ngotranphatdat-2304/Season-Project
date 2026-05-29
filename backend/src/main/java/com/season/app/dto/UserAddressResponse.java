package com.season.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.season.app.model.UserAddress;
import lombok.Data;

@Data
public class UserAddressResponse {
    
    @JsonProperty("_id") // Ép tên field thành _id khi biến thành JSON để ko làm hỏng Frontend
    private String id;
    
    private String label;
    private String address;
    private Boolean isDefault;

    // Constructor tự động map từ Database Model sang DTO
    public UserAddressResponse(UserAddress model) {
        this.id = model.getId();
        this.label = model.getLabel();
        this.address = model.getAddress();
        this.isDefault = model.getIsDefault();
    }
}