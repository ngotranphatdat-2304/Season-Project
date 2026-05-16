import type { IBaseProductFields, IVariant } from "../models/sharedProduct.js";
import type { IFrameType } from "../models/Eyeglasses.js";

export interface BaseQueryParams {
  offset?: number | string;
  limit?: number | string;
}

export interface EyeglassesQueryParams extends BaseQueryParams {
  frameType?: string;
}

export interface SunglassesQueryParams extends BaseQueryParams {}

export interface ValidatedEyeglassesQuery {
  frameType: IFrameType["material"] | null;
  offset: number;
  limit: number;
}

export interface ValidatedSunglassesQuery {
  offset: number;
  limit: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  type: string;
  brand: string;
  price: number;
  originalPrice: number;
  images: string[];
  availability: IBaseProductFields["availability"];
  rating: IBaseProductFields["rating"];
}

export interface PaginationData {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface EyewearResponseData {
  products: ProductResponse[];
  pagination: PaginationData;
}

export interface ErrorResponse {
  error?: string;
}

export interface DatabaseProduct {
  _id: string;
  name: string;
  slug: string;
  type: string;
  brand: string;
  availability: IBaseProductFields["availability"];
  rating: IBaseProductFields["rating"];
  variants: IVariant[];
}
