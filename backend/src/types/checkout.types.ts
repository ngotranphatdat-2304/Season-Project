import type { ICheckoutSessionItemSnapshot } from "../models/checkout-session.model.js";
import type {
  IShippingAddress,
  PaymentMethod,
} from "../models/order.model.js";

export interface CheckoutInitResponse {
  token: string;
}

export interface PendingCheckoutSessionResponse {
  status: "pending";
  token: string;
  items: ICheckoutSessionItemSnapshot[];
  itemCount: number;
  subtotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  expiresAt: string;
}

export interface CompletedCheckoutSessionResponse {
  status: "completed";
  redirectTo: string;
  order: {
    orderId: string;
    customerEmail: string;
    paymentMethod?: PaymentMethod;
    shippingAddress: IShippingAddress;
    items: ICheckoutSessionItemSnapshot[];
    subtotalAmount: number;
    shippingFee: number;
    totalAmount: number;
    currency: string;
  };
}

export interface PaymentPendingCheckoutSessionResponse {
  status: "payment_pending";
  redirectTo: string;
}

export type CheckoutSessionResponse =
  | PendingCheckoutSessionResponse
  | PaymentPendingCheckoutSessionResponse
  | CompletedCheckoutSessionResponse;

export interface CheckoutCompleteInput {
  customerEmail: string;
  shippingAddress: IShippingAddress;
  paymentMethod: Extract<PaymentMethod, "cash_on_delivery" | "bank_transfer">;
}

export interface CheckoutCompleteResponse {
  orderId: string;
  token: string;
}

export interface CheckoutPayOSInitResponse {
  orderId: string;
  token: string;
  checkoutUrl: string;
}

export interface CheckoutPaymentStatusResponse {
  status: "paid" | "pending" | "cancelled" | "failed" | "expired";
  orderId: string;
  token: string;
  redirectTo?: string;
  message?: string;
}
