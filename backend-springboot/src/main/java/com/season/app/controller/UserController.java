package com.season.app.controller;

import com.season.app.dto.*;
import com.season.app.model.UserAddress;
import com.season.app.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Helper: Lấy userId từ JWT thông qua Spring Security Principal.
     * Khi giải mã JWT ở Filter, ta sẽ set "subject" (tức là id của user) làm tên của Principal.
     */
    private String getUserId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid user request");
        }
        return principal.getName();
    }

    // ==========================================
    // 1. PROFILE & PASSWORD
    // ==========================================

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(Principal principal) {
        UserProfileResponse response = userService.getUserProfile(getUserId(principal));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            Principal principal, 
            @Valid @RequestBody UserProfileUpdateInput input) {
        
        // Kiểm tra logic manual giống file user.validation.ts của Node.js
        if (!input.hasAtLeastOneField()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide at least one profile field to update");
        }

        UserProfileResponse response = userService.updateUserProfile(getUserId(principal), input);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    public ResponseEntity<UserMessageResponse> changePassword(
            Principal principal, 
            @Valid @RequestBody ChangePasswordInput input) {
        
        UserMessageResponse response = userService.changeUserPassword(getUserId(principal), input);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    public ResponseEntity<UserMessageResponse> deleteMe(Principal principal) {
        UserMessageResponse response = userService.deactivateCurrentUser(getUserId(principal));
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 2. ADDRESSES
    // ==========================================

    @GetMapping("/addresses")
    public ResponseEntity<UserAddressListResponse> getAddresses(Principal principal) {
        List<UserAddress> addresses = userService.listUserAddresses(getUserId(principal));
        
        // Map từ List<UserAddress> sang List<UserAddressResponse> và bọc vào DTO
        List<UserAddressResponse> records = addresses.stream()
                .map(UserAddressResponse::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new UserAddressListResponse(records));
    }

    @PostMapping("/addresses")
    public ResponseEntity<UserProfileResponse> createAddress(
            Principal principal, 
            @Valid @RequestBody UserAddressInput input) {
        
        UserProfileResponse response = userService.addUserAddress(getUserId(principal), input);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/addresses/{addressId}/set-default")
    public ResponseEntity<UserProfileResponse> setDefaultAddress(
            Principal principal, 
            @PathVariable("addressId") String addressId) {
        
        UserProfileResponse response = userService.setDefaultUserAddress(getUserId(principal), addressId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/addresses/{addressId}")
    public ResponseEntity<UserProfileResponse> updateAddress(
            Principal principal,
            @PathVariable("addressId") String addressId,
            @Valid @RequestBody UserAddressUpdateInput input) {
        
        // Tương tự, ta check xem người dùng có truyền lên field nào không
        if (input.getAddress() == null && input.getLabel() == null && input.getIsDefault() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide at least one address field to update");
        }

        UserProfileResponse response = userService.updateUserAddress(getUserId(principal), addressId, input);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/addresses/{addressId}")
    public ResponseEntity<UserProfileResponse> deleteAddress(
            Principal principal, 
            @PathVariable("addressId") String addressId) {
        
        UserProfileResponse response = userService.deleteUserAddress(getUserId(principal), addressId);
        return ResponseEntity.ok(response);
    }
}