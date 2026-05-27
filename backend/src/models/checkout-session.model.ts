import mongoose, { Document, Schema } from "mongoose";

export type CheckoutSessionStatus =
  | "pending"
  | "payment_pending"
  | "completed";

export interface ICheckoutSessionItemSnapshot {
  productId: string;
  productName: string;
  variantSku: string;
  variantColor?: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ICheckoutSession extends Document {
  token: string;
  guestId?: string;
  status: CheckoutSessionStatus;
  itemsSnapshot: ICheckoutSessionItemSnapshot[];
  subtotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  expiresAt: Date;
}

const CheckoutSessionItemSnapshotSchema =
  new Schema<ICheckoutSessionItemSnapshot>(
    {
      productId: { type: String, required: true, trim: true },
      productName: { type: String, required: true, trim: true },
      variantSku: { type: String, required: true, trim: true },
      variantColor: { type: String, trim: true },
      imageUrl: { type: String, trim: true, default: "" },
      unitPrice: { type: Number, required: true, min: 0 },
      quantity: { type: Number, required: true, min: 1 },
      lineTotal: { type: Number, required: true, min: 0 },
    },
    { _id: false },
  );

const CheckoutSessionSchema = new Schema<ICheckoutSession>(
  {
    token: { type: String, required: true, unique: true, trim: true },
    guestId: { type: String, trim: true, index: true },
    status: {
      type: String,
      enum: ["pending", "payment_pending", "completed"],
      default: "pending",
      required: true,
    },
    itemsSnapshot: {
      type: [CheckoutSessionItemSnapshotSchema],
      required: true,
      validate: {
        validator(items: ICheckoutSessionItemSnapshot[]): boolean {
          return items.length > 0;
        },
        message: "Checkout session must contain at least one item",
      },
    },
    subtotalAmount: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "VND",
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

CheckoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
CheckoutSessionSchema.index({ token: 1, status: 1 });

export const CheckoutSession = mongoose.model<ICheckoutSession>(
  "CheckoutSession",
  CheckoutSessionSchema,
);
