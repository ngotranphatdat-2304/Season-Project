package com.season.app.service;

import com.season.app.dto.product.ProductResponse;
import com.season.app.dto.product.ProductsResponseData;
import com.season.app.model.Product;
import com.season.app.repository.ProductRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ProductsService {
    private final ProductRepository productRepository;

    public ProductsService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public ProductsResponseData getActiveInStockProducts() {
        List<ProductResponse> records = productRepository.findAll().stream()
                .filter(product -> Boolean.TRUE.equals(product.getIsActive()))
                .filter(product -> product.getAvailability() == Product.ProductAvailability.IN_STOCK)
                .map(this::toProductResponse)
                .collect(Collectors.toList());

        ProductsResponseData response = new ProductsResponseData();
        response.setRecords(records);
        response.setTotal((long) records.size());
        return response;
    }

    private ProductResponse toProductResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setSlug(product.getSlug());
        response.setType(product.getType());
        response.setCollectionId(product.getCollectionId());
        response.setBrand(product.getBrand());
        response.setSalePercent(product.getSalePercent());
        response.setAvailability(product.getAvailability());
        response.setDescription(product.getDescription());
        response.setVariants(product.getVariants());
        response.setRating(product.getRating());
        response.setIsActive(product.getIsActive());
        response.setSpecifications(product.getSpecifications());
        return response;
    }
}

