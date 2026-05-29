package com.season.app.model;

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
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "carts")
@CompoundIndex(def = "{ 'items.productId': 1 }")
public class Cart {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String userId;

    @Indexed(unique = true, sparse = true)
    private String guestId;

    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    @Indexed(expireAfter = "0s")
    private Instant expiresAt;

    @Version
    private Long version;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItem {

        private String productId;

        private String variantSku;

        @Builder.Default
        private Integer quantity = 1;
    }
}
