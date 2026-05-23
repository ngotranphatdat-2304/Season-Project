import { ProductRouteView } from "./type";
import { FrameMaterialEnum, FrameSizeEnum, ProductTypeEnum } from "../enums";

export type ProductCard = {
  title: string;
  slug: string;
  images: string[];
  colorCount: string;
  price: number;
  originalPrice: number;
  isOnSale: boolean;
  meta?: string;
};

export type ProductsPageData = {
  initialProducts: ProductCard[];
  totalItems: number;
};

export type ProductSortValue =
  | "title-asc"
  | "title-desc"
  | "price-desc"
  | "price-asc";

export type ProductsQueryState = {
  sort: ProductSortValue;
  frameType: FrameMaterialEnum | null;
  frameSize: FrameSizeEnum | null;
};

export type FilterConfigKey = ProductTypeEnum | "collections";

export const DEFAULT_PRODUCT_SORT: ProductSortValue = "title-asc";

export const PAGE_SIZE = 12;

export function normalizeProductSort(
  value: string | undefined,
): ProductSortValue {
  if (
    value === "title-asc" ||
    value === "title-desc" ||
    value === "price-desc" ||
    value === "price-asc"
  ) {
    return value;
  }

  return DEFAULT_PRODUCT_SORT;
}

export function normalizeFrameType(
  value: string | undefined,
): FrameMaterialEnum | null {
  if (
    value === FrameMaterialEnum.Acetate ||
    value === FrameMaterialEnum.Metal
  ) {
    return value;
  }

  return null;
}

export function normalizeFrameSize(
  value: string | undefined,
): FrameSizeEnum | null {
  if (
    value === FrameSizeEnum.Small ||
    value === FrameSizeEnum.Medium ||
    value === FrameSizeEnum.Big
  ) {
    return value;
  }

  return null;
}

export function parseProductsQueryState(params: {
  sort?: string;
  frameType?: string;
  frameSize?: string;
}): ProductsQueryState {
  return {
    sort: normalizeProductSort(params.sort),
    frameType: normalizeFrameType(params.frameType),
    frameSize: normalizeFrameSize(params.frameSize),
  };
}

export function toPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isEyeglassesSlug(value: string): value is ProductRouteView {
  return (
    value === "view-all" ||
    value === "men" ||
    value === "women" ||
    value === "sale"
  );
}

export function isSunglassesSlug(value: string): value is ProductRouteView {
  return isEyeglassesSlug(value);
}
