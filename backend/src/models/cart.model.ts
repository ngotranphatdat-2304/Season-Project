import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  variantSku: string;
  quantity: number;
}

export interface ICart extends Document {
  userId?: Types.ObjectId;
  guestId?: string;
  items: ICartItem[];
  expiresAt?: Date;
}

function hasUniqueItems(items: ICartItem[]): boolean {
  const itemKeys = new Set<string>();

  for (const item of items) {
    const itemKey = `${item.productId.toString()}:${item.variantSku}`;

    if (itemKeys.has(itemKey) === true) {
      return false;
    }

    itemKeys.add(itemKey);
  }

  return true;
}

export const CartItemSchema = new Schema<ICartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
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
      default: 1,
    },
  },
  { _id: false },
);

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    guestId: {
      type: String,
      trim: true,
    },
    items: {
      type: [CartItemSchema],
      default: (): ICartItem[] => [],
      validate: {
        validator: hasUniqueItems,
        message: "Cart cannot contain duplicate product variants",
      },
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true, optimisticConcurrency: true },
);

CartSchema.index({ "items.productId": 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
CartSchema.index({ userId: 1 }, { unique: true, sparse: true });
CartSchema.index({ guestId: 1 }, { unique: true, sparse: true });

export const Cart = mongoose.model<ICart>("Cart", CartSchema);
