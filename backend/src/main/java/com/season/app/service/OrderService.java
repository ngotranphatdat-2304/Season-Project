package com.season.app.service;

import com.season.app.dto.order.*;
import com.season.app.model.Order;
import com.season.app.model.Product;
import com.season.app.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private MongoTemplate mongoTemplate;

    private static final Map<Order.OrderStatus, List<Order.OrderStatus>> ORDER_STATUS_TRANSITIONS = Map.of(
            Order.OrderStatus.PENDING, List.of(Order.OrderStatus.CONFIRMED, Order.OrderStatus.SHIPPED, Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED),
            Order.OrderStatus.CONFIRMED, List.of(Order.OrderStatus.SHIPPED, Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED),
            Order.OrderStatus.SHIPPED, List.of(Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED),
            Order.OrderStatus.DELIVERED, List.of(),
            Order.OrderStatus.CANCELLED, List.of()
    );

    private void recalculateProductAvailability(String productId) {
        Product product = mongoTemplate.findById(productId, Product.class);
        if (product != null) {
            int totalStock = product.getVariants().stream()
                    .mapToInt(Product.Variant::getStock)
                    .sum();
            product.setAvailability(totalStock > 0 ? Product.ProductAvailability.IN_STOCK : Product.ProductAvailability.OUT_OF_STOCK);
            mongoTemplate.save(product);
        }
    }

    public boolean isOrderStatusTransitionAllowed(Order.OrderStatus currentStatus, Order.OrderStatus nextStatus) {
        if (currentStatus == nextStatus) return true;
        return ORDER_STATUS_TRANSITIONS.getOrDefault(currentStatus, List.of()).contains(nextStatus);
    }

    public OrderListResponse getOrdersForUser(String userId, OrderListQuery queryDTO, String status) {
        Query query = new Query();
        query.addCriteria(Criteria.where("userId").is(userId));
        
        if (status != null && !status.isEmpty()) {
            query.addCriteria(Criteria.where("status").is(status.toLowerCase()));
        }
        
        long total = mongoTemplate.count(query, Order.class);
        
        query.with(PageRequest.of(queryDTO.getPage() - 1, queryDTO.getLimit(), Sort.by(Sort.Direction.DESC, "createdAt")));
        List<Order> orders = mongoTemplate.find(query, Order.class);

        List<CheckoutOrderResponse> records = orders.stream().map(this::toCheckoutOrderResponse).collect(Collectors.toList());

        OrderListResponse res = new OrderListResponse();
        res.setRecords(records);
        res.setTotal(total);
        res.setPage(queryDTO.getPage());
        res.setLimit(queryDTO.getLimit());
        res.setTotalPages((int) Math.ceil((double) total / queryDTO.getLimit()));
        return res;
    }

    public CheckoutOrderResponse getOrderForUser(String userId, String orderId) {
        Order order = orderRepository.findById(orderId)
                .filter(o -> userId.equals(o.getUserId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        return toCheckoutOrderResponse(order);
    }

    @Transactional
    public CheckoutOrderResponse cancelOrderForUser(String userId, String orderId) {
        Order order = orderRepository.findById(orderId)
                .filter(o -> userId.equals(o.getUserId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!isOrderStatusTransitionAllowed(order.getStatus(), Order.OrderStatus.CANCELLED)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order cannot be cancelled");
        }

        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            return toCheckoutOrderResponse(order);
        }

        // Hoàn lại lượng Stock đã đặt
        for (Order.OrderItem item : order.getItems()) {
            Query query = new Query(Criteria.where("_id").is(item.getProductId())
                    .and("variants.sku").is(item.getVariantSku()));
            Update update = new Update().inc("variants.$.stock", item.getQuantity());
            mongoTemplate.updateFirst(query, update, Product.class);

            // Đồng bộ: Tính toán lại trạng thái In stock / Out of stock
            recalculateProductAvailability(item.getProductId());
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setCancelledAt(Instant.now());
        orderRepository.save(order);

        return toCheckoutOrderResponse(order);
    }

    private CheckoutOrderResponse toCheckoutOrderResponse(Order order) {
        CheckoutOrderResponse res = new CheckoutOrderResponse();
        res.setId(order.getId());
        res.setUserId(order.getUserId());
        res.setGuestId(order.getGuestId());
        res.setCustomerEmail(order.getCustomerEmail());
        res.setCheckoutToken(order.getCheckoutToken());
        res.setStatus(order.getStatus());
        res.setPaymentStatus(order.getPaymentStatus());
        res.setPaymentMethod(order.getPaymentMethod());
        res.setShippingAddress(order.getShippingAddress());
        res.setSubtotalAmount(order.getSubtotalAmount());
        res.setTotalAmount(order.getTotalAmount());
        res.setCurrency(order.getCurrency());
        
        List<CheckoutOrderItemResponse> items = order.getItems().stream().map(item -> {
            CheckoutOrderItemResponse itemRes = new CheckoutOrderItemResponse();
            itemRes.setProductId(item.getProductId());
            itemRes.setProductName(item.getProductName());
            itemRes.setVariantSku(item.getVariantSku());
            itemRes.setQuantity(item.getQuantity());
            itemRes.setUnitPrice(item.getUnitPrice());
            itemRes.setLineTotal(item.getLineTotal());
            return itemRes;
        }).collect(Collectors.toList());
        res.setItems(items);
        
        return res;
    }
}