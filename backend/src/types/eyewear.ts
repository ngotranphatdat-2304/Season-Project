import type { IBaseProductFields, IVariant } from "../models/sharedProduct.js";
import type {
  FrameMaterial,
  FrameSize,
  IEyeglassesSpecifications,
} from "../models/Eyeglasses.js";
import type { ISunglasses } from "../models/Sunglasses.js";
import type { Types } from "mongoose";

export interface BaseQueryParams {
  offset?: number | string;
  limit?: number | string;
}

export interface EyeglassesQueryParams extends BaseQueryParams {
  frameType?: string;
  frameSize?: string;
}

export interface SunglassesQueryParams extends BaseQueryParams {}

export interface ValidatedEyeglassesQuery {
  frameType: FrameMaterial | null;
  frameSize: FrameSize | null;
  offset: number;
  limit: number;
}

export interface ValidatedSunglassesQuery {
  offset: number;
  limit: number;
}

export interface BaseProductResponse {
  id: string;
  name: string;
  slug: string;
  type: string;
  brand: string;
  collectionId: string;
  salePercent: IBaseProductFields["salePercent"];
  availability: IBaseProductFields["availability"];
  description: string;
  variants: IVariant[];
  rating: IBaseProductFields["rating"];
  isActive: boolean;
}

export interface EyeglassesProductResponse extends BaseProductResponse {
  specifications: IEyeglassesSpecifications;
}

export interface SunglassesProductResponse extends BaseProductResponse {
  specifications: ISunglasses["specifications"];
}

export interface EyeglassesResponseData {
  records: EyeglassesProductResponse[];
  total: number;
}

export interface SunglassesResponseData {
  records: SunglassesProductResponse[];
  total: number;
}

export interface ErrorResponse {
  error?: string;
}

export interface BaseDatabaseProduct {
  _id: string;
  name: string;
  slug: string;
  type: string;
  collectionId: Types.ObjectId | string;
  brand: string;
  salePercent: IBaseProductFields["salePercent"];
  availability: IBaseProductFields["availability"];
  description: string;
  rating: IBaseProductFields["rating"];
  variants: IVariant[];
  isActive: boolean;
}

export interface DatabaseEyeglassesProduct extends BaseDatabaseProduct {
  specifications: IEyeglassesSpecifications;
}

export interface DatabaseSunglassesProduct extends BaseDatabaseProduct {
  specifications: ISunglasses["specifications"];
}
