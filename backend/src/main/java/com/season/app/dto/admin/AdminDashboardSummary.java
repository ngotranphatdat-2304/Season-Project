package com.season.app.dto.admin;

import lombok.Data;

@Data
public class AdminDashboardSummary {
    private Long totalOrders;
    private Long completedOrders;
    private Long activeCustomers;
    private Long pendingOrders;
    private Double grossRevenue;
    private Double deliveredRevenue;
    private Long unitsSold;
    private Long lowStockProducts;
}

