package com.season.app.util;

import com.season.app.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    @Value("${app.jwt.access-secret}")
    private String accessSecret;

    @Value("${app.jwt.refresh-secret}")
    private String refreshSecret;

    @Value("${app.jwt.access-ttl}")
    private long accessTtlSeconds;

    @Value("${app.jwt.refresh-ttl}")
    private long refreshTtlSeconds;

    @Value("${app.jwt.issuer}")
    private String issuer;

    @Value("${app.jwt.audience}")
    private String audience;

    private SecretKey getAccessKey() {
        return Keys.hmacShaKeyFor(accessSecret.getBytes(StandardCharsets.UTF_8));
    }

    private SecretKey getRefreshKey() {
        return Keys.hmacShaKeyFor(refreshSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        return Jwts.builder()
                .subject(user.getId())
                .claim("role", user.getRole())
                .claim("tokenType", "access")
                .issuer(issuer)
                .audience().add(audience).and()
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTtlSeconds * 1000))
                .signWith(getAccessKey(), Jwts.SIG.HS256)
                .compact();
    }

    public String generateRefreshToken(User user) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString()) // jti
                .subject(user.getId())
                .claim("role", user.getRole())
                .claim("tokenType", "refresh")
                .issuer(issuer)
                .audience().add(audience).and()
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTtlSeconds * 1000))
                .signWith(getRefreshKey(), Jwts.SIG.HS256)
                .compact();
    }

    public Claims validateAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(getAccessKey())
                .requireAudience(audience)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims validateRefreshToken(String token) {
        return Jwts.parser()
                .verifyWith(getRefreshKey())
                .requireAudience(audience)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public static String hashRefreshToken(String refreshToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(refreshToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm not available", ex);
        }
    }
}