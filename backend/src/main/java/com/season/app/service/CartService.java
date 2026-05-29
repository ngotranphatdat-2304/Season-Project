package com.season.app.service;

import com.season.app.dto.cart.*;
import com.season.app.model.Cart;
import com.season.app.model.Product;
import com.season.app.repository.CartRepository;
import com.season.app.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CartService {
    private static final long GUEST_CART_TTL_DAYS = 7;
    
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
    }

    private Optional<Cart> findCart(String userId, String guestId) {
        if (userId != null && !userId.trim().isEmpty()) {
            return cartRepository.findByUserId(userId.trim());
        }
        if (guestId != null && !guestId.trim().isEmpty()) {
            return cartRepository.findByGuestId(guestId.trim());
        }
        throw new CartServiceError("Cart owner is required", 400);
    }

    private Cart getOrCreateCart(String userId, String guestId) {
        Optional<Cart> existingCart = findCart(userId, guestId);
        if (existingCart.isPresent()) {
            Cart cart = existingCart.get();
            if (guestId != null && !guestId.trim().isEmpty() && (userId == null || userId.trim().isEmpty())) {
                cart.setExpiresAt(guestCartExpiryDate());
                cart = cartRepository.save(cart);
            }
            return cart;
        }

        Cart newCart = Cart.builder()
                .userId(userId != null && !userId.trim().isEmpty() ? userId.trim() : null)
                .guestId(guestId != null && !guestId.trim().isEmpty() ? guestId.trim() : null)
                .expiresAt(userId == null ? guestCartExpiryDate() : null)
                .items(new ArrayList<>())
                .build();
        return cartRepository.save(newCart);
    }

    private Product.Variant assertProductCanBeAdded(Product product) {
        if (!Boolean.TRUE.equals(product.getIsActive()) || product.getAvailability() != Product.ProductAvailability.IN_STOCK) {
            throw new CartServiceError("Product is not available for sale", 409);
        }
        return product.getVariants().stream()
                .filter(Product.Variant::getIsDefault)
                .findFirst()
                .orElse(product.getVariants().stream().findFirst()
                .orElseThrow(() -> new CartServiceError("Product does not have a sellable variant", 409)));
    }

    private Product.Variant assertSkuProductCanBeAdded(Product product, String sku) {
        if (!Boolean.TRUE.equals(product.getIsActive()) || product.getAvailability() != Product.ProductAvailability.IN_STOCK) {
            throw new CartServiceError("Product is not available for sale", 409);
        }
        return product.getVariants().stream()
                .filter(v -> v.getSku().equals(sku))
                .findFirst()
                .orElseThrow(() -> new CartServiceError("Product does not have a sellable variant", 409));
    }

    private void assertQuantityWithinStock(int quantity, int stock) {
        if (quantity > stock) {
            throw new CartServiceError("Requested quantity exceeds available stock (" + stock + ")", 409);
        }
    }

    private Cart.CartItem findMatchingCartItem(Cart cart, String productId, String variantSku) {
        return cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId) && item.getVariantSku().equals(variantSku))
                .findFirst()
                .orElse(null);
    }

    private CartResponseData toCartResponse(Cart cart) {
        CartResponseData response = new CartResponseData();
        response.setId(cart.getId());
        response.setOwnerType(cart.getUserId() != null ? "user" : "guest");
        response.setUserId(cart.getUserId());
        response.setGuestId(cart.getGuestId());
        response.setExpiresAt(cart.getExpiresAt());

        List<String> productIds = cart.getItems().stream()
                .map(Cart.CartItem::getProductId)
                .distinct()
                .collect(Collectors.toList());

        Map<String, Product> productMap = new HashMap<>();
        if (!productIds.isEmpty()) {
            productRepository.findAllById(productIds).forEach(p -> productMap.put(p.getId(), p));
        }

        List<CartItemResponse> items = new ArrayList<>();
        for (Cart.CartItem item : cart.getItems()) {
            Product product = productMap.get(item.getProductId());
            if (product != null) {
                Product.Variant variant = product.getVariants().stream()
                        .filter(v -> v.getSku().equals(item.getVariantSku()))
                        .findFirst()
                        .orElse(null);
                
                if (variant != null) {
                    CartItemResponse dto = new CartItemResponse();
                    dto.setProductId(product.getId());
                    dto.setProductName(product.getName());
                    dto.setVariantSku(variant.getSku());
                    dto.setPrice(variant.getPrice());
                    dto.setQuantity(item.getQuantity());
                    dto.setStock(variant.getStock());
                    dto.setImage(variant.getImages() != null && !variant.getImages().isEmpty() ? variant.getImages().get(0) : "");
                    items.add(dto);
                }
            }
        }
        response.setItems(items);
        return response;
    }

    public CartResponseData getCartForOwner(String userId, String guestId) {
        if ((userId == null || userId.isEmpty()) && (guestId == null || guestId.isEmpty())) {
            return emptyCartResponse();
        }
        try {
            Optional<Cart> cart = findCart(userId, guestId);
            if (cart.isPresent()) {
                return toCartResponse(cart.get());
            }
        } catch (CartServiceError e) {
            // bỏ qua
        }
        
        CartResponseData res = emptyCartResponse();
        if (userId != null && !userId.isEmpty()) {
            res.setOwnerType("user");
            res.setUserId(userId);
        } else if (guestId != null && !guestId.isEmpty()) {
            res.setOwnerType("guest");
            res.setGuestId(guestId);
        }
        return res;
    }

    // --- ID-based Cart Operations (Đồng bộ với cart.service.ts của Node.js) ---
    public CartResponseData addItemToCart(String userId, String guestId, AddCartItemInput input) {
        Product product = productRepository.findById(input.getProductId())
                .orElseThrow(() -> new CartServiceError("Product not found", 404));

        Product.Variant variant = assertProductCanBeAdded(product);
        Cart cart = getOrCreateCart(userId, guestId);

        Cart.CartItem existingItem = findMatchingCartItem(cart, product.getId(), variant.getSku());

        if (existingItem == null) {
            assertQuantityWithinStock(input.getQuantity(), variant.getStock());
            Cart.CartItem newItem = Cart.CartItem.builder()
                    .productId(product.getId())
                    .variantSku(variant.getSku())
                    .quantity(input.getQuantity())
                    .build();
            cart.getItems().add(newItem);
        } else {
            int nextQuantity = existingItem.getQuantity() + input.getQuantity();
            assertQuantityWithinStock(nextQuantity, variant.getStock());
            existingItem.setQuantity(nextQuantity);
        }

        cart = cartRepository.save(cart);
        return toCartResponse(cart);
    }

    public CartResponseData updateCartItemQuantity(String userId, String guestId, UpdateCartItemInput input) {
        Cart cart = getOrCreateCart(userId, guestId);
        Product product = productRepository.findById(input.getProductId())
                .orElseThrow(() -> new CartServiceError("Product not found", 404));

        Product.Variant variant = assertProductCanBeAdded(product);
        Cart.CartItem existingItem = findMatchingCartItem(cart, product.getId(), variant.getSku());

        if (existingItem == null) {
            throw new CartServiceError("Cart item not found", 404);
        }

        assertQuantityWithinStock(input.getQuantity(), variant.getStock());
        existingItem.setQuantity(input.getQuantity());

        cart = cartRepository.save(cart);
        return toCartResponse(cart);
    }

    public CartResponseData removeItemFromCart(String userId, String guestId, String productId) {
        Cart cart = getOrCreateCart(userId, guestId);
        boolean removed = cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        
        if (!removed) {
            throw new CartServiceError("Cart item not found", 404);
        }

        cart = cartRepository.save(cart);
        return toCartResponse(cart);
    }

    // --- SKU-based Cart Operations ---
    public CartResponseData addSkuItemToCart(String userId, String guestId, CartSkuInput input) {
        Product product = productRepository.findByVariantSku(input.getSku())
                .orElseThrow(() -> new CartServiceError("Product variant not found", 404));

        Product.Variant variant = assertSkuProductCanBeAdded(product, input.getSku());
        Cart cart = getOrCreateCart(userId, guestId);

        Cart.CartItem existingItem = findMatchingCartItem(cart, product.getId(), variant.getSku());

        if (existingItem == null) {
            assertQuantityWithinStock(input.getQuantity(), variant.getStock());
            Cart.CartItem newItem = Cart.CartItem.builder()
                    .productId(product.getId())
                    .variantSku(variant.getSku())
                    .quantity(input.getQuantity())
                    .build();
            cart.getItems().add(newItem);
        } else {
            int nextQuantity = existingItem.getQuantity() + input.getQuantity();
            assertQuantityWithinStock(nextQuantity, variant.getStock());
            existingItem.setQuantity(nextQuantity);
        }

        cart = cartRepository.save(cart);
        return toCartResponse(cart);
    }

    public CartResponseData updateSkuCartItemQuantity(String userId, String guestId, CartSkuInput input) {
        Cart cart = getOrCreateCart(userId, guestId);
        Product product = productRepository.findByVariantSku(input.getSku())
                .orElseThrow(() -> new CartServiceError("Product variant not found", 404));

        Product.Variant variant = assertSkuProductCanBeAdded(product, input.getSku());
        Cart.CartItem existingItem = findMatchingCartItem(cart, product.getId(), variant.getSku());

        if (existingItem == null) {
            throw new CartServiceError("Cart item not found", 404);
        }

        assertQuantityWithinStock(input.getQuantity(), variant.getStock());
        existingItem.setQuantity(input.getQuantity());

        cart = cartRepository.save(cart);
        return toCartResponse(cart);
    }

    public CartResponseData removeSkuItemFromCart(String userId, String guestId, String sku) {
        Cart cart = getOrCreateCart(userId, guestId);
        boolean removed = cart.getItems().removeIf(item -> item.getVariantSku().equals(sku));
        
        if (!removed) {
            throw new CartServiceError("Cart item not found", 404);
        }

        cart = cartRepository.save(cart);
        return toCartResponse(cart);
    }

    public CartResponseData clearCartForOwner(String userId, String guestId) {
        Optional<Cart> cartOpt = findCart(userId, guestId);
        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            cart.setItems(new ArrayList<>());
            cart = cartRepository.save(cart);
            return toCartResponse(cart);
        }
        return getCartForOwner(userId, guestId);
    }

    public boolean mergeGuestCartIntoUserCart(String userId, String guestId) {
        if (guestId == null || guestId.trim().isEmpty()) return false;

        Optional<Cart> guestCartOpt = cartRepository.findByGuestId(guestId.trim());
        Optional<Cart> userCartOpt = cartRepository.findByUserId(userId);

        if (guestCartOpt.isEmpty()) return false;
        Cart guestCart = guestCartOpt.get();

        if (guestCart.getItems().isEmpty()) {
            cartRepository.delete(guestCart);
            return false;
        }

        if (userCartOpt.isEmpty()) {
            guestCart.setUserId(userId);
            guestCart.setGuestId(null);
            guestCart.setExpiresAt(null);
            cartRepository.save(guestCart);
            return true;
        }

        Cart userCart = userCartOpt.get();

        for (Cart.CartItem guestItem : guestCart.getItems()) {
            Optional<Product> productOpt = productRepository.findById(guestItem.getProductId());
            if (productOpt.isEmpty() || !Boolean.TRUE.equals(productOpt.get().getIsActive())) continue;

            Product product = productOpt.get();
            Product.Variant variant = product.getVariants().stream()
                    .filter(v -> v.getSku().equals(guestItem.getVariantSku()))
                    .findFirst().orElse(null);

            if (variant == null || product.getAvailability() != Product.ProductAvailability.IN_STOCK || variant.getStock() < 1) {
                continue;
            }

            Cart.CartItem existingItem = findMatchingCartItem(userCart, product.getId(), guestItem.getVariantSku());
            if (existingItem == null) {
                Cart.CartItem newItem = Cart.CartItem.builder()
                        .productId(product.getId())
                        .variantSku(guestItem.getVariantSku())
                        .quantity(Math.min(guestItem.getQuantity(), variant.getStock()))
                        .build();
                userCart.getItems().add(newItem);
            } else {
                int nextQty = existingItem.getQuantity() + guestItem.getQuantity();
                existingItem.setQuantity(Math.max(0, Math.min(nextQty, variant.getStock())));
            }
        }

        userCart.getItems().removeIf(item -> item.getQuantity() <= 0);
        cartRepository.save(userCart);
        cartRepository.delete(guestCart);
        return true;
    }

    public void clearCartForUser(String userId) {
        if (userId == null || userId.trim().isEmpty()) return;
        cartRepository.findByUserId(userId.trim()).ifPresent(cart -> {
            cart.setItems(new ArrayList<>());
            cartRepository.save(cart);
        });
    }

    private CartResponseData emptyCartResponse() {
        CartResponseData response = new CartResponseData();
        response.setItems(new ArrayList<>());
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
        public int getStatusCode() { return statusCode; }
    }
}