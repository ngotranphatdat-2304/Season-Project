package com.season.app.repository;

import com.season.app.model.Product;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findBySlug(String slug);
    boolean existsBySlug(String slug);

    @Query("{ 'variants.sku': ?0 }")
    Optional<Product> findByVariantSku(String sku);
}

