package com.season.app.service;

import com.mongodb.bulk.BulkWriteResult;
import com.season.app.dto.checkout.*;
import com.season.app.model.*;
import com.season.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CheckoutSessionService {

    private static final int CHECKOUT_TOKEN_BYTES = 12;
    private static final String CART_EMPTY_MESSAGE = "Gi\u1ecf h\u00e0ng c\u1ee7a b\u1ea1n \u0111ang tr\u1ed1ng";
    private static final String PRODUCTS_UNAVAILABLE_MESSAGE = "M\u1ed9t s\u1ed1 s\u1ea3n ph\u1ea9m kh\u00f4ng c\u00f2n kh\u1ea3 d\u1ee5ng";
    private static final String SESSION_EXPIRED_MESSAGE = "Phi\u00ean thanh to\u00e1n \u0111\u00e3 h\u1ebft h\u1ea1n";
    private static final String ORDER_NOT_FOUND_MESSAGE = "\u0110\u01a1n h\u00e0ng kh\u00f4ng t\u1ed3n t\u1ea1i";
    private static final String ORDER_ALREADY_PLACED_MESSAGE = "\u0110\u01a1n h\u00e0ng \u0111\u00e3 \u0111\u01b0\u1ee3c \u0111\u1eb7t";
    private static final String STOCK_NOT_ENOUGH_MESSAGE = "M\u1ed9t s\u1ed1 s\u1ea3n ph\u1ea9m kh\u00f4ng \u0111\u1ee7 h\u00e0ng. Vui l\u00f2ng th\u1eed l\u1ea1i.";

    @Autowired
    private CartRepository cartRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CheckoutSessionRepository checkoutSessionRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private OrderEmailService orderEmailService;

    private final SecureRandom secureRandom = new SecureRandom();

    private record StockDeductionKey(String productId, String variantSku) {
    }

    public String createCheckoutToken() {
        byte[] bytes = new byte[CHECKOUT_TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        StringBuilder builder = new StringBuilder();
        for (byte b : bytes) {
            builder.append(String.format("%02x", b));
        }
        return builder.toString();
    }

    private Map<StockDeductionKey, Integer> aggregateStockDeductions(List<CheckoutSession.ItemSnapshot> snapshots) {
        Map<StockDeductionKey, Integer> deductions = new LinkedHashMap<>();
        for (CheckoutSession.ItemSnapshot snap : snapshots) {
            Integer quantity = snap.getQuantity();
            if (quantity == null || quantity <= 0) {
                throw new CheckoutSessionServiceError(STOCK_NOT_ENOUGH_MESSAGE, 409);
            }

            StockDeductionKey key = new StockDeductionKey(snap.getProductId(), snap.getVariantSku());
            Integer existingQuantity = deductions.get(key);
            if (existingQuantity == null) {
                deductions.put(key, quantity);
            } else {
                deductions.put(key, existingQuantity + quantity);
            }
        }
        return deductions;
    }

    private void deductStockForCheckout(List<CheckoutSession.ItemSnapshot> snapshots) {
        Map<StockDeductionKey, Integer> deductions = aggregateStockDeductions(snapshots);
        if (deductions.isEmpty()) {
            return;
        }

        BulkOperations stockBulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.ORDERED, Product.class);
        for (Map.Entry<StockDeductionKey, Integer> entry : deductions.entrySet()) {
            StockDeductionKey key = entry.getKey();
            Integer quantity = entry.getValue();
            Query query = new Query(Criteria.where("_id").is(key.productId())
                    .and("isActive").is(true)
                    .and("availability").is(Product.ProductAvailability.IN_STOCK)
                    .and("variants").elemMatch(Criteria.where("sku").is(key.variantSku()).and("stock").gte(quantity)));
            Update update = new Update().inc("variants.$.stock", -quantity);
            stockBulkOps.updateOne(query, update);
        }

        BulkWriteResult stockResult = stockBulkOps.execute();
        if (stockResult.getModifiedCount() != deductions.size()) {
            throw new CheckoutSessionServiceError(STOCK_NOT_ENOUGH_MESSAGE, 409);
        }

        Set<String> affectedProductIds = deductions.keySet().stream()
                .map(StockDeductionKey::productId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        recalculateProductAvailability(affectedProductIds);
    }

    private void recalculateProductAvailability(Set<String> productIds) {
        if (productIds.isEmpty()) {
            return;
        }

        Query productsQuery = new Query(Criteria.where("_id").in(productIds));
        List<Product> products = mongoTemplate.find(productsQuery, Product.class);
        if (products.isEmpty()) {
            return;
        }

        BulkOperations availabilityBulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.ORDERED, Product.class);
        int updateCount = 0;
        for (Product product : products) {
            List<Product.Variant> variants = product.getVariants();
            int totalStock = variants == null
                    ? 0
                    : variants.stream()
                            .mapToInt(variant -> variant.getStock() == null ? 0 : variant.getStock())
                            .sum();
            Product.ProductAvailability availability = totalStock > 0
                    ? Product.ProductAvailability.IN_STOCK
                    : Product.ProductAvailability.OUT_OF_STOCK;

            Query query = new Query(Criteria.where("_id").is(product.getId()));
            Update update = new Update().set("availability", availability);
            availabilityBulkOps.updateOne(query, update);
            updateCount++;
        }

        if (updateCount > 0) {
            availabilityBulkOps.execute();
        }
    }

    public CheckoutInitResponse createCheckoutSession(String ownerId, boolean isUser) {
        if (ownerId == null || ownerId.trim().isEmpty()) {
            throw new CheckoutSessionServiceError(CART_EMPTY_MESSAGE, 400);
        }

        Optional<Cart> cartOpt = isUser ? cartRepository.findByUserId(ownerId) : cartRepository.findByGuestId(ownerId);
        if (cartOpt.isEmpty() || cartOpt.get().getItems().isEmpty()) {
            throw new CheckoutSessionServiceError(CART_EMPTY_MESSAGE, 400);
        }
        Cart cart = cartOpt.get();

        List<CheckoutSession.ItemSnapshot> snapshots = new ArrayList<>();
        double subtotal = 0.0;

        for (Cart.CartItem item : cart.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new CheckoutSessionServiceError(PRODUCTS_UNAVAILABLE_MESSAGE, 409));

            if (!Boolean.TRUE.equals(product.getIsActive()) || product.getAvailability() != Product.ProductAvailability.IN_STOCK) {
                throw new CheckoutSessionServiceError(product.getName() + " kh\u00f4ng c\u00f2n kh\u1ea3 d\u1ee5ng", 409);
            }

            Product.Variant variant = product.getVariants().stream()
                    .filter(v -> v.getSku().equals(item.getVariantSku()))
                    .findFirst()
                    .orElseThrow(() -> new CheckoutSessionServiceError(product.getName() + " kh\u00f4ng c\u00f2n phi\u00ean b\u1ea3n n\u00e0y", 409));

            if (variant.getStock() < item.getQuantity()) {
                throw new CheckoutSessionServiceError(product.getName() + " kh\u00f4ng \u0111\u1ee7 s\u1ed1 l\u01b0\u1ee3ng trong kho", 409);
            }

            double lineTotal = variant.getPrice() * item.getQuantity();
            subtotal += lineTotal;

            CheckoutSession.ItemSnapshot snap = CheckoutSession.ItemSnapshot.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .variantSku(variant.getSku())
                    .variantColor(variant.getColor())
                    .imageUrl(!variant.getImages().isEmpty() ? variant.getImages().get(0) : "")
                    .unitPrice(variant.getPrice())
                    .quantity(item.getQuantity())
                    .lineTotal(lineTotal)
                    .build();
            snapshots.add(snap);
        }

        CheckoutSession session = CheckoutSession.builder()
                .token(createCheckoutToken())
                .guestId(isUser ? null : ownerId)
                .status(CheckoutSession.CheckoutSessionStatus.PENDING)
                .itemsSnapshot(snapshots)
                .subtotalAmount(subtotal)
                .shippingFee(0.0)
                .totalAmount(subtotal)
                .currency("VND")
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();

        checkoutSessionRepository.save(session);

        CheckoutInitResponse res = new CheckoutInitResponse();
        res.setToken(session.getToken());
        return res;
    }

    public Object getCheckoutSessionByToken(String token, String ownerId, boolean isUser) {
        CheckoutSession session = checkoutSessionRepository.findByToken(token)
                .orElseThrow(() -> new CheckoutSessionServiceError(SESSION_EXPIRED_MESSAGE, 404));

        if (session.getExpiresAt().isBefore(Instant.now())) {
            throw new CheckoutSessionServiceError(SESSION_EXPIRED_MESSAGE, 404);
        }

        if (session.getStatus() == CheckoutSession.CheckoutSessionStatus.COMPLETED) {
            Order order = orderRepository.findByCheckoutToken(token)
                    .orElseThrow(() -> new CheckoutSessionServiceError(ORDER_NOT_FOUND_MESSAGE, 404));

            CompletedCheckoutSessionResponse res = new CompletedCheckoutSessionResponse();
            res.setRedirectTo("/order/success/" + token);
            CompletedCheckoutSessionResponse.OrderSummary summary = new CompletedCheckoutSessionResponse.OrderSummary();
            summary.setOrderId(order.getId());
            summary.setCustomerEmail(order.getCustomerEmail());
            summary.setPaymentMethod(order.getPaymentMethod());
            summary.setShippingAddress(order.getShippingAddress());
            summary.setItems(session.getItemsSnapshot());
            summary.setSubtotalAmount(order.getSubtotalAmount());
            summary.setShippingFee(order.getShippingFee());
            summary.setTotalAmount(order.getTotalAmount());
            summary.setCurrency(order.getCurrency());
            res.setOrder(summary);
            return res;
        }

        PendingCheckoutSessionResponse res = new PendingCheckoutSessionResponse();
        res.setToken(session.getToken());
        res.setItems(session.getItemsSnapshot());
        res.setItemCount(session.getItemsSnapshot().stream().mapToInt(CheckoutSession.ItemSnapshot::getQuantity).sum());
        res.setSubtotalAmount(session.getSubtotalAmount());
        res.setShippingFee(session.getShippingFee());
        res.setTotalAmount(session.getTotalAmount());
        res.setCurrency(session.getCurrency());
        res.setExpiresAt(session.getExpiresAt());
        return res;
    }

    @Transactional
    public CheckoutCompleteResponse completeCheckoutSession(String token, String ownerId, boolean isUser, CheckoutCompleteInput input) {
        CheckoutSession session = checkoutSessionRepository.findByToken(token)
                .orElseThrow(() -> new CheckoutSessionServiceError(SESSION_EXPIRED_MESSAGE, 404));

        if (session.getStatus() == CheckoutSession.CheckoutSessionStatus.COMPLETED) {
            throw new CheckoutSessionServiceError(ORDER_ALREADY_PLACED_MESSAGE, 409);
        }

        deductStockForCheckout(session.getItemsSnapshot());

        List<Order.OrderItem> orderItems = session.getItemsSnapshot().stream().map(snap ->
                Order.OrderItem.builder()
                        .productId(snap.getProductId())
                        .productName(snap.getProductName())
                        .variantSku(snap.getVariantSku())
                        .imageUrl(snap.getImageUrl())
                        .quantity(snap.getQuantity())
                        .unitPrice(snap.getUnitPrice())
                        .lineTotal(snap.getLineTotal())
                        .build()
        ).collect(Collectors.toList());

        Order order = Order.builder()
                .userId(isUser ? ownerId : null)
                .guestId(isUser ? null : ownerId)
                .customerEmail(input.getCustomerEmail())
                .checkoutToken(session.getToken())
                .items(orderItems)
                .status(Order.OrderStatus.PENDING)
                .paymentStatus(Order.PaymentStatus.UNPAID)
                .paymentMethod(input.getPaymentMethod())
                .shippingAddress(input.getShippingAddress())
                .subtotalAmount(session.getSubtotalAmount())
                .shippingFee(session.getShippingFee())
                .totalAmount(session.getTotalAmount())
                .currency(session.getCurrency())
                .build();

        orderRepository.save(order);

        orderEmailService.sendOrderConfirmationEmail(order);

        session.setStatus(CheckoutSession.CheckoutSessionStatus.COMPLETED);
        checkoutSessionRepository.save(session);

        if (isUser) {
            cartRepository.deleteByUserId(ownerId);
        } else {
            cartRepository.deleteByGuestId(ownerId);
        }

        CheckoutCompleteResponse res = new CheckoutCompleteResponse();
        res.setOrderId(order.getId());
        res.setToken(token);
        return res;
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

    @Transactional
    public CheckoutPayOSInitResponse initPayOSPayment(String token, String ownerId, boolean isUser, CheckoutCompleteInput input) {
        CheckoutSession session = checkoutSessionRepository.findByToken(token)
                .orElseThrow(() -> new CheckoutSessionServiceError(SESSION_EXPIRED_MESSAGE, 404));

        if (session.getStatus() == CheckoutSession.CheckoutSessionStatus.COMPLETED) {
            throw new CheckoutSessionServiceError(ORDER_ALREADY_PLACED_MESSAGE, 409);
        }

        List<Order.OrderItem> orderItems = session.getItemsSnapshot().stream().map(snap ->
                Order.OrderItem.builder()
                        .productId(snap.getProductId())
                        .productName(snap.getProductName())
                        .variantSku(snap.getVariantSku())
                        .imageUrl(snap.getImageUrl())
                        .quantity(snap.getQuantity())
                        .unitPrice(snap.getUnitPrice())
                        .lineTotal(snap.getLineTotal())
                        .build()
        ).collect(Collectors.toList());

        Order order = Order.builder()
                .userId(isUser ? ownerId : null)
                .guestId(isUser ? null : ownerId)
                .customerEmail(input.getCustomerEmail())
                .checkoutToken(session.getToken())
                .items(orderItems)
                .status(Order.OrderStatus.PENDING)
                .paymentStatus(Order.PaymentStatus.UNPAID)
                .paymentMethod(Order.PaymentMethod.BANK_TRANSFER)
                .shippingAddress(input.getShippingAddress())
                .subtotalAmount(session.getSubtotalAmount())
                .shippingFee(session.getShippingFee())
                .totalAmount(session.getTotalAmount())
                .currency(session.getCurrency())
                .build();

        orderRepository.save(order);

        session.setStatus(CheckoutSession.CheckoutSessionStatus.COMPLETED);
        checkoutSessionRepository.save(session);

        if (isUser) {
            cartRepository.deleteByUserId(ownerId);
        } else {
            cartRepository.deleteByGuestId(ownerId);
        }

        CheckoutPayOSInitResponse res = new CheckoutPayOSInitResponse();
        res.setOrderId(order.getId());
        res.setToken(token);

        String mockCheckoutUrl = "/checkout/payment-result?token=" + token + "&orderId=" + order.getId();
        res.setCheckoutUrl(mockCheckoutUrl);
        return res;
    }

    public CheckoutPaymentStatusResponse getPaymentStatus(String token, String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CheckoutSessionServiceError(ORDER_NOT_FOUND_MESSAGE, 404));

        CheckoutPaymentStatusResponse res = new CheckoutPaymentStatusResponse();
        res.setOrderId(orderId);
        res.setToken(token);

        if (order.getPaymentStatus() == Order.PaymentStatus.UNPAID) {
            order.setPaymentStatus(Order.PaymentStatus.PAID);
            order.setStatus(Order.OrderStatus.CONFIRMED);
            orderRepository.save(order);
        }

        res.setStatus(order.getPaymentStatus().getValue());
        res.setRedirectTo("/order/success/" + token);
        res.setMessage("Thanh to\u00e1n th\u00e0nh c\u00f4ng qua PayOS QR.");
        return res;
    }
}
