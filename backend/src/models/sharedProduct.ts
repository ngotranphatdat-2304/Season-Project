import { Schema, Types } from "mongoose";
import { PRODUCT_AVAILABILITIES, PRODUCT_GENDERS, type IProductRating, type IVariant, type ProductAvailability, type ProductGender } from "../types/eyewear.js";


export const ratingSchema = new Schema<IProductRating>(
  {
    avg: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  { _id: false },
);

export const variantSchema = new Schema<IVariant>(
  {
    sku: { type: String, required: true },
    color: String,
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    isDefault: { type: Boolean, default: false },
    stock: { type: Number, required: true, min: 1, max: 10 },
  },
  { _id: false },
);

export const baseProductDefinition = {
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  collectionId: {
    type: Schema.Types.ObjectId,
    ref: "Collection",
    required: true,
  },
  brand: { type: String, required: true },
  salePercent: { type: Number, min: 0, max: 30, default: 0 },
  availability: {
    type: String,
    enum: PRODUCT_AVAILABILITIES,
    default: "in_stock" as ProductAvailability,
  },
  description: { type: String, required: true },
  variants: { type: [variantSchema], default: (): IVariant[] => [] },
  rating: { type: ratingSchema, default: () => ({ avg: 0, count: 0 }) },
  isActive: { type: Boolean, default: true },
};

export const productGenderField = {
  type: String,
  enum: PRODUCT_GENDERS,
  default: "Unisex" as ProductGender,
};
