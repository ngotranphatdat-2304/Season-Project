import {
  type FrameMaterial,
  type FrameSize,
  type IEyeglassesSpecifications,
} from "../models/Eyeglasses.js";
import type { Types } from "mongoose";

export const PRODUCT_AVAILABILITIES = [
  "in_stock",
  "out_of_stock",
  "pre_order",
] as const;

export const PRODUCT_GENDERS = ["Male", "Female", "Unisex"] as const;

export type ProductAvailability = (typeof PRODUCT_AVAILABILITIES)[number];
export type ProductGender = (typeof PRODUCT_GENDERS)[number];

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

export interface IBaseSpecifications {
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

export interface EyeglassesQueryParams extends BaseQueryParams {
  frameType?: string;
  frameSize?: string;
  collectionSlug?: string;
  gender?: string;
  sale?: string;
  sort?: string;
}

export interface SunglassesQueryParams extends BaseQueryParams {
  collectionSlug?: string;
  gender?: string;
  sale?: string;
  sort?: string;
}

export interface SortableQuery {
  sort: ProductSort;
}

export interface ValidatedEyeglassesQuery extends SortableQuery {
  frameType: FrameMaterial | null;
  frameSize: FrameSize | null;
  collectionSlug: string | null;
  gender: ProductGender | null;
  sale: boolean;
  offset: number;
  limit: number;
}

export interface ValidatedSunglassesQuery extends SortableQuery {
  collectionSlug: string | null;
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
  sort?: string;
}

export interface BaseProductResponse {
  id: string;
  name: string;
  slug: string;
  type: string;
  brand: string;
  collectionId: string;
  salePercent: number;
  availability: ProductAvailability;
  description: string;
  variants: IVariant[];
  rating: IProductRating;
  isActive: boolean;
}

export interface EyeglassesProductResponse extends BaseProductResponse {
  specifications: IEyeglassesSpecifications;
}

export interface SunglassesProductResponse extends BaseProductResponse {
  specifications: IBaseSpecifications;
}

export interface EyeglassesResponseData {
  records: EyeglassesProductResponse[];
  total: number;
}

export interface SunglassesResponseData {
  records: SunglassesProductResponse[];
  total: number;
}

export type CollectionProductResponse =
  | EyeglassesProductResponse
  | SunglassesProductResponse;

export interface CollectionProductsResponseData {
  records: CollectionProductResponse[];
  total: number;
}

export interface ErrorResponse {
  error?: string;
}

export interface ValidatedCollectionProductsQuery extends SortableQuery {
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

export interface DatabaseEyeglassesProduct extends BaseDatabaseProduct {
  specifications: IEyeglassesSpecifications;
}

export interface DatabaseSunglassesProduct extends BaseDatabaseProduct {
  specifications: IBaseSpecifications;
}
