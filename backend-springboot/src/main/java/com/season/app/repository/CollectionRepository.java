package com.season.app.repository;

import com.season.app.model.Collection;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollectionRepository extends MongoRepository<Collection, String> {
    Optional<Collection> findBySlug(String slug);
    boolean existsBySlug(String slug);
}

