package com.season.app.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "orders")
@CompoundIndex(name = "userId_createdAt", def = "{ 'userId': 1, 'createdAt': -1 }")
@CompoundIndex(name = "guestId_createdAt", def = "{ 'guestId': 1, 'createdAt': -1 }")
@CompoundIndex(name = "status_createdAt", def = "{ 'status': 1, 'createdAt': -1 }")
@CompoundIndex(name = "items_product_variant", def = "{ 'items.productId': 1, 'items.variantSku': 1 }")
public class Order {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String guestId;

    private String customerEmail;

    @Indexed(unique = true, sparse = true)
    private String checkoutToken;

    @Indexed(unique = true, sparse = true)
    private Long payosOrderCode;

    @Indexed(sparse = true)
    private String payosPaymentLinkId;

    private List<OrderItem> items;

    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    private PaymentMethod paymentMethod;

    private ShippingAddress shippingAddress;

    @Builder.Default
    private Double subtotalAmount = 0.0;

    @Builder.Default
    private Double discountAmount = 0.0;

    @Builder.Default
    private Double shippingFee = 0.0;

    @Builder.Default
    private Double taxAmount = 0.0;

    @Builder.Default
    private Double totalAmount = 0.0;

    @Builder.Default
    private String currency = "VND";

    @Builder.Default
    private Instant placedAt = Instant.now();

    private Instant cancelledAt;

    private Instant deliveredAt;

    @Version
    private Long version;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public enum OrderStatus {
        PENDING("pending"),
        CONFIRMED("confirmed"),
        SHIPPED("shipped"),
        DELIVERED("delivered"),
        CANCELLED("cancelled");

        private final String value;

        OrderStatus(String value) {
            this.value = value;
        }

        @JsonValue
        public String getValue() {
            return value;
        }

        @JsonCreator
        public static OrderStatus fromValue(String value) {
            for (OrderStatus status : values()) {
                if (status.value.equals(value)) {
                    return status;
                }
            }
            throw new IllegalArgumentException("Unknown order status: " + value);
        }
    }

    public enum PaymentStatus {
        UNPAID("unpaid"),
        PAID("paid"),
        FAILED("failed"),
        REFUNDED("refunded");

        private final String value;

        PaymentStatus(String value) {
            this.value = value;
        }

        @JsonValue
        public String getValue() {
            return value;
        }

        @JsonCreator
        public static PaymentStatus fromValue(String value) {
            for (PaymentStatus status : values()) {
                if (status.value.equals(value)) {
                    return status;
                }
            }
            throw new IllegalArgumentException("Unknown payment status: " + value);
        }
    }

    public enum PaymentMethod {
        CASH_ON_DELIVERY("cash_on_delivery"),
        BANK_TRANSFER("bank_transfer"),
        CARD("card"),
        E_WALLET("e_wallet");

        private final String value;

        PaymentMethod(String value) {
            this.value = value;
        }

        @JsonValue
        public String getValue() {
            return value;
        }

        @JsonCreator
        public static PaymentMethod fromValue(String value) {
            for (PaymentMethod method : values()) {
                if (method.value.equals(value)) {
                    return method;
                }
            }
            throw new IllegalArgumentException("Unknown payment method: " + value);
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShippingAddress {

        private String recipientName;

        private String phone;

        private String line1;

        private String line2;

        private String ward;

        private String district;

        private String city;

        private String province;

        private String postalCode;

        @Builder.Default
        private String country = "Vietnam";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItem {

        private String productId;

        private String productName;

        private String variantSku;

        @Builder.Default
        private String imageUrl = "";

        private Integer quantity;

        private Double unitPrice;

        @Builder.Default
        private Double lineTotal = 0.0;
    }
}
