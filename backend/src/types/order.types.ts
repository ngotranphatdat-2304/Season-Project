import type {
  IShippingAddress,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../models/order.model.js";

export interface CheckoutInput {
  shippingAddress: IShippingAddress;
  paymentMethod?: PaymentMethod;
}

export interface CheckoutOrderItemResponse {
  productId: string;
  productName: string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CheckoutOrderResponse {
  id: string;
  userId: string;
  items: CheckoutOrderItemResponse[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  shippingAddress: IShippingAddress;
  subtotalAmount: number;
  totalAmount: number;
  currency: string;
}

export interface OrderListQuery {
  page: number;
  limit: number;
  status?: OrderStatus;
}

export interface OrderListResponse {
  records: CheckoutOrderResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
