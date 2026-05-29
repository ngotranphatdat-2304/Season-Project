package com.season.app.service;

import com.season.app.dto.auth.*;
import com.season.app.model.RefreshToken;
import com.season.app.model.User;
import com.season.app.repository.RefreshTokenRepository;
import com.season.app.repository.UserRepository;
import com.season.app.util.JwtUtil;
import io.jsonwebtoken.Claims;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CartService cartService;

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
        if (providedAdminSecret == null || !providedAdminSecret.equals(adminRegistrationSecret)) {
            throw new AuthServiceError("Admin registration secret is invalid", HttpStatus.FORBIDDEN.value());
        }
        return registerUserByRole(input, "admin");
    }

    public LoginResponseData loginUser(LoginInput input) {
        String email = normalizeEmail(input.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthServiceError("Email or password is incorrect", HttpStatus.UNAUTHORIZED.value()));

        if (!passwordEncoder.matches(input.getPassword(), user.getPassword())) {
            throw new AuthServiceError("Email or password is incorrect", HttpStatus.UNAUTHORIZED.value());
        }

        if ("banned".equals(user.getStatus()) || Boolean.FALSE.equals(user.getIsActive())) {
            throw new AuthServiceError("This account has been banned", HttpStatus.FORBIDDEN.value());
        }

        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);
        String refreshTokenHash = JwtUtil.hashRefreshToken(refreshToken);

        RefreshToken rt = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(refreshTokenHash)
                .expiresAt(jwtUtil.validateRefreshToken(refreshToken).getExpiration().toInstant())
                .build();
        refreshTokenRepository.save(rt);

        LoginResponseData response = new LoginResponseData();
        response.setUser(toAuthUserResponse(user));
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);

        return response;
    }

    public RefreshTokenResponseData refreshAccessToken(RefreshTokenInput input) {
        Claims claims;
        try {
            claims = jwtUtil.validateRefreshToken(input.getRefreshToken());
        } catch (Exception e) {
            throw new AuthServiceError("Refresh token is invalid or expired", HttpStatus.UNAUTHORIZED.value());
        }

        String userId = claims.getSubject();
        String tokenHash = JwtUtil.hashRefreshToken(input.getRefreshToken());

        // Tìm token cũ, thu hồi (revoke) để xoay vòng token bảo mật
        Optional<RefreshToken> storedTokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);
        if (storedTokenOpt.isEmpty() || storedTokenOpt.get().getRevokedAt() != null || storedTokenOpt.get().getExpiresAt().isBefore(Instant.now())) {
            // Nghi vấn bị tấn công giả mạo token -> Xoá tất cả token cũ của user
            refreshTokenRepository.deleteByUserId(userId);
            throw new AuthServiceError("Refresh token is invalid or expired", HttpStatus.UNAUTHORIZED.value());
        }

        RefreshToken storedToken = storedTokenOpt.get();
        storedToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(storedToken);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthServiceError("User not found", HttpStatus.NOT_FOUND.value()));

        if ("banned".equals(user.getStatus()) || Boolean.FALSE.equals(user.getIsActive())) {
            refreshTokenRepository.deleteByUserId(userId);
            throw new AuthServiceError("Refresh token is invalid or expired", HttpStatus.UNAUTHORIZED.value());
        }

        String newAccessToken = jwtUtil.generateAccessToken(user);
        String newRefreshToken = jwtUtil.generateRefreshToken(user);
        String newRefreshTokenHash = JwtUtil.hashRefreshToken(newRefreshToken);

        RefreshToken nextToken = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(newRefreshTokenHash)
                .expiresAt(jwtUtil.validateRefreshToken(newRefreshToken).getExpiration().toInstant())
                .build();
        refreshTokenRepository.save(nextToken);

        RefreshTokenResponseData response = new RefreshTokenResponseData();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(newRefreshToken);
        return response;
    }

    public LogoutResponseData logoutSession(RefreshTokenInput input) {
        try {
            Claims claims = jwtUtil.validateRefreshToken(input.getRefreshToken());
            String userId = claims.getSubject();
            String tokenHash = JwtUtil.hashRefreshToken(input.getRefreshToken());

            Optional<RefreshToken> rtOpt = refreshTokenRepository.findByTokenHash(tokenHash);
            if (rtOpt.isPresent()) {
                refreshTokenRepository.delete(rtOpt.get());
                cartService.clearCartForUser(userId);
            }
        } catch (Exception e) {
            String tokenHash = JwtUtil.hashRefreshToken(input.getRefreshToken());
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(rt -> refreshTokenRepository.delete(rt));
        }

        LogoutResponseData response = new LogoutResponseData();
        response.setMessage("Logged out");
        return response;
    }

    public AuthUserResponse getCurrentAuthUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthServiceError("User not found", HttpStatus.NOT_FOUND.value()));

        if (Boolean.FALSE.equals(user.getIsActive()) || !"active".equals(user.getStatus())) {
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
                .password(passwordEncoder.encode(input.getPassword()))
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
        public int getStatusCode() { return statusCode; }
    }
}