package com.season.app.repository;

import com.season.app.model.CheckoutSession;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CheckoutSessionRepository extends MongoRepository<CheckoutSession, String> {
    Optional<CheckoutSession> findByToken(String token);
}

