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
    shippingAddress: IShippingAddress;
    items: ICheckoutSessionItemSnapshot[];
    subtotalAmount: number;
    shippingFee: number;
    totalAmount: number;
    currency: string;
  };
}

export type CheckoutSessionResponse =
  | PendingCheckoutSessionResponse
  | CompletedCheckoutSessionResponse;

export interface CheckoutCompleteInput {
  customerEmail: string;
  shippingAddress: IShippingAddress;
  paymentMethod: Extract<PaymentMethod, "cash_on_delivery">;
}

export interface CheckoutCompleteResponse {
  orderId: string;
  token: string;
}
