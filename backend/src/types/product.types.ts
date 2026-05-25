import {
  type FrameMaterial,
  type FrameSize,
} from "../models/product.model.js";
import type { Types } from "mongoose";

export const PRODUCT_AVAILABILITIES = [
  "in_stock",
  "out_of_stock",
  "pre_order",
] as const;

export const PRODUCT_GENDERS = ["Male", "Female", "Unisex"] as const;

export type ProductAvailability = (typeof PRODUCT_AVAILABILITIES)[number];
export type ProductGender = (typeof PRODUCT_GENDERS)[number];
export type ProductType = "Eyeglasses" | "Sunglasses";

export type ProductSort =
  | "title-asc"
  | "title-desc"
  | "price-desc"
  | "price-asc";

export const PRODUCT_SORTS = [
  "title-asc",
  "title-desc",
  "price-desc",
  "price-asc",
] as const satisfies readonly ProductSort[];

export const DEFAULT_PRODUCT_SORT: ProductSort = "title-asc";

export interface IVariant {
  sku: string;
  color?: string;
  price: number;
  images: string[];
  isDefault: boolean;
  stock: number;
}

export interface IProductRating {
  avg: number;
  count: number;
}

export interface IFrameSize {
  label: FrameSize;
  image: string;
}

export interface IFrameType {
  frameType: {
    material: FrameMaterial;
    size: IFrameSize;
  };
}

export interface IBaseSpecifications extends IFrameType {
  gender: ProductGender;
}

export interface IBaseProductFields {
  name: string;
  slug: string;
  collectionId: Types.ObjectId;
  brand: string;
  salePercent: number;
  availability: ProductAvailability;
  description: string;
  variants: IVariant[];
  rating: IProductRating;
  isActive: boolean;
}

export interface BaseQueryParams {
  offset?: number | string;
  limit?: number | string;
}

export interface ProductQueryParams extends BaseQueryParams {
  type?: string;
  frameType?: string;
  frameSize?: string;
  collectionSlug?: string;
  gender?: string;
  sale?: string;
  sort?: string;
}

export interface ProductSearchQueryParams extends BaseQueryParams {
  q?: string;
  type?: string;
  gender?: string;
  sale?: string;
}

export interface SortableQuery {
  sort: ProductSort;
}

export interface ValidatedProductQuery extends SortableQuery {
  type: ProductType | null;
  frameType: FrameMaterial | null;
  frameSize: FrameSize | null;
  collectionSlug: string | null;
  gender: ProductGender | null;
  sale: boolean;
  offset: number;
  limit: number;
}

export interface ValidatedProductSearchQuery {
  q: string;
  type: ProductType | null;
  gender: ProductGender | null;
  sale: boolean;
  offset: number;
  limit: number;
}

export interface CollectionFilterResponse {
  id: string;
  name: string;
  slug: string;
  inStockCount: number;
}

export interface CollectionFiltersResponseData {
  records: CollectionFilterResponse[];
}

export interface CollectionProductsQueryParams extends BaseQueryParams {
  frameType?: string;
  frameSize?: string;
  sort?: string;
}

export interface BaseProductResponse {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  brand: string;
  collectionId: string;
  salePercent: number;
  availability: ProductAvailability;
  description: string;
  variants: IVariant[];
  rating: IProductRating;
  isActive: boolean;
}

export interface ProductResponse extends BaseProductResponse {
  specifications: IBaseSpecifications;
}

export interface SearchProductResponse extends ProductResponse {
  score: number;
}

export interface ProductsResponseData {
  records: ProductResponse[];
  total: number;
}

export interface ProductSearchResponseData {
  records: SearchProductResponse[];
  total: number;
}
export interface ErrorResponse {
  success: false;
  error: {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ValidatedCollectionProductsQuery extends SortableQuery {
  frameType: FrameMaterial | null;
  frameSize: FrameSize | null;
  offset: number;
  limit: number;
}

export interface BaseDatabaseProduct {
  _id: string;
  name: string;
  slug: string;
  type: string;
  collectionId: Types.ObjectId | string;
  brand: string;
  salePercent: number;
  availability: ProductAvailability;
  description: string;
  rating: IProductRating;
  variants: IVariant[];
  isActive: boolean;
}

export interface DatabaseProduct extends BaseDatabaseProduct {
  type: ProductType;
  specifications: IBaseSpecifications;
}
