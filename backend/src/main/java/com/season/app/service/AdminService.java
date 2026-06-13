package com.season.app.service;

import com.season.app.dto.admin.*;
import com.season.app.model.*;
import com.season.app.model.Collection;
import com.season.app.repository.*;
import com.season.app.util.DateTimeUtil;
import com.season.app.util.SlugUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    // Kiểm tra đơn hàng hoàn thành (Đã giao hàng và đã thanh toán)
    public boolean isCompletedOrder(Order order) {
        return order.getStatus() == Order.OrderStatus.DELIVERED
                && order.getPaymentStatus() == Order.PaymentStatus.PAID;
    }

    // Tự động tính toán lại số lượng sản phẩm in_stock của bộ sưu tập
    private void refreshCollectionInStockCounts(String collectionId) {
        if (collectionId == null) return;
        
        Query query = new Query();
        try {
            query.addCriteria(Criteria.where("collectionId").is(new org.bson.types.ObjectId(collectionId)));
        } catch (IllegalArgumentException e) {
            query.addCriteria(Criteria.where("collectionId").is(collectionId));
        }
        query.addCriteria(Criteria.where("isActive").is(true)
                .and("availability").is(Product.ProductAvailability.IN_STOCK));
        
        long count = mongoTemplate.count(query, Product.class);

        Collection collection = mongoTemplate.findById(collectionId, Collection.class);
        if (collection != null) {
            collection.setInStockCount((int) count);
            mongoTemplate.save(collection);
        }
    }

    // --- Dashboard Overview ---
    public AdminDashboardResponse getAdminDashboard() {
        long totalOrders = orderRepository.count();

        // Active customers (role: customer, status: active, isActive: true)
        Query activeCustomersQuery = new Query(Criteria.where("role").is("customer")
                .and("status").is("active")
                .and("isActive").is(true));
        long activeCustomers = mongoTemplate.count(activeCustomersQuery, User.class);

        // Pending orders (status: pending, confirmed, shipped)
        Query pendingOrdersQuery = new Query(Criteria.where("status").in("pending", "confirmed", "shipped"));
        long pendingOrders = mongoTemplate.count(pendingOrdersQuery, Order.class);

        // Sản phẩm có lượng tồn kho thấp (Variants stock <= 2)
        Query lowStockQuery = new Query(Criteria.where("isActive").is(true)
                .and("availability").is(Product.ProductAvailability.IN_STOCK)
                .and("variants.stock").lte(2));
        long lowStockProducts = mongoTemplate.count(lowStockQuery, Product.class);

        // Danh sách đơn hàng không bị huỷ
        Query nonCancelledQuery = new Query(Criteria.where("status").ne("cancelled"));
        List<Order> nonCancelledOrders = mongoTemplate.find(nonCancelledQuery, Order.class);

        long completedOrdersCount = 0;
        double completedRevenue = 0;
        long unitsSold = 0;
        Map<String, AdminTopProduct> topProductMap = new HashMap<>();

        // Biểu đồ doanh thu 7 ngày gần nhất
        List<DateTimeUtil.DayLabel> last7Days = DateTimeUtil.getLastSevenDays();
        Map<String, Double> dailyRevenue = new HashMap<>();
        Map<String, Long> dailyOrdersCount = new HashMap<>();
        for (DateTimeUtil.DayLabel day : last7Days) {
            dailyRevenue.put(day.key(), 0.0);
            dailyOrdersCount.put(day.key(), 0L);
        }

        for (Order order : nonCancelledOrders) {
            if (isCompletedOrder(order)) {
                completedOrdersCount++;
                completedRevenue += order.getTotalAmount();

                String dateKey = order.getPlacedAt().atZone(ZoneId.systemDefault()).toLocalDate().toString();
                if (dailyRevenue.containsKey(dateKey)) {
                    dailyRevenue.put(dateKey, dailyRevenue.get(dateKey) + order.getTotalAmount());
                    dailyOrdersCount.put(dateKey, dailyOrdersCount.get(dateKey) + 1);
                }

                for (Order.OrderItem item : order.getItems()) {
                    unitsSold += item.getQuantity();

                    String key = item.getProductId() + ":" + item.getProductName();
                    AdminTopProduct topProduct = topProductMap.getOrDefault(key, new AdminTopProduct());
                    topProduct.setProductId(item.getProductId());
                    topProduct.setProductName(item.getProductName());
                    topProduct.setUnitsSold((topProduct.getUnitsSold() != null ? topProduct.getUnitsSold() : 0) + item.getQuantity());
                    topProduct.setRevenue((topProduct.getRevenue() != null ? topProduct.getRevenue() : 0) + item.getLineTotal());
                    topProductMap.put(key, topProduct);
                }
            }
        }

        List<AdminDashboardRevenuePoint> revenueTrend = last7Days.stream().map(day -> {
            AdminDashboardRevenuePoint pt = new AdminDashboardRevenuePoint();
            pt.setDay(day.label());
            pt.setRevenue(dailyRevenue.getOrDefault(day.key(), 0.0));
            pt.setOrders(dailyOrdersCount.getOrDefault(day.key(), 0L));
            return pt;
        }).collect(Collectors.toList());

        List<AdminTopProduct> topProducts = topProductMap.values().stream()
                .sorted((a, b) -> Long.compare(b.getUnitsSold(), a.getUnitsSold()))
                .limit(3)
                .collect(Collectors.toList());

        // Lấy 5 đơn hàng hoạt động gần nhất
        Query recentOrdersQuery = new Query().with(Sort.by(Sort.Direction.DESC, "createdAt")).limit(5);
        List<Order> recentOrders = mongoTemplate.find(recentOrdersQuery, Order.class);
        List<AdminRecentOrder> recentOrdersResponse = recentOrders.stream().map(o -> {
            AdminRecentOrder ro = new AdminRecentOrder();
            ro.setId(o.getId());
            String name = o.getShippingAddress().getRecipientName();
            String email = o.getCustomerEmail();
            if (o.getUserId() != null) {
                User u = mongoTemplate.findById(o.getUserId(), User.class);
                if (u != null) {
                    name = u.getName();
                    email = u.getEmail();
                }
            }
            ro.setCustomerName(name);
            ro.setCustomerEmail(email);
            ro.setTotalAmount(o.getTotalAmount());
            ro.setStatus(o.getStatus());
            ro.setPaymentStatus(o.getPaymentStatus());
            ro.setPlacedAt(o.getPlacedAt());
            return ro;
        }).collect(Collectors.toList());

        AdminDashboardSummary summary = new AdminDashboardSummary();
        summary.setTotalOrders(totalOrders);
        summary.setCompletedOrders(completedOrdersCount);
        summary.setActiveCustomers(activeCustomers);
        summary.setPendingOrders(pendingOrders);
        summary.setGrossRevenue(completedRevenue);
        summary.setDeliveredRevenue(completedRevenue);
        summary.setUnitsSold(unitsSold);
        summary.setLowStockProducts(lowStockProducts);

        AdminDashboardResponse response = new AdminDashboardResponse();
        response.setSummary(summary);
        response.setRevenueTrend(revenueTrend);
        response.setTopProducts(topProducts);
        response.setRecentOrders(recentOrdersResponse);
        return response;
    }

    // --- Admin Collection Editor ---
    public AdminCollectionListResponse listAdminCollections() {
        List<Collection> list = collectionRepository.findAll();
        List<AdminCollectionResponse> records = list.stream().map(c -> {
            AdminCollectionResponse r = new AdminCollectionResponse();
            r.setId(c.getId());
            r.setName(c.getName());
            r.setSlug(c.getSlug());
            r.setInStockCount(c.getInStockCount());
            r.setCreatedAt(c.getCreatedAt());
            r.setUpdatedAt(c.getUpdatedAt());
            return r;
        }).collect(Collectors.toList());

        AdminCollectionListResponse response = new AdminCollectionListResponse();
        response.setRecords(records);
        response.setTotal((long) records.size());
        return response;
    }

    public AdminCollectionResponse createAdminCollection(AdminCollectionInput input) {
        Collection collection = Collection.builder()
                .name(input.getName())
                .slug(SlugUtil.normalizeSlug(input.getSlug()))
                .build();
        collectionRepository.save(collection);

        AdminCollectionResponse res = new AdminCollectionResponse();
        res.setId(collection.getId());
        res.setName(collection.getName());
        res.setSlug(collection.getSlug());
        res.setInStockCount(0);
        return res;
    }

    public AdminCollectionResponse updateAdminCollection(String collectionId, AdminCollectionInput input) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection not found"));
        collection.setName(input.getName());
        collection.setSlug(SlugUtil.normalizeSlug(input.getSlug()));
        collectionRepository.save(collection);

        AdminCollectionResponse res = new AdminCollectionResponse();
        res.setId(collection.getId());
        res.setName(collection.getName());
        res.setSlug(collection.getSlug());
        res.setInStockCount(collection.getInStockCount());
        return res;
    }

    // --- Admin Product Editor ---
    public AdminProductListResponse listAdminProducts(AdminProductsQuery query) {
        Query q = new Query();
        if (query.getQ() != null && !query.getQ().trim().isEmpty()) {
            q.addCriteria(Criteria.where("name").regex(query.getQ().trim(), "i"));
        }
        if (query.getCollectionId() != null && !query.getCollectionId().trim().isEmpty()) {
            try {
                q.addCriteria(Criteria.where("collectionId").is(new org.bson.types.ObjectId(query.getCollectionId())));
            } catch (IllegalArgumentException e) {
                q.addCriteria(Criteria.where("collectionId").is(query.getCollectionId()));
            }
        }
        if (query.getIsActive() != null) {
            q.addCriteria(Criteria.where("isActive").is(query.getIsActive()));
        }

        long total = mongoTemplate.count(q, Product.class);
        q.with(Sort.by(Sort.Direction.DESC, "updatedAt"));
        q.skip((query.getPage() - 1) * query.getLimit()).limit(query.getLimit());

        List<Product> list = mongoTemplate.find(q, Product.class);
        List<AdminProductResponse> records = list.stream().map(p -> {
            AdminProductResponse r = new AdminProductResponse();
            r.setId(p.getId());
            r.setName(p.getName());
            r.setSlug(p.getSlug());
            r.setType(p.getType());
            r.setCollectionId(p.getCollectionId());
            r.setBrand(p.getBrand());
            r.setSalePercent(p.getSalePercent());
            r.setAvailability(p.getAvailability());
            r.setDescription(p.getDescription());
            r.setIsActive(p.getIsActive());
            r.setVariants(p.getVariants());
            r.setRating(p.getRating());
            r.setCreatedAt(p.getCreatedAt());
            r.setUpdatedAt(p.getUpdatedAt());

            AdminProductResponse.SpecificationsResponse spec = new AdminProductResponse.SpecificationsResponse();
            spec.setGender(p.getSpecifications().getGender());
            AdminProductResponse.FrameTypeResponse ft = new AdminProductResponse.FrameTypeResponse();
            ft.setMaterial(p.getSpecifications().getFrameType().getMaterial());
            
            AdminFrameSizeInput sizeInput = new AdminFrameSizeInput();
            sizeInput.setLabel(p.getSpecifications().getFrameType().getSize().getLabel());
            sizeInput.setImage(p.getSpecifications().getFrameType().getSize().getImage());
            ft.setSize(sizeInput);
            spec.setFrameType(ft);
            r.setSpecifications(spec);
            
            collectionRepository.findById(p.getCollectionId()).ifPresent(c -> r.setCollectionName(c.getName()));
            return r;
        }).collect(Collectors.toList());

        AdminProductListResponse response = new AdminProductListResponse();
        response.setRecords(records);
        response.setTotal(total);
        response.setPage(query.getPage());
        response.setLimit(query.getLimit());
        response.setTotalPages((int) Math.ceil((double) total / query.getLimit()));
        return response;
    }

    public AdminProductResponse createAdminProduct(AdminProductInput input) {
        Product.FrameSizeDetail sizeDetail = Product.FrameSizeDetail.builder()
                .label(input.getSpecifications().getFrameType().getSize().getLabel())
                .image(input.getSpecifications().getFrameType().getSize().getImage())
                .build();

        Product.FrameType frameType = Product.FrameType.builder()
                .material(input.getSpecifications().getFrameType().getMaterial())
                .size(sizeDetail)
                .build();

        Product.Specifications specs = Product.Specifications.builder()
                .gender(input.getSpecifications().getGender())
                .frameType(frameType)
                .build();

        List<Product.Variant> variants = input.getVariants().stream().map(v ->
                Product.Variant.builder()
                        .sku(v.getSku())
                        .color(v.getColor())
                        .price(v.getPrice())
                        .images(v.getImages())
                        .tryOnImage(v.getTryOnImage())
                        .tryOnModel(v.getTryOnModel())
                        .isDefault(v.getIsDefault())
                        .stock(v.getStock())
                        .build()
        ).collect(Collectors.toList());

        Product product = Product.builder()
                .name(input.getName())
                .slug(SlugUtil.normalizeSlug(input.getSlug()))
                .type(input.getType())
                .collectionId(input.getCollectionId())
                .brand(input.getBrand())
                .salePercent(input.getSalePercent())
                .availability(input.getAvailability())
                .description(input.getDescription())
                .isActive(input.getIsActive())
                .specifications(specs)
                .variants(variants)
                .build();

        productRepository.save(product);
        refreshCollectionInStockCounts(product.getCollectionId());

        return toAdminProductResponse(product);
    }

    public AdminProductResponse updateAdminProduct(String productId, AdminProductInput input) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        product.setName(input.getName());
        product.setSlug(SlugUtil.normalizeSlug(input.getSlug()));
        product.setType(input.getType());
        product.setCollectionId(input.getCollectionId());
        product.setBrand(input.getBrand());
        product.setSalePercent(input.getSalePercent());
        product.setAvailability(input.getAvailability());
        product.setDescription(input.getDescription());
        product.setIsActive(input.getIsActive());

        Product.FrameSizeDetail sizeDetail = Product.FrameSizeDetail.builder()
                .label(input.getSpecifications().getFrameType().getSize().getLabel())
                .image(input.getSpecifications().getFrameType().getSize().getImage())
                .build();

        Product.FrameType frameType = Product.FrameType.builder()
                .material(input.getSpecifications().getFrameType().getMaterial())
                .size(sizeDetail)
                .build();

        Product.Specifications specs = Product.Specifications.builder()
                .gender(input.getSpecifications().getGender())
                .frameType(frameType)
                .build();
        product.setSpecifications(specs);

        List<Product.Variant> variants = input.getVariants().stream().map(v ->
                Product.Variant.builder()
                        .sku(v.getSku())
                        .color(v.getColor())
                        .price(v.getPrice())
                        .images(v.getImages())
                        .tryOnImage(v.getTryOnImage())
                        .tryOnModel(v.getTryOnModel())
                        .isDefault(v.getIsDefault())
                        .stock(v.getStock())
                        .build()
        ).collect(Collectors.toList());
        product.setVariants(variants);

        productRepository.save(product);
        refreshCollectionInStockCounts(product.getCollectionId());

        return toAdminProductResponse(product);
    }

    private AdminProductResponse toAdminProductResponse(Product product) {
        AdminProductResponse r = new AdminProductResponse();
        r.setId(product.getId());
        r.setName(product.getName());
        r.setSlug(product.getSlug());
        r.setType(product.getType());
        r.setCollectionId(product.getCollectionId());
        r.setBrand(product.getBrand());
        r.setSalePercent(product.getSalePercent());
        r.setAvailability(product.getAvailability());
        r.setDescription(product.getDescription());
        r.setIsActive(product.getIsActive());
        r.setVariants(product.getVariants());
        r.setRating(product.getRating());
        return r;
    }

    // --- Admin Orders List ---
    public AdminOrderListResponse listAdminOrders(AdminOrdersQuery query) {
        Query q = new Query();
        if (query.getStatus() != null) {
            q.addCriteria(Criteria.where("status").is(query.getStatus()));
        }
        if (query.getPaymentStatus() != null) {
            q.addCriteria(Criteria.where("paymentStatus").is(query.getPaymentStatus()));
        }

        long total = mongoTemplate.count(q, Order.class);
        q.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        q.skip((query.getPage() - 1) * query.getLimit()).limit(query.getLimit());

        List<Order> list = mongoTemplate.find(q, Order.class);
        List<AdminOrderResponse> records = list.stream().map(o -> {
            AdminOrderResponse r = new AdminOrderResponse();
            r.setId(o.getId());
            r.setUserId(o.getUserId());
            r.setCustomerEmail(o.getCustomerEmail());
            r.setStatus(o.getStatus());
            r.setPaymentStatus(o.getPaymentStatus());
            r.setPaymentMethod(o.getPaymentMethod());
            r.setShippingAddress(o.getShippingAddress());
            r.setSubtotalAmount(o.getSubtotalAmount());
            r.setDiscountAmount(o.getDiscountAmount());
            r.setShippingFee(o.getShippingFee());
            r.setTaxAmount(o.getTaxAmount());
            r.setTotalAmount(o.getTotalAmount());
            r.setCurrency(o.getCurrency());
            r.setPlacedAt(o.getPlacedAt());
            r.setCancelledAt(o.getCancelledAt());
            r.setDeliveredAt(o.getDeliveredAt());
            r.setCreatedAt(o.getCreatedAt());
            r.setUpdatedAt(o.getUpdatedAt());

            String name = o.getShippingAddress().getRecipientName();
            if (o.getUserId() != null) {
                User u = mongoTemplate.findById(o.getUserId(), User.class);
                if (u != null) name = u.getName();
            }
            r.setCustomerName(name);

            List<AdminOrderItemResponse> items = o.getItems().stream().map(i -> {
                AdminOrderItemResponse ir = new AdminOrderItemResponse();
                ir.setProductId(i.getProductId());
                ir.setProductName(i.getProductName());
                ir.setVariantSku(i.getVariantSku());
                ir.setQuantity(i.getQuantity());
                ir.setUnitPrice(i.getUnitPrice());
                ir.setLineTotal(i.getLineTotal());
                return ir;
            }).collect(Collectors.toList());
            r.setItems(items);

            return r;
        }).collect(Collectors.toList());

        AdminOrderListResponse response = new AdminOrderListResponse();
        response.setRecords(records);
        response.setTotal(total);
        response.setPage(query.getPage());
        response.setLimit(query.getLimit());
        response.setTotalPages((int) Math.ceil((double) total / query.getLimit()));
        return response;
    }

    // --- Admin Order Status Manager ---
    @Transactional
    public AdminOrderResponse updateAdminOrder(String orderId, AdminOrderUpdateInput input) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (input.getStatus() != null && order.getStatus() != input.getStatus()) {
            // Khi chuyển trạng thái sang CANCELLED -> Hoàn lại kho các variants
            if (input.getStatus() == Order.OrderStatus.CANCELLED) {
                for (Order.OrderItem item : order.getItems()) {
                    Query q = new Query(Criteria.where("_id").is(item.getProductId())
                            .and("variants.sku").is(item.getVariantSku()));
                    Update update = new Update().inc("variants.$.stock", item.getQuantity());
                    mongoTemplate.updateFirst(q, update, Product.class);

                    // Tính lại availability của sản phẩm cha
                    Product product = mongoTemplate.findById(item.getProductId(), Product.class);
                    if (product != null) {
                        int totalStock = product.getVariants().stream().mapToInt(Product.Variant::getStock).sum();
                        product.setAvailability(totalStock > 0 ? Product.ProductAvailability.IN_STOCK : Product.ProductAvailability.OUT_OF_STOCK);
                        mongoTemplate.save(product);
                    }
                }
                order.setCancelledAt(java.time.Instant.now());
            }

            order.setStatus(input.getStatus());
            if (input.getStatus() == Order.OrderStatus.DELIVERED) {
                order.setDeliveredAt(java.time.Instant.now());
            }
        }

        if (input.getPaymentStatus() != null) {
            order.setPaymentStatus(input.getPaymentStatus());
        }

        orderRepository.save(order);

        AdminOrderResponse r = new AdminOrderResponse();
        r.setId(order.getId());
        r.setStatus(order.getStatus());
        r.setPaymentStatus(order.getPaymentStatus());
        return r;
    }
}
