import type {
  IProductRating,
  IVariant,
  ProductAvailability,
  ProductGender,
  ProductType,
} from "./product.types.js";
import type { FrameMaterial, FrameSize } from "../models/product.model.js";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../models/order.model.js";
import type { IShippingAddress } from "../models/order.model.js";

export interface AdminDashboardSummary {
  totalOrders: number;
  completedOrders: number;
  activeCustomers: number;
  pendingOrders: number;
  grossRevenue: number;
  deliveredRevenue: number;
  unitsSold: number;
  lowStockProducts: number;
}

export interface AdminDashboardRevenuePoint {
  day: string;
  revenue: number;
  orders: number;
}

export interface AdminTopProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface AdminRecentOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  placedAt?: string;
}

export interface AdminDashboardResponse {
  summary: AdminDashboardSummary;
  revenueTrend: AdminDashboardRevenuePoint[];
  topProducts: AdminTopProduct[];
  recentOrders: AdminRecentOrder[];
}

export interface AdminProductsQuery {
  page: number;
  limit: number;
  q?: string;
  collectionId?: string;
  isActive?: boolean;
}

export interface AdminCollectionInput {
  name: string;
  slug: string;
}

export interface AdminCollectionResponse {
  id: string;
  name: string;
  slug: string;
  inStockCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCollectionListResponse {
  records: AdminCollectionResponse[];
  total: number;
}

export interface AdminFrameSizeInput {
  label: FrameSize;
  image: string;
}

export interface AdminProductVariantInput extends IVariant {}

export interface AdminProductInput {
  name: string;
  slug: string;
  type: ProductType;
  collectionId: string;
  brand: string;
  salePercent: number;
  availability: ProductAvailability;
  description: string;
  isActive: boolean;
  specifications: {
    gender: ProductGender;
    frameType: {
      material: FrameMaterial;
      size: AdminFrameSizeInput;
    };
  };
  variants: AdminProductVariantInput[];
}

export interface AdminProductResponse {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  collectionId: string;
  collectionName?: string;
  brand: string;
  salePercent: number;
  availability: ProductAvailability;
  description: string;
  isActive: boolean;
  specifications: {
    gender: ProductGender;
    frameType: {
      material: FrameMaterial;
      size: AdminFrameSizeInput;
    };
  };
  variants: IVariant[];
  rating: IProductRating;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductListResponse {
  records: AdminProductResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminOrdersQuery {
  page: number;
  limit: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export interface AdminOrderItemResponse {
  productId: string;
  productName: string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface AdminOrderResponse {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  items: AdminOrderItemResponse[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  shippingAddress: IShippingAddress;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  placedAt?: string;
  cancelledAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderListResponse {
  records: AdminOrderResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminOrderUpdateInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}
