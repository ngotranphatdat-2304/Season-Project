package com.season.app.service;

import com.season.app.dto.product.ProductResponse;
import com.season.app.dto.product.ProductsResponseData;
import com.season.app.model.Product;
import com.season.app.model.Collection;
import com.season.app.repository.ProductRepository;
import com.season.app.repository.CollectionRepository;
import com.season.app.util.ProductSortUtil;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductsService {
    private final ProductRepository productRepository;
    private final CollectionRepository collectionRepository;
    private final MongoTemplate mongoTemplate;

    public ProductsService(ProductRepository productRepository, 
                           CollectionRepository collectionRepository,
                           MongoTemplate mongoTemplate) {
        this.productRepository = productRepository;
        this.collectionRepository = collectionRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public ProductResponse getProductById(String id) {
        Product product = productRepository.findById(id)
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .filter(p -> p.getAvailability() == Product.ProductAvailability.IN_STOCK)
                .orElse(null);
        return product != null ? toProductResponse(product) : null;
    }

    public ProductsResponseData getProductsByFilters(
            String type,
            String frameType,
            String frameSize,
            String collectionSlug,
            String gender,
            Boolean sale,
            String sort,
            int offset,
            int limit
    ) {
        Query query = new Query();
        query.addCriteria(Criteria.where("isActive").is(true));
        query.addCriteria(Criteria.where("availability").is("in_stock"));

        if (type != null && !type.trim().isEmpty()) {
            query.addCriteria(Criteria.where("type").is(type));
        }
        if (frameType != null && !frameType.trim().isEmpty()) {
            query.addCriteria(Criteria.where("specifications.frameType.material").is(frameType));
        }
        if (frameSize != null && !frameSize.trim().isEmpty()) {
            query.addCriteria(Criteria.where("specifications.frameType.size.label").is(frameSize));
        }
        if (collectionSlug != null && !collectionSlug.trim().isEmpty()) {
            Optional<Collection> collectionOpt = collectionRepository.findBySlug(collectionSlug);
            if (collectionOpt.isPresent()) {
                query.addCriteria(Criteria.where("collectionId").is(collectionOpt.get().getId()));
            } else {
                ProductsResponseData empty = new ProductsResponseData();
                empty.setRecords(List.of());
                empty.setTotal(0L);
                return empty;
            }
        }
        if (gender != null && !gender.trim().isEmpty()) {
            query.addCriteria(Criteria.where("specifications.gender").is(gender));
        }
        if (Boolean.TRUE.equals(sale)) {
            query.addCriteria(Criteria.where("salePercent").gt(0));
        }

        long total = mongoTemplate.count(query, Product.class);

        Sort sortOrder = ProductSortUtil.buildProductSort(sort);
        query.with(sortOrder);
        query.skip(offset).limit(limit);

        List<Product> products = mongoTemplate.find(query, Product.class);
        List<ProductResponse> records = products.stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());

        ProductsResponseData response = new ProductsResponseData();
        response.setRecords(records);
        response.setTotal(total);
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