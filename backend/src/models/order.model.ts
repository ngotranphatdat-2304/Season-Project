import mongoose, { Document, Schema, Types } from "mongoose";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";
export type PaymentMethod =
  | "cash_on_delivery"
  | "bank_transfer"
  | "card"
  | "e_wallet";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];
const PAYMENT_STATUSES: PaymentStatus[] = [
  "unpaid",
  "paid",
  "failed",
  "refunded",
];
export const PAYMENT_METHODS: PaymentMethod[] = [
  "cash_on_delivery",
  "bank_transfer",
  "card",
  "e_wallet",
];

export interface IShippingAddress {
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
}

export interface IOrderItem {
  productId: Types.ObjectId;
  productName: string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IOrder extends Document {
  userId?: Types.ObjectId;
  guestId?: string;
  customerEmail?: string;
  checkoutToken?: string;
  items: IOrderItem[];
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
  placedAt?: Date;
  cancelledAt?: Date;
  deliveredAt?: Date;
}

export const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    variantSku: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    ward: { type: String, trim: true },
    district: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    province: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: {
      type: String,
      required: true,
      trim: true,
      default: "Vietnam",
    },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    guestId: { type: String, trim: true, index: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    checkoutToken: { type: String, trim: true, unique: true, sparse: true },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator(items: IOrderItem[]): boolean {
          return items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "unpaid",
    },
    paymentMethod: { type: String, enum: PAYMENT_METHODS },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    subtotalAmount: { type: Number, required: true, min: 0, default: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "VND",
    },
    placedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true, optimisticConcurrency: true },
);

OrderSchema.pre("validate", function validateOrderOwner() {
  const hasUserId = this.userId !== undefined;
  const hasGuestId = this.guestId !== undefined && this.guestId.trim() !== "";

  if (hasUserId === hasGuestId) {
    throw new Error("Order must belong to exactly one user or guest");
  }
});

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ guestId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ "items.productId": 1, "items.variantSku": 1 });

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
