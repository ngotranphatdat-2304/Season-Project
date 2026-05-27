package com.season.app.dto;

import com.season.app.model.User;
import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

@Data
public class UserProfileResponse {
    private String id;
    private String email;
    private String name;
    private String phone;
    private String avatar;
    private String role;
    private String status;
    private Boolean isActive;
    private List<UserAddressResponse> addresses;

    // Constructor tự động map từ Database Model sang DTO
    public UserProfileResponse(User model) {
        this.id = model.getId();
        this.email = model.getEmail();
        this.name = model.getName();
        this.phone = model.getPhone();
        this.avatar = model.getAvatar();
        this.role = model.getRole();
        this.status = model.getStatus();
        this.isActive = model.getIsActive();
        
        // Convert list UserAddress thành list UserAddressResponse
        if (model.getAddresses() != null) {
            this.addresses = model.getAddresses().stream()
                    .map(UserAddressResponse::new)
                    .collect(Collectors.toList());
        }
    }
}