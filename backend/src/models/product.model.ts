import mongoose, { Document, Schema } from "mongoose";
import type {
  IBaseProductFields,
  IBaseSpecifications,
  IProductRating,
  IVariant,
  ProductAvailability,
  ProductGender,
  ProductType,
} from "../types/product.types.js";
import {
  PRODUCT_AVAILABILITIES,
  PRODUCT_GENDERS,
} from "../types/product.types.js";

export enum FrameMaterial {
  Acetate = "Acetate",
  Metal = "Metal",
}

export enum FrameSize {
  Small = "Small",
  Medium = "Medium",
  Big = "Big",
}

export interface IProduct extends Document, IBaseProductFields {
  type: ProductType;
  specifications: IBaseSpecifications;
}

const ratingSchema = new Schema<IProductRating>(
  {
    avg: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  { _id: false },
);

const variantSchema = new Schema<IVariant>(
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

const ProductSchema = new Schema<IProduct>(
  {
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
    type: {
      type: String,
      enum: ["Eyeglasses", "Sunglasses"],
      required: true,
    },
    specifications: {
      frameType: {
        material: {
          type: String,
          enum: Object.values(FrameMaterial),
          required: true,
        },
        size: {
          label: {
            type: String,
            enum: Object.values(FrameSize),
            required: true,
          },
          image: {
            type: String,
            required: true,
          },
        },
      },
      gender: {
        type: String,
        enum: PRODUCT_GENDERS,
        default: "Unisex" as ProductGender,
      },
    },
  },
  { timestamps: true },
);

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
