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
import lombok.extern.slf4j.Slf4j; //debug

@Slf4j //debug
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
        log.info("============== BƯỚC 2: VÀO SERVICE TÌM KIẾM =============="); //debug
        log.info("3. Các tham số nhận được -> type: [{}], collectionSlug: [{}]", type, collectionSlug);
        Query query = new Query();
          query.addCriteria(Criteria.where("isActive").is(true));
        // Truyền thẳng String giống hệt dưới DB để bỏ qua lỗi ép kiểu Enum của Spring Data
        query.addCriteria(Criteria.where("availability").is("in_stock"));


        if (type != null && !type.trim().isEmpty()) {
            Product.ProductType matchedType = null;
            for (Product.ProductType pt : Product.ProductType.values()) {
                if (pt.getValue().equalsIgnoreCase(type.trim()) || pt.name().equalsIgnoreCase(type.trim())) {
                    matchedType = pt;
                    break;
                }
            }
            if (matchedType != null) {
                query.addCriteria(Criteria.where("type").is(matchedType));
            }
        }
        
        if (frameType != null && !frameType.trim().isEmpty()) {
            Product.FrameMaterial matchedMaterial = null;
            for (Product.FrameMaterial fm : Product.FrameMaterial.values()) {
                if (fm.name().equalsIgnoreCase(frameType.trim())) {
                    matchedMaterial = fm;
                    break;
                }
            }
            if (matchedMaterial != null) {
                query.addCriteria(Criteria.where("specifications.frameType.material").is(matchedMaterial));
            }
        }
        
        if (frameSize != null && !frameSize.trim().isEmpty()) {
            Product.FrameSize matchedSize = null;
            for (Product.FrameSize fs : Product.FrameSize.values()) {
                if (fs.name().equalsIgnoreCase(frameSize.trim())) {
                    matchedSize = fs;
                    break;
                }
            }
            if (matchedSize != null) {
                query.addCriteria(Criteria.where("specifications.frameType.size.label").is(matchedSize));
            }
        }
        
        if (collectionSlug != null && !collectionSlug.trim().isEmpty()) {
            log.info("============== BƯỚC 3: TRUY VẤN COLLECTION DB =============="); //debug
            log.info("4. Đang gọi collectionRepository.findBySlug với giá trị: [{}]", collectionSlug);
            Optional<Collection> collectionOpt = collectionRepository.findBySlug(collectionSlug);
            if (collectionOpt.isPresent()) {
                String collId = collectionOpt.get().getId();
                log.info("5. THÀNH CÔNG: Đã tìm thấy Collection. ID: [{}], Tên: [{}]", collId, collectionOpt.get().getName()); //debug
                query.addCriteria(Criteria.where("collectionId").is(collId));

                log.info("6. Đã thêm điều kiện lọc sản phẩm theo collectionId: [{}]", collId); //debug
            } else {
                log.warn("5. THẤT BẠI: KHÔNG TÌM THẤY Collection nào có slug là: [{}]", collectionSlug); //debug
                ProductsResponseData empty = new ProductsResponseData();
                empty.setRecords(List.of());
                empty.setTotal(0L);
                return empty;
            }
        }
        
        if (gender != null && !gender.trim().isEmpty()) {
            Product.ProductGender matchedGender = null;
            for (Product.ProductGender pg : Product.ProductGender.values()) {
                if (pg.name().equalsIgnoreCase(gender.trim())) {
                    matchedGender = pg;
                    break;
                }
            }
            if (matchedGender != null) {
                query.addCriteria(Criteria.where("specifications.gender").is(matchedGender));
            }
        }
        
        if (Boolean.TRUE.equals(sale)) {
            query.addCriteria(Criteria.where("salePercent").gt(0));
        }

        log.info("============== BƯỚC 4: LẤY SẢN PHẨM =============="); //debug
        log.info("7. Chuẩn bị chạy query lấy sản phẩm...");

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
        log.info("8. Xong! Đã tìm thấy [{}] sản phẩm khớp điều kiện.", products.size());
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