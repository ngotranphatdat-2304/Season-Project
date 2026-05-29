package com.season.app.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public final class JwtUtil {
    private JwtUtil() {
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

    public static UnsupportedOperationException notYetMigrated() {
        return new UnsupportedOperationException(
                "JWT sign/verify migration is pending. Add JWT provider (JJWT/Nimbus) and wire app.jwt.* properties.");
    }
}

