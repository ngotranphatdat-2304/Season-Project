package com.season.app.service;

import com.season.app.dto.cart.CartResponseData;
import com.season.app.model.Cart;
import com.season.app.repository.CartRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;

@Service
public class CartService {
    private static final long GUEST_CART_TTL_DAYS = 7;
    private final CartRepository cartRepository;

    public CartService(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    public Cart getOrCreateGuestCart(String guestId) {
        if (guestId == null || guestId.trim().isEmpty()) {
            throw new CartServiceError("Cart owner is required", 400);
        }

        return cartRepository.findByGuestId(guestId.trim())
                .map(existing -> {
                    existing.setExpiresAt(guestCartExpiryDate());
                    return cartRepository.save(existing);
                })
                .orElseGet(() -> cartRepository.save(Cart.builder()
                        .guestId(guestId.trim())
                        .expiresAt(guestCartExpiryDate())
                        .build()));
    }

    public void clearCartForUser(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return;
        }
        cartRepository.findByUserId(userId.trim()).ifPresent(cart -> {
            cart.setItems(java.util.List.of());
            cartRepository.save(cart);
        });
    }

    public CartResponseData emptyCartResponse() {
        CartResponseData response = new CartResponseData();
        response.setItems(java.util.List.of());
        return response;
    }

    private Instant guestCartExpiryDate() {
        return Instant.now().plus(GUEST_CART_TTL_DAYS, ChronoUnit.DAYS);
    }

    public static class CartServiceError extends RuntimeException {
        private final int statusCode;

        public CartServiceError(String message, int statusCode) {
            super(message);
            this.statusCode = statusCode;
        }

        public int getStatusCode() {
            return statusCode;
        }
    }
}

