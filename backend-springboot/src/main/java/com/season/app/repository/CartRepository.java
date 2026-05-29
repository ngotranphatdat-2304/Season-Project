package com.season.app.repository;

import com.season.app.model.Cart;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartRepository extends MongoRepository<Cart, String> {
    Optional<Cart> findByUserId(String userId);
    Optional<Cart> findByGuestId(String guestId);
    void deleteByUserId(String userId);
    void deleteByGuestId(String guestId);
}

