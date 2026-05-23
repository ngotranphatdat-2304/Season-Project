import { ProductAvailabilityEnum, ProductGenderEnum } from "../enums";
import type { ProductAvailability, ProductGender } from "./type";

export interface RatingArgs {
  avg: number;
  count: number;
}

export class Rating {
  avg: number;
  count: number;

  constructor(args: RatingArgs) {
    this.avg = args.avg;
    this.count = args.count;
  }

  static deser(data: any): Rating {
    return new Rating({
      avg: data?.avg ?? 0,
      count: data?.count ?? 0,
    });
  }
}

export interface ProductVariantArgs {
  sku: string;
  color?: string;
  price: number;
  images: string[];
  isDefault: boolean;
  stock: number;
}

export class ProductVariant {
  sku: string;
  color?: string;
  price: number;
  images: string[];
  isDefault: boolean;
  stock: number;

  constructor(args: ProductVariantArgs) {
    this.sku = args.sku;
    this.color = args.color;
    this.price = args.price;
    this.images = args.images;
    this.isDefault = args.isDefault;
    this.stock = args.stock;
  }

  static deser(data: any): ProductVariant {
    return new ProductVariant({
      sku: data.sku,
      color: data.color ?? undefined,
      price: data.price,
      images: data.images ?? [],
      isDefault: data.isDefault,
      stock: data.stock,
    });
  }
}

export interface BaseSpecificationsArgs {
  gender: ProductGender;
}

export class BaseSpecifications {
  gender: ProductGender;

  constructor(args: BaseSpecificationsArgs) {
    this.gender = args.gender;
  }

  static deser(data: any): BaseSpecifications {
    return new BaseSpecifications({
      gender: data?.gender ?? ProductGenderEnum.Unisex,
    });
  }
}

export const getAvailabilityOrDefault = (value: any): ProductAvailability =>
  value ?? ProductAvailabilityEnum.InStock;
