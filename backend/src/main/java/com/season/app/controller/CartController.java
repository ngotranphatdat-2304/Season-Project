package com.season.app.controller;

import com.season.app.dto.cart.*;
import com.season.app.service.CartService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    private String resolveUserId(Principal principal) {
        return principal != null ? principal.getName() : null;
    }

    @GetMapping("/bootstrap")
    public ResponseEntity<Void> bootstrapGuestCartSession(
            @CookieValue(name = "guestId", required = false) String guestId,
            HttpServletResponse response,
            Principal principal) {
            
        if (principal == null && (guestId == null || guestId.trim().isEmpty())) {
            String newGuestId = UUID.randomUUID().toString();
            Cookie cookie = new Cookie("guestId", newGuestId);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(7 * 24 * 60 * 60);
            response.addCookie(cookie);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<CartResponseData> getCart(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId) {
        return ResponseEntity.ok(cartService.getCartForOwner(resolveUserId(principal), guestId));
    }

    // --- SKU-based Endpoints ---
    @PostMapping
    public ResponseEntity<CartResponseData> addCartSkuItem(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId,
            @Valid @RequestBody CartSkuInput input) {
        return ResponseEntity.ok(cartService.addSkuItemToCart(resolveUserId(principal), guestId, input));
    }

    @PutMapping("/{sku}")
    public ResponseEntity<CartResponseData> updateCartSkuItem(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId,
            @PathVariable("sku") String sku,
            @Valid @RequestBody CartSkuInput input) {
        input.setSku(sku); 
        return ResponseEntity.ok(cartService.updateSkuCartItemQuantity(resolveUserId(principal), guestId, input));
    }

    @DeleteMapping("/{sku}")
    public ResponseEntity<CartResponseData> removeCartSkuItem(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId,
            @PathVariable("sku") String sku) {
        return ResponseEntity.ok(cartService.removeSkuItemFromCart(resolveUserId(principal), guestId, sku));
    }

    // --- Product ID-based Endpoints (Đồng bộ với cart.route.ts) ---
    @PostMapping("/items")
    public ResponseEntity<CartResponseData> addCartItem(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId,
            @Valid @RequestBody AddCartItemInput input) {
        return ResponseEntity.ok(cartService.addItemToCart(resolveUserId(principal), guestId, input));
    }

    @PatchMapping("/items/{productId}")
    public ResponseEntity<CartResponseData> updateCartItem(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId,
            @PathVariable("productId") String productId,
            @Valid @RequestBody UpdateCartItemInput input) {
        input.setProductId(productId);
        return ResponseEntity.ok(cartService.updateCartItemQuantity(resolveUserId(principal), guestId, input));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<CartResponseData> removeCartItem(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId,
            @PathVariable("productId") String productId) {
        return ResponseEntity.ok(cartService.removeItemFromCart(resolveUserId(principal), guestId, productId));
    }

    @DeleteMapping
    public ResponseEntity<CartResponseData> clearCart(
            Principal principal,
            @CookieValue(name = "guestId", required = false) String guestId) {
        return ResponseEntity.ok(cartService.clearCartForOwner(resolveUserId(principal), guestId));
    }
}