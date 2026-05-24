import mongoose, { Document, Schema } from "mongoose";
import {
  baseProductDefinition,
  productGenderField,
} from "./sharedProduct.js";
import type {
  IBaseProductFields,
  IBaseSpecifications,
} from "../types/eyewear.js";

export enum FrameMaterial {
  Acetate = "Acetate",
  Metal = "Metal",
}

export enum FrameSize {
  Small = "Small",
  Medium = "Medium",
  Big = "Big",
}

export interface IEyeglassesSpecifications extends IBaseSpecifications {
  frameType: {
    material: FrameMaterial;
    size: FrameSize;
  };
}

export interface IEyeglasses extends Document, IBaseProductFields {
  type: "Eyeglasses";
  specifications: IEyeglassesSpecifications;
}

const EyeglassesSchema = new Schema<IEyeglasses>(
  {
    ...baseProductDefinition,
    type: { type: String, default: "Eyeglasses" },
    specifications: {
      frameType: {
        size: {
          type: String,
          enum: Object.values(FrameSize),
          required: true,
        },
        material: {
          type: String,
          enum: Object.values(FrameMaterial),
          required: true,
        },
      },
      gender: productGenderField,
    },
  },
  { timestamps: true },
);

export const Eyeglasses = mongoose.model<IEyeglasses>(
  "Eyeglasses",
  EyeglassesSchema,
);
