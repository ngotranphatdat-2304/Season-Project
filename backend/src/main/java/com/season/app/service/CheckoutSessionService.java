package com.season.app.service;

import com.season.app.dto.checkout.*;
import com.season.app.model.*;
import com.season.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
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

    // Tự động tính toán lại trạng thái In Stock / Out of Stock tổng thể của sản phẩm dựa trên tổng kho các variants
    private void recalculateProductAvailability(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new CheckoutSessionServiceError("Một số sản phẩm không còn khả dụng", 409));
        
        int totalStock = product.getVariants().stream()
                .mapToInt(Product.Variant::getStock)
                .sum();
                
        product.setAvailability(totalStock > 0 ? Product.ProductAvailability.IN_STOCK : Product.ProductAvailability.OUT_OF_STOCK);
        productRepository.save(product);
    }

    public CheckoutInitResponse createCheckoutSession(String ownerId, boolean isUser) {
        if (ownerId == null || ownerId.trim().isEmpty()) {
            throw new CheckoutSessionServiceError("Giỏ hàng của bạn đang trống", 400);
        }

        Optional<Cart> cartOpt = isUser ? cartRepository.findByUserId(ownerId) : cartRepository.findByGuestId(ownerId);
        if (cartOpt.isEmpty() || cartOpt.get().getItems().isEmpty()) {
            throw new CheckoutSessionServiceError("Giỏ hàng của bạn đang trống", 400);
        }
        Cart cart = cartOpt.get();

        List<CheckoutSession.ItemSnapshot> snapshots = new ArrayList<>();
        double subtotal = 0.0;

        for (Cart.CartItem item : cart.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new CheckoutSessionServiceError("Một số sản phẩm không còn khả dụng", 409));

            if (!Boolean.TRUE.equals(product.getIsActive()) || product.getAvailability() != Product.ProductAvailability.IN_STOCK) {
                throw new CheckoutSessionServiceError(product.getName() + " không còn khả dụng", 409);
            }

            Product.Variant variant = product.getVariants().stream()
                    .filter(v -> v.getSku().equals(item.getVariantSku()))
                    .findFirst()
                    .orElseThrow(() -> new CheckoutSessionServiceError(product.getName() + " không còn phiên bản này", 409));

            if (variant.getStock() < item.getQuantity()) {
                throw new CheckoutSessionServiceError(product.getName() + " không đủ số lượng trong kho", 409);
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
                .orElseThrow(() -> new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404));

        if (session.getExpiresAt().isBefore(Instant.now())) {
            throw new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404);
        }

        if (session.getStatus() == CheckoutSession.CheckoutSessionStatus.COMPLETED) {
            Order order = orderRepository.findByCheckoutToken(token)
                    .orElseThrow(() -> new CheckoutSessionServiceError("Đơn hàng không tồn tại", 404));
            
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
                .orElseThrow(() -> new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404));

        if (session.getStatus() == CheckoutSession.CheckoutSessionStatus.COMPLETED) {
            throw new CheckoutSessionServiceError("Đơn hàng đã được đặt", 409);
        }

        // Khấu trừ Stock tồn kho
        for (CheckoutSession.ItemSnapshot snap : session.getItemsSnapshot()) {
            Query query = new Query(Criteria.where("_id").is(snap.getProductId())
                    .and("isActive").is(true)
                    .and("availability").is("in_stock")
                    .and("variants").elemMatch(Criteria.where("sku").is(snap.getVariantSku()).and("stock").gte(snap.getQuantity())));
            
            Update update = new Update().inc("variants.$.stock", -snap.getQuantity());
            
            long modifiedCount = mongoTemplate.updateFirst(query, update, Product.class).getModifiedCount();
            if (modifiedCount == 0) {
                throw new CheckoutSessionServiceError("Một số sản phẩm không đủ hàng. Vui lòng thử lại.", 409);
            }

            // Đồng bộ: Tính toán và cập nhật lại trạng thái availability của sản phẩm cha
            recalculateProductAvailability(snap.getProductId());
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
        public int getStatusCode() { return statusCode; }
    }

    @Transactional
    public CheckoutPayOSInitResponse initPayOSPayment(String token, String ownerId, boolean isUser, CheckoutCompleteInput input) {
        CheckoutSession session = checkoutSessionRepository.findByToken(token)
                .orElseThrow(() -> new CheckoutSessionServiceError("Phiên thanh toán đã hết hạn", 404));

        if (session.getStatus() == CheckoutSession.CheckoutSessionStatus.COMPLETED) {
            throw new CheckoutSessionServiceError("Đơn hàng đã được đặt", 409);
        }

        // Tạo cấu trúc Order dạng chờ thanh toán (Payment Method: bank_transfer)
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

        // Chuyển trạng thái Checkout sang completed
        session.setStatus(CheckoutSession.CheckoutSessionStatus.COMPLETED);
        checkoutSessionRepository.save(session);

        // Xoá giỏ hàng của chủ sở hữu hiện tại
        if (isUser) {
            cartRepository.deleteByUserId(ownerId);
        } else {
            cartRepository.deleteByGuestId(ownerId);
        }

        // Tạo phản hồi chứa cổng thanh toán và đường dẫn giao dịch PayOS
        CheckoutPayOSInitResponse res = new CheckoutPayOSInitResponse();
        res.setOrderId(order.getId());
        res.setToken(token);
        
        // Mô phỏng đường dẫn thanh toán của môi trường dev
        String mockCheckoutUrl = "/checkout/payment-result?token=" + token + "&orderId=" + order.getId();
        res.setCheckoutUrl(mockCheckoutUrl);
        return res;
    }

    public CheckoutPaymentStatusResponse getPaymentStatus(String token, String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CheckoutSessionServiceError("Đơn hàng không tồn tại", 404));

        CheckoutPaymentStatusResponse res = new CheckoutPaymentStatusResponse();
        res.setOrderId(orderId);
        res.setToken(token);
        
        // Mô phỏng dev: Chuyển đổi trạng thái tự động sang PAID (Đồng bộ hành vi hiển thị của Frontend)
        if (order.getPaymentStatus() == Order.PaymentStatus.UNPAID) {
            order.setPaymentStatus(Order.PaymentStatus.PAID);
            order.setStatus(Order.OrderStatus.CONFIRMED);
            orderRepository.save(order);
        }

        res.setStatus(order.getPaymentStatus().getValue()); // "paid"
        res.setRedirectTo("/order/success/" + token);
        res.setMessage("Thanh toán thành công qua PayOS QR.");
        return res;
    }
}