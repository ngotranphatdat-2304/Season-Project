package com.season.app.repository;

import com.season.app.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    // Tương đương User.findOne({ email })
    Optional<User> findByEmail(String email);
    
    // Tương đương User.exists({ email })
    boolean existsByEmail(String email);
}