package com.season.app.controller;

import com.season.app.dto.order.CheckoutOrderResponse;
import com.season.app.dto.order.OrderListQuery;
import com.season.app.dto.order.OrderListResponse;
import com.season.app.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    private String getUserId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid user request");
        }
        return principal.getName();
    }

    @GetMapping
    public ResponseEntity<OrderListResponse> listOrders(
            Principal principal,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String status) {
        
        OrderListQuery query = new OrderListQuery();
        query.setPage(page);
        query.setLimit(limit);
        // Map string status sang Enum (nếu có truyền)
        if (status != null) {
            try {
                // Giả sử có hàm mapping, tạm thời có thể truyền thẳng xuống service
            } catch (Exception e) {}
        }
        
        return ResponseEntity.ok(orderService.getOrdersForUser(getUserId(principal), query, status));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<CheckoutOrderResponse> getOrder(
            Principal principal,
            @PathVariable("orderId") String orderId) {
        return ResponseEntity.ok(orderService.getOrderForUser(getUserId(principal), orderId));
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<CheckoutOrderResponse> cancelOrder(
            Principal principal,
            @PathVariable("orderId") String orderId) {
        return ResponseEntity.ok(orderService.cancelOrderForUser(getUserId(principal), orderId));
    }
}