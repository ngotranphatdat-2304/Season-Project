package com.season.app.controller;

import com.season.app.dto.auth.*;
import com.season.app.service.AuthService;
import com.season.app.service.CartService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private CartService cartService;

    private void clearGuestCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("guestId", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseData> login(
            @Valid @RequestBody LoginInput input,
            @CookieValue(name = "guestId", required = false) String guestId,
            HttpServletResponse response) {
            
        LoginResponseData data = authService.loginUser(input);
        if (cartService.mergeGuestCartIntoUserCart(data.getUser().getId(), guestId)) {
            clearGuestCookie(response);
        }
        return ResponseEntity.ok(data);
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseData> register(
            @Valid @RequestBody RegisterInput input,
            @CookieValue(name = "guestId", required = false) String guestId,
            HttpServletResponse response) {
            
        RegisterResponseData data = authService.registerUser(input);
        if (cartService.mergeGuestCartIntoUserCart(data.getUser().getId(), guestId)) {
            clearGuestCookie(response);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(data);
    }

    @PostMapping("/admin/register")
    public ResponseEntity<RegisterResponseData> adminRegister(
            @Valid @RequestBody AdminRegisterInput input,
            @CookieValue(name = "guestId", required = false) String guestId,
            HttpServletResponse response) {
            
        RegisterResponseData data = authService.registerAdmin(input, input.getAdminSecret());
        if (cartService.mergeGuestCartIntoUserCart(data.getUser().getId(), guestId)) {
            clearGuestCookie(response);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(data);
    }

    @PostMapping("/admin/login")
    public ResponseEntity<LoginResponseData> adminLogin(@Valid @RequestBody LoginInput input) {
        LoginResponseData response = authService.loginUser(input);
        if (!"admin".equals(response.getUser().getRole())) {
            throw new AuthService.AuthServiceError("Admin account is required", HttpStatus.FORBIDDEN.value());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<RefreshTokenResponseData> refreshToken(@Valid @RequestBody RefreshTokenInput input) {
        RefreshTokenResponseData response = authService.refreshAccessToken(input);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponseData> logout(@Valid @RequestBody RefreshTokenInput input) {
        LogoutResponseData response = authService.logoutSession(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.ok(null);
        }
        AuthUserResponse response = authService.getCurrentAuthUser(principal.getName());
        return ResponseEntity.ok(response);
    }
}