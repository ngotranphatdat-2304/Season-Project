package com.season.app.service;

import java.security.SecureRandom;
import org.springframework.stereotype.Service;

@Service
public class CheckoutSessionService {
    private static final int CHECKOUT_TOKEN_BYTES = 12;
    private final SecureRandom secureRandom = new SecureRandom();

    public String createCheckoutToken() {
        byte[] bytes = new byte[CHECKOUT_TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        StringBuilder builder = new StringBuilder();
        for (byte b : bytes) {
            builder.append(String.format("%02x", b));
        }
        return builder.toString();
    }

    public static class CheckoutSessionServiceError extends RuntimeException {
        private final int statusCode;

        public CheckoutSessionServiceError(String message, int statusCode) {
            super(message);
            this.statusCode = statusCode;
        }

        public int getStatusCode() {
            return statusCode;
        }
    }
}

