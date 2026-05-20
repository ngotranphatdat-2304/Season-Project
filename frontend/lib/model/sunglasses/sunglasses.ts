import { ProductTypeEnum } from "../../enums";
import type { ProductAvailability, ProductGender } from "../type";
import { getAvailabilityOrDefault, ProductVariant, Rating } from "../shared";

export interface SunglassesSpecificationsArgs {
  gender: ProductGender;
}

export class SunglassesSpecifications {
  gender: ProductGender;

  constructor(args: SunglassesSpecificationsArgs) {
    this.gender = args.gender;
  }

  static deser(data: any): SunglassesSpecifications {
    return new SunglassesSpecifications({
      gender: data?.gender,
    });
  }
}

export interface SunglassesProductArgs {
  type: ProductTypeEnum.sunglasses;
  id: string;
  name: string;
  slug: string;
  collectionId: string;
  brand: string;
  salePercent: number;
  availability: ProductAvailability;
  description: string;
  variants: ProductVariant[];
  rating: Rating;
  isActive: boolean;
  specifications: SunglassesSpecifications;
}

export class SunglassesProduct {
  id: string;
  name: string;
  slug: string;
  type: ProductTypeEnum.sunglasses;
  collectionId: string;
  brand: string;
  salePercent: number;
  availability: ProductAvailability;
  description: string;
  variants: ProductVariant[];
  rating: Rating;
  isActive: boolean;
  specifications: SunglassesSpecifications;

  constructor(args: SunglassesProductArgs) {
    this.id = args.id;
    this.name = args.name;
    this.slug = args.slug;
    this.type = args.type;
    this.collectionId = args.collectionId;
    this.brand = args.brand;
    this.salePercent = args.salePercent;
    this.availability = args.availability;
    this.description = args.description;
    this.variants = args.variants;
    this.rating = args.rating;
    this.isActive = args.isActive;
    this.specifications = args.specifications;
  }

  static deser(data: any): SunglassesProduct {
    return new SunglassesProduct({
      id: data.id,
      name: data.name,
      slug: data.slug,
      type: data.type ?? ProductTypeEnum.sunglasses,
      collectionId: data.collectionId,
      brand: data.brand,
      salePercent: data.salePercent ?? 0,
      availability: getAvailabilityOrDefault(data.availability),
      description: data.description,
      specifications: SunglassesSpecifications.deser(data.specifications),
      variants: (data.variants ?? []).map((variant: any) =>
        ProductVariant.deser(variant),
      ),
      rating: Rating.deser(data.rating),
      isActive: data.isActive,
    });
  }

  get defaultVariant(): ProductVariant | undefined {
    return (
      this.variants.find((variant) => variant.isDefault) ?? this.variants[0]
    );
  }

  get primaryImage(): string {
    return this.defaultVariant?.images[0] ?? "";
  }

  get price(): number {
    return this.defaultVariant?.price ?? 0;
  }

  get originalPrice(): number {
    if (this.salePercent <= 0) {
      return this.price;
    }

    return Math.ceil(this.price / (1 - this.salePercent / 100));
  }

  get isOnSale(): boolean {
    return this.salePercent > 0;
  }
}
