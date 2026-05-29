package com.season.app.service;

import com.season.app.dto.auth.AuthUserResponse;
import com.season.app.dto.auth.LoginInput;
import com.season.app.dto.auth.LoginResponseData;
import com.season.app.dto.auth.LogoutResponseData;
import com.season.app.dto.auth.RefreshTokenInput;
import com.season.app.dto.auth.RefreshTokenResponseData;
import com.season.app.dto.auth.RegisterInput;
import com.season.app.dto.auth.RegisterResponseData;
import com.season.app.model.User;
import com.season.app.repository.UserRepository;
import com.season.app.util.JwtUtil;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final String adminRegistrationSecret;

    public AuthService(
            UserRepository userRepository,
            @Value("${app.admin.registration-secret:}") String adminRegistrationSecret
    ) {
        this.userRepository = userRepository;
        this.adminRegistrationSecret = adminRegistrationSecret;
    }

    public RegisterResponseData registerUser(RegisterInput input) {
        return registerUserByRole(input, "customer");
    }

    public RegisterResponseData registerAdmin(RegisterInput input, String providedAdminSecret) {
        if (adminRegistrationSecret == null || adminRegistrationSecret.trim().isEmpty()) {
            throw new AuthServiceError("Admin registration is not configured", HttpStatus.FORBIDDEN.value());
        }

        if (providedAdminSecret == null || providedAdminSecret.equals(adminRegistrationSecret) == false) {
            throw new AuthServiceError("Admin registration secret is invalid", HttpStatus.FORBIDDEN.value());
        }

        return registerUserByRole(input, "admin");
    }

    public LoginResponseData loginUser(LoginInput input) {
        throw JwtUtil.notYetMigrated();
    }

    public RefreshTokenResponseData refreshAccessToken(RefreshTokenInput input) {
        throw JwtUtil.notYetMigrated();
    }

    public LogoutResponseData logoutSession(RefreshTokenInput input) {
        LogoutResponseData response = new LogoutResponseData();
        response.setMessage("Logged out");
        return response;
    }

    public AuthUserResponse getCurrentAuthUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthServiceError("User not found", HttpStatus.NOT_FOUND.value()));

        if (Boolean.FALSE.equals(user.getIsActive()) || "active".equals(user.getStatus()) == false) {
            throw new AuthServiceError("User not found", HttpStatus.NOT_FOUND.value());
        }

        return toAuthUserResponse(user);
    }

    private RegisterResponseData registerUserByRole(RegisterInput input, String role) {
        String email = normalizeEmail(input.getEmail());
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            throw new AuthServiceError("Email is already registered", HttpStatus.CONFLICT.value());
        }

        User user = User.builder()
                .email(email)
                .password(input.getPassword())
                .name(input.getName() == null ? null : input.getName().trim())
                .phone(input.getPhone())
                .role(role)
                .build();

        User savedUser = userRepository.save(user);

        RegisterResponseData response = new RegisterResponseData();
        response.setUser(toAuthUserResponse(savedUser));
        return response;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private AuthUserResponse toAuthUserResponse(User user) {
        AuthUserResponse response = new AuthUserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setPhone(user.getPhone());
        response.setAvatar(user.getAvatar());
        response.setRole(user.getRole());
        response.setStatus(user.getStatus());
        response.setIsActive(Boolean.FALSE.equals(user.getIsActive()) == false);
        return response;
    }

    public static class AuthServiceError extends RuntimeException {
        private final int statusCode;

        public AuthServiceError(String message, int statusCode) {
            super(message);
            this.statusCode = statusCode;
        }

        public int getStatusCode() {
            return statusCode;
        }
    }
}

