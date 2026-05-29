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
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "checkoutsessions")
@CompoundIndex(def = "{ 'token': 1, 'status': 1 }")
public class CheckoutSession {

    @Id
    private String id;

    @Indexed(unique = true)
    private String token;

    @Indexed
    private String guestId;

    @Builder.Default
    private CheckoutSessionStatus status = CheckoutSessionStatus.PENDING;

    private List<ItemSnapshot> itemsSnapshot;

    private Double subtotalAmount;

    @Builder.Default
    private Double shippingFee = 0.0;

    private Double totalAmount;

    @Builder.Default
    private String currency = "VND";

    @Indexed(expireAfter = "0s")
    private Instant expiresAt;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public enum CheckoutSessionStatus {
        PENDING("pending"),
        PAYMENT_PENDING("payment_pending"),
        COMPLETED("completed");

        private final String value;

        CheckoutSessionStatus(String value) {
            this.value = value;
        }

        @JsonValue
        public String getValue() {
            return value;
        }

        @JsonCreator
        public static CheckoutSessionStatus fromValue(String value) {
            for (CheckoutSessionStatus status : values()) {
                if (status.value.equals(value)) {
                    return status;
                }
            }
            throw new IllegalArgumentException("Unknown checkout session status: " + value);
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemSnapshot {

        private String productId;

        private String productName;

        private String variantSku;

        private String variantColor;

        @Builder.Default
        private String imageUrl = "";

        private Double unitPrice;

        private Integer quantity;

        private Double lineTotal;
    }
}
