package com.season.app.repository;

import com.season.app.model.Order;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
    Optional<Order> findByCheckoutToken(String checkoutToken);
    Optional<Order> findByPayosOrderCode(Long payosOrderCode);
    boolean existsByUserIdAndStatus(String userId, Order.OrderStatus status);
}

