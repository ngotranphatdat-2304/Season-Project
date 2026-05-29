package com.season.app.controller;

import com.season.app.dto.admin.*;
import com.season.app.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboard() {
        return ResponseEntity.ok(adminService.getAdminDashboard());
    }

    @GetMapping("/products")
    public ResponseEntity<AdminProductListResponse> getProducts(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "collectionId", required = false) String collectionId,
            @RequestParam(value = "isActive", required = false) Boolean isActive) {
            
        AdminProductsQuery query = new AdminProductsQuery();
        query.setPage(page);
        query.setLimit(limit);
        query.setQ(q);
        query.setCollectionId(collectionId);
        query.setIsActive(isActive);

        return ResponseEntity.ok(adminService.listAdminProducts(query));
    }

    @PostMapping("/products")
    public ResponseEntity<AdminProductResponse> createProduct(@Valid @RequestBody AdminProductInput input) {
        return ResponseEntity.ok(adminService.createAdminProduct(input));
    }

    @PutMapping("/products/{productId}")
    public ResponseEntity<AdminProductResponse> updateProduct(
            @PathVariable("productId") String productId,
            @Valid @RequestBody AdminProductInput input) {
        return ResponseEntity.ok(adminService.updateAdminProduct(productId, input));
    }

    @GetMapping("/collections")
    public ResponseEntity<AdminCollectionListResponse> getCollections() {
        return ResponseEntity.ok(adminService.listAdminCollections());
    }

    @PostMapping("/collections")
    public ResponseEntity<AdminCollectionResponse> createCollection(@Valid @RequestBody AdminCollectionInput input) {
        return ResponseEntity.ok(adminService.createAdminCollection(input));
    }

    @PutMapping("/collections/{collectionId}")
    public ResponseEntity<AdminCollectionResponse> updateCollection(
            @PathVariable("collectionId") String collectionId,
            @Valid @RequestBody AdminCollectionInput input) {
        return ResponseEntity.ok(adminService.updateAdminCollection(collectionId, input));
    }

    @GetMapping("/orders")
    public ResponseEntity<AdminOrderListResponse> getOrders(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "paymentStatus", required = false) String paymentStatus) {
            
        AdminOrdersQuery query = new AdminOrdersQuery();
        query.setPage(page);
        query.setLimit(limit);
        try {
            if (status != null) query.setStatus(com.season.app.model.Order.OrderStatus.fromValue(status));
            if (paymentStatus != null) query.setPaymentStatus(com.season.app.model.Order.PaymentStatus.fromValue(paymentStatus));
        } catch (IllegalArgumentException ignored) {}

        return ResponseEntity.ok(adminService.listAdminOrders(query));
    }

    @PatchMapping("/orders/{orderId}")
    public ResponseEntity<AdminOrderResponse> updateOrder(
            @PathVariable("orderId") String orderId,
            @Valid @RequestBody AdminOrderUpdateInput input) {
        return ResponseEntity.ok(adminService.updateAdminOrder(orderId, input));
    }
}