"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminRequest } from "@/lib/admin/auth";

type DashboardResponse = {
  summary: {
    totalOrders: number;
    completedOrders: number;
    activeCustomers: number;
    pendingOrders: number;
    grossRevenue: number;
    deliveredRevenue: number;
    unitsSold: number;
    lowStockProducts: number;
  };
  revenueTrend: Array<{
    day: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    unitsSold: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    placedAt?: string;
  }>;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getDisplayOrderStatus(status: string, paymentStatus: string): string {
  return status === "delivered" && paymentStatus === "paid" ? "completed" : status;
}

function getOrderStatusTone(status: string, paymentStatus: string): string {
  const displayStatus = getDisplayOrderStatus(status, paymentStatus);

  if (displayStatus === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (displayStatus === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

type ChartPoint = {
  x: number;
  y: number;
  label: string;
  revenue: number;
  orders: number;
};

function buildChart(points: DashboardResponse["revenueTrend"]): {
  linePath: string;
  areaPath: string;
  chartPoints: ChartPoint[];
  maxRevenue: number;
} {
  const width = 720;
  const height = 220;
  const paddingLeft = 24;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 34;
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 1);
  const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  const chartPoints = points.map((point, index) => {
    const x = paddingLeft + step * index;
    const y = paddingTop + (1 - point.revenue / maxRevenue) * innerHeight;

    return {
      x,
      y,
      label: point.day,
      revenue: point.revenue,
      orders: point.orders,
    };
  });

  if (chartPoints.length === 0) {
    return {
      linePath: "",
      areaPath: "",
      chartPoints,
      maxRevenue,
    };
  }

  const baseline = height - paddingBottom;
  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = [
    `M ${chartPoints[0].x} ${baseline}`,
    ...chartPoints.map((point) => `L ${point.x} ${point.y}`),
    `L ${chartPoints[chartPoints.length - 1].x} ${baseline}`,
    "Z",
  ].join(" ");

  return {
    linePath,
    areaPath,
    chartPoints,
    maxRevenue,
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const response = await adminRequest<DashboardResponse>({
          url: "/admin/dashboard",
          method: "GET",
        });

        if (isCancelled === false) {
          setData(response);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isCancelled === false) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load dashboard",
          );
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  const topProducts = (data?.topProducts ?? []).slice(0, 3);
  const chart = buildChart(data?.revenueTrend ?? []);

  return (
    <AdminGuard>
      {(user) => (
        <AdminShell user={user}>
          <div className="space-y-8">
            <div className="w-full max-w-none space-y-3">
              <p className="font-afacad text-sm uppercase tracking-[0.3em] text-black/45">
                Dashboard
              </p>
              <h1 className="w-full max-w-none whitespace-nowrap font-serif text-4xl leading-tight tracking-[-0.03em]">
                Studio overview
              </h1>
              <p className="max-w-3xl whitespace-nowrap text-sm leading-7 text-black/55">
                Live view of orders, revenue, and stock status from MongoDB.
              </p>
            </div>

            {errorMessage !== null ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {errorMessage}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Gross Revenue",
                  value: formatCurrency(data?.summary.grossRevenue ?? 0),
                },
                {
                  label: "Completed Orders",
                  value: String(data?.summary.completedOrders ?? 0),
                },
                {
                  label: "Total Orders",
                  value: String(data?.summary.totalOrders ?? 0),
                },
                {
                  label: "Units Sold",
                  value: String(data?.summary.unitsSold ?? 0),
                },
                {
                  label: "Pending Orders",
                  value: String(data?.summary.pendingOrders ?? 0),
                },
                {
                  label: "Active Customers",
                  value: String(data?.summary.activeCustomers ?? 0),
                },
                {
                  label: "Low Stock Products",
                  value: String(data?.summary.lowStockProducts ?? 0),
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.75rem] border border-black/8 bg-[#faf8f4] p-5"
                >
                  <p className="font-afacad text-xs uppercase tracking-[0.25em] text-black/45">
                    {metric.label}
                  </p>
                  <p className="mt-4 font-serif text-3xl">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <section className="rounded-[2rem] border border-black/8 bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-afacad text-xs uppercase tracking-[0.25em] text-black/45">
                      Revenue Trend
                    </p>
                    <h2 className="mt-2 font-serif text-2xl">Last 7 days</h2>
                  </div>
                </div>
                <div className="mt-6">
                  {chart.chartPoints.length > 0 ? (
                    <div className="overflow-hidden rounded-[1.5rem] border border-black/6 bg-[#fcfbf8] p-4">
                      <svg
                        viewBox="0 0 720 220"
                        className="h-[240px] w-full overflow-visible"
                        role="img"
                        aria-label="Weekly revenue line chart"
                      >
                        <defs>
                          <linearGradient id="revenue-line" x1="0%" x2="0%" y1="0%" y2="100%">
                            <stop offset="0%" stopColor="#d7b58b" stopOpacity="0.36" />
                            <stop offset="100%" stopColor="#d7b58b" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>

                        {[0, 1, 2, 3].map((index) => {
                          const y = 20 + (200 / 3) * index;

                          return (
                            <line
                              key={y}
                              x1="24"
                              x2="696"
                              y1={y}
                              y2={y}
                              stroke="rgba(0,0,0,0.06)"
                              strokeDasharray="4 6"
                            />
                          );
                        })}

                        <path d={chart.areaPath} fill="url(#revenue-line)" />
                        <path
                          d={chart.linePath}
                          fill="none"
                          stroke="#111111"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {chart.chartPoints.map((point) => (
                          <g key={point.label}>
                            <circle cx={point.x} cy={point.y} r="8" fill="rgba(17,17,17,0.08)" />
                            <circle cx={point.x} cy={point.y} r="4.5" fill="#111111" />
                            <text
                              x={point.x}
                              y="206"
                              textAnchor="middle"
                              className="fill-black/55 font-afacad text-[12px] uppercase tracking-[0.14em]"
                            >
                              {point.label}
                            </text>
                            <text
                              x={point.x}
                              y={Math.max(point.y - 12, 18)}
                              textAnchor="middle"
                              className="fill-black/45 font-afacad text-[11px] uppercase tracking-[0.12em]"
                            >
                              {point.orders}
                            </text>
                          </g>
                        ))}
                      </svg>

                      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-black/55">
                        <span>7-day revenue trend</span>
                        <span>Peak {formatCurrency(chart.maxRevenue)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-[#fcfbf8] p-8 text-sm text-black/45">
                      No revenue data for the last 7 days.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[2rem] border border-black/8 bg-[#121212] p-6 text-white">
                <p className="font-afacad text-xs uppercase tracking-[0.25em] text-white/45">
                  Top Products
                </p>
                <h2 className="mt-2 font-serif text-2xl">Best sellers</h2>
                <div className="mt-6 space-y-4">
                  {topProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                    >
                      <p className="font-serif text-lg">{product.productName}</p>
                      <p className="mt-2 text-sm text-white/55">
                        {product.unitsSold} units sold
                      </p>
                      <p className="mt-1 text-sm text-[#d7b58b]">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="rounded-[2rem] border border-black/8 bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-afacad text-xs uppercase tracking-[0.25em] text-black/45">
                    Recent Orders
                  </p>
                  <h2 className="mt-2 font-serif text-2xl">Latest activity</h2>
                </div>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-black/45">
                    <tr>
                      <th className="pb-3 font-afacad uppercase tracking-[0.16em]">Order / Customer</th>
                      <th className="pb-3 font-afacad uppercase tracking-[0.16em]">Total</th>
                      <th className="pb-3 font-afacad uppercase tracking-[0.16em]">Status</th>
                      <th className="pb-3 font-afacad uppercase tracking-[0.16em]">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentOrders ?? []).map((order) => (
                      <tr key={order.id} className="border-t border-black/6">
                        <td className="py-4">
                          <p className="font-afacad text-xs uppercase tracking-[0.22em] text-black/40">
                            Order #{order.id.slice(-6)}
                          </p>
                          <p className="mt-1 font-medium">{order.customerName}</p>
                          <p className="text-black/45">{order.customerEmail}</p>
                        </td>
                        <td className="py-4">{formatCurrency(order.totalAmount)}</td>
                        <td className="py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 font-afacad text-[11px] uppercase tracking-[0.16em] ${getOrderStatusTone(order.status, order.paymentStatus)}`}
                          >
                            {getDisplayOrderStatus(order.status, order.paymentStatus)}
                          </span>
                        </td>
                        <td className="py-4 uppercase text-black/65">{order.paymentStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </AdminShell>
      )}
    </AdminGuard>
  );
}
