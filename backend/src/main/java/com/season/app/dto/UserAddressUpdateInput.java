package com.season.app.dto;

import lombok.Data;

@Data
public class UserAddressUpdateInput {
    // Cập nhật thì tất cả đều là optional
    private String label;
    private String address;
    private Boolean isDefault;
}