package com.season.app.dto.admin;

import java.util.List;
import lombok.Data;

@Data
public class AdminDashboardResponse {
    private AdminDashboardSummary summary;
    private List<AdminDashboardRevenuePoint> revenueTrend;
    private List<AdminTopProduct> topProducts;
    private List<AdminRecentOrder> recentOrders;
}

