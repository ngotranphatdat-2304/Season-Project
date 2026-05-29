package com.season.app.dto.cart;

import java.time.Instant;
import java.util.List;
import lombok.Data;

@Data
public class CartResponseData {
    private String id;
    private String ownerType; // "user" | "guest"
    private String userId;
    private String guestId;
    private Instant expiresAt;
    private List<CartItemResponse> items;
}

