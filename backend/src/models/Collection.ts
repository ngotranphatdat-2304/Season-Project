import mongoose, { Schema, Document } from "mongoose";

export interface ICollection extends Document {
  name: string;
  slug: string;
  eyeglassesInStockCount: number;
  sunglassesInStockCount: number;
}

const CollectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    eyeglassesInStockCount: { type: Number, required: true, min: 0, default: 0 },
    sunglassesInStockCount: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

export const Collection = mongoose.model<ICollection>(
  "Collection",
  CollectionSchema,
);
