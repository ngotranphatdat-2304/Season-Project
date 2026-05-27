import { api } from "@/lib/api";

export type CheckoutSessionItem = {
  productId: string;
  productName: string;
  variantSku: string;
  variantColor?: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CheckoutPaymentMethod =
  | "cash_on_delivery"
  | "bank_transfer"
  | "card"
  | "e_wallet";

export type CheckoutShippingAddressPayload = {
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  ward?: string;
  district?: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
};

export type CheckoutOrderPayload = {
  customerEmail: string;
  shippingAddress: CheckoutShippingAddressPayload;
  paymentMethod: Extract<
    CheckoutPaymentMethod,
    "cash_on_delivery" | "bank_transfer"
  >;
};

export type CheckoutInitResponse = {
  token: string;
};

export type PendingCheckoutSession = {
  status: "pending";
  token: string;
  items: CheckoutSessionItem[];
  itemCount: number;
  subtotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  expiresAt: string;
};

export type CompletedCheckoutSession = {
  status: "completed";
  redirectTo: string;
  order: {
    orderId: string;
    customerEmail: string;
    paymentMethod?: CheckoutPaymentMethod;
    shippingAddress: CheckoutShippingAddressPayload;
    items: CheckoutSessionItem[];
    subtotalAmount: number;
    shippingFee: number;
    totalAmount: number;
    currency: string;
  };
};

export type PaymentPendingCheckoutSession = {
  status: "payment_pending";
  redirectTo: string;
};

export type CheckoutSessionResponse =
  | PendingCheckoutSession
  | PaymentPendingCheckoutSession
  | CompletedCheckoutSession;

export type CheckoutPayOSInitResponse = {
  orderId: string;
  token: string;
  checkoutUrl: string;
};

export type CheckoutPaymentStatusResponse = {
  status: "paid" | "pending" | "cancelled" | "failed" | "expired";
  orderId: string;
  token: string;
  redirectTo?: string;
  message?: string;
};

export async function initCheckoutSession(): Promise<CheckoutInitResponse> {
  const response = await api.post<CheckoutInitResponse>("/checkout/init");
  return response.data;
}

export async function fetchCheckoutSession(
  token: string,
): Promise<CheckoutSessionResponse> {
  const response = await api.get<CheckoutSessionResponse>(
    `/checkout/${encodeURIComponent(token)}`,
  );
  return response.data;
}

export async function completeCheckoutSession(
  token: string,
  payload: CheckoutOrderPayload,
): Promise<{ orderId: string; token: string }> {
  const response = await api.post<{ orderId: string; token: string }>(
    `/checkout/${encodeURIComponent(token)}/complete`,
    payload,
  );
  return response.data;
}

export async function initPayOSCheckoutPayment(
  token: string,
  payload: CheckoutOrderPayload,
): Promise<CheckoutPayOSInitResponse> {
  const response = await api.post<CheckoutPayOSInitResponse>(
    `/checkout/${encodeURIComponent(token)}/payos`,
    payload,
  );
  return response.data;
}

export async function fetchCheckoutPaymentStatus(
  token: string,
  orderId: string,
): Promise<CheckoutPaymentStatusResponse> {
  const response = await api.get<CheckoutPaymentStatusResponse>(
    "/checkout/payment-status",
    {
      params: {
        token,
        orderId,
      },
    },
  );
  return response.data;
}
