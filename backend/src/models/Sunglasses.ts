import mongoose, { Document, Schema } from "mongoose";
import {
  baseProductDefinition,
  productGenderField,
} from "./sharedProduct.js";
import type {
  IBaseProductFields,
  IBaseSpecifications,
} from "../types/eyewear.js";

export interface ISunglasses extends Document, IBaseProductFields {
  type: "Sunglasses";
  specifications: IBaseSpecifications;
}

const SunglassesSchema = new Schema<ISunglasses>(
  {
    ...baseProductDefinition,
    type: { type: String, default: "Sunglasses" },
    specifications: {
      gender: productGenderField,
    },
  },
  { timestamps: true },
);

export const Sunglasses = mongoose.model<ISunglasses>(
  "Sunglasses",
  SunglassesSchema,
);
