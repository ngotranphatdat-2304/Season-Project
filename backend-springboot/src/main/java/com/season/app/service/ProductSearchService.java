package com.season.app.service;

import com.season.app.dto.product.ProductSearchResponseData;
import com.season.app.dto.product.SearchProductResponse;
import com.season.app.model.Product;
import com.season.app.repository.ProductRepository;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ProductSearchService {
    private final ProductRepository productRepository;

    public ProductSearchService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public ProductSearchResponseData searchProducts(String q, int offset, int limit) {
        String normalized = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);

        List<SearchProductResponse> allMatches = productRepository.findAll().stream()
                .filter(product -> Boolean.TRUE.equals(product.getIsActive()))
                .filter(product -> product.getAvailability() == Product.ProductAvailability.IN_STOCK)
                .filter(product -> normalized.isEmpty()
                        || containsIgnoreCase(product.getName(), normalized)
                        || containsIgnoreCase(product.getBrand(), normalized)
                        || containsIgnoreCase(product.getSlug(), normalized))
                .map(this::toSearchProductResponse)
                .collect(Collectors.toList());

        int safeOffset = Math.max(0, offset);
        int safeLimit = Math.max(1, limit);
        int start = Math.min(safeOffset, allMatches.size());
        int end = Math.min(start + safeLimit, allMatches.size());
        List<SearchProductResponse> page = allMatches.subList(start, end);

        ProductSearchResponseData response = new ProductSearchResponseData();
        response.setRecords(page);
        response.setTotal((long) allMatches.size());
        return response;
    }

    private boolean containsIgnoreCase(String value, String q) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(q);
    }

    private SearchProductResponse toSearchProductResponse(Product product) {
        SearchProductResponse response = new SearchProductResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setSlug(product.getSlug());
        response.setType(product.getType());
        response.setCollectionId(product.getCollectionId());
        response.setBrand(product.getBrand());
        response.setSalePercent(product.getSalePercent());
        response.setAvailability(product.getAvailability());
        response.setDescription(product.getDescription());
        response.setSpecifications(product.getSpecifications());
        response.setVariants(product.getVariants());
        response.setRating(product.getRating());
        response.setIsActive(product.getIsActive());
        response.setScore(0.0);
        return response;
    }
}

