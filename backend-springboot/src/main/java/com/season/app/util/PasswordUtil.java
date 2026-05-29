package com.season.app.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public final class PasswordUtil {
    private static final int PASSWORD_SALT_ROUNDS = 12;
    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(PASSWORD_SALT_ROUNDS);

    private PasswordUtil() {
    }

    public static String hashPassword(String password) {
        return ENCODER.encode(password);
    }

    public static boolean comparePassword(String enteredPassword, String savedPassword) {
        return ENCODER.matches(enteredPassword, savedPassword);
    }
}

