"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminRequest } from "@/lib/admin/auth";

type OrderRecord = {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
  placedAt?: string;
};

type OrdersResponse = {
  records: OrderRecord[];
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

const ADMIN_ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
const ADMIN_PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const loadOrders = async () => {
    const response = await adminRequest<OrdersResponse>({
      url: "/admin/orders",
      method: "GET",
      params: {
        page: 1,
        limit: 50,
        ...(statusFilter === "" ? {} : { status: statusFilter }),
        ...(paymentFilter === "" ? {} : { paymentStatus: paymentFilter }),
      },
    });

    setOrders(response.records);
  };

  const updateOrder = async (
    orderId: string,
    payload: { status?: string; paymentStatus?: string },
  ): Promise<void> => {
    try {
      await adminRequest({
        url: `/admin/orders/${orderId}`,
        method: "PATCH",
        data: payload,
      });
      await loadOrders();
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update order");
    }
  };

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const response = await adminRequest<OrdersResponse>({
          url: "/admin/orders",
          method: "GET",
          params: {
            page: 1,
            limit: 50,
            ...(statusFilter === "" ? {} : { status: statusFilter }),
            ...(paymentFilter === "" ? {} : { paymentStatus: paymentFilter }),
          },
        });

        if (isCancelled === false) {
          setOrders(response.records);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isCancelled === false) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load orders");
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [statusFilter, paymentFilter]);

  return (
    <AdminGuard>
      {(user) => (
        <AdminShell user={user}>
          <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 md:max-w-[22rem]">
                <p className="font-afacad text-sm uppercase tracking-[0.3em] text-black/45">
                  Orders
                </p>
                <h1 className="mt-2 font-serif text-4xl">Order operations</h1>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                  }}
                  className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
                >
                  <option value="">All statuses</option>
                  {ADMIN_ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <select
                  value={paymentFilter}
                  onChange={(event) => {
                    setPaymentFilter(event.target.value);
                  }}
                  className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
                >
                  <option value="">All payment states</option>
                  {["unpaid", "paid", "failed", "refunded"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errorMessage !== null ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-4">
              {orders.map((order) => (
                <section
                  key={order.id}
                  className="rounded-[2rem] border border-black/8 bg-white p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-afacad text-xs uppercase tracking-[0.25em] text-black/45">
                        Order {order.id.slice(-6)}
                      </p>
                      <h2 className="mt-2 font-serif text-2xl">{order.customerName}</h2>
                      <p className="mt-2 text-sm text-black/55">{order.customerEmail}</p>
                      <p
                        className={`mt-2 inline-flex rounded-full border px-3 py-1 font-afacad text-[11px] uppercase tracking-[0.16em] ${getOrderStatusTone(order.status, order.paymentStatus)}`}
                      >
                        {getDisplayOrderStatus(order.status, order.paymentStatus)}
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:min-w-[360px]">
                      <select
                        value={order.status}
                        onChange={(event) => {
                          void updateOrder(order.id, { status: event.target.value });
                        }}
                        className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
                      >
                        {ADMIN_ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <select
                        value={order.paymentStatus}
                        onChange={(event) => {
                          void updateOrder(order.id, { paymentStatus: event.target.value });
                        }}
                        className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
                      >
                        {ADMIN_PAYMENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px]">
                    <div className="rounded-[1.5rem] bg-[#faf8f4] p-4">
                      <p className="font-afacad text-xs uppercase tracking-[0.25em] text-black/45">
                        Items
                      </p>
                      <div className="mt-4 space-y-3">
                        {order.items.map((item, index) => (
                          <div
                            key={`${order.id}-${item.productName}-${index}`}
                            className="flex items-center justify-between gap-4 text-sm"
                          >
                            <span>{item.productName}</span>
                            <span className="text-black/55">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-black/8 p-4">
                      <p className="font-afacad text-xs uppercase tracking-[0.25em] text-black/45">
                        Summary
                      </p>
                      <p className="mt-3 font-serif text-2xl">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="mt-2 text-sm text-black/55">
                        Payment: {order.paymentMethod ?? "not set"}
                      </p>
                      <p className="mt-1 text-sm text-black/55">
                        Placed: {order.placedAt ?? "-"}
                      </p>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </AdminShell>
      )}
    </AdminGuard>
  );
}
