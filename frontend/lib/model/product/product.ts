import { FrameMaterialEnum, FrameSizeEnum, ProductTypeEnum } from "../../enums";
import type {
  FrameMaterial,
  FrameSize,
  ProductAvailability,
  ProductGender,
} from "../type";
import {
  getAvailabilityOrDefault,
  getGenderOrDefault,
  ProductVariant,
  Rating,
} from "../shared";

export interface FrameSizeDetailsArgs {
  label: FrameSize;
  image: string;
}

export class FrameSizeDetails {
  label: FrameSize;
  image: string;

  constructor(args: FrameSizeDetailsArgs) {
    this.label = args.label;
    this.image = args.image;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static deser(data: any): FrameSizeDetails {
    return new FrameSizeDetails({
      label:
        data?.label === FrameSizeEnum.Small ||
        data?.label === FrameSizeEnum.Medium ||
        data?.label === FrameSizeEnum.Big
          ? data.label
          : FrameSizeEnum.Medium,
      image: data?.image ?? "",
    });
  }
}

export interface FrameTypeArgs {
  material: FrameMaterial;
  size: FrameSizeDetails;
}

export class FrameType {
  material: FrameMaterial;
  size: FrameSizeDetails;

  constructor(args: FrameTypeArgs) {
    this.material = args.material;
    this.size = args.size;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static deser(data: any): FrameType {
    return new FrameType({
      material:
        data?.material === FrameMaterialEnum.Metal
          ? FrameMaterialEnum.Metal
          : FrameMaterialEnum.Acetate,
      size: FrameSizeDetails.deser(data?.size),
    });
  }
}

export interface ProductSpecificationsArgs {
  gender: ProductGender;
  frameType: FrameType;
}

export class ProductSpecifications {
  gender: ProductGender;
  frameType: FrameType;

  constructor(args: ProductSpecificationsArgs) {
    this.gender = args.gender;
    this.frameType = args.frameType;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static deser(data: any): ProductSpecifications {
    return new ProductSpecifications({
      gender: getGenderOrDefault(data?.gender),
      frameType: FrameType.deser(data?.frameType),
    });
  }
}

export interface ProductArgs {
  type: ProductTypeEnum;
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
  specifications: ProductSpecifications;
}

export class Product {
  id: string;
  name: string;
  slug: string;
  type: ProductTypeEnum;
  collectionId: string;
  brand: string;
  salePercent: number;
  availability: ProductAvailability;
  description: string;
  variants: ProductVariant[];
  rating: Rating;
  isActive: boolean;
  specifications: ProductSpecifications;

  constructor(args: ProductArgs) {
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

  static normalizeType(value: unknown): ProductTypeEnum {
    const normalized = String(value ?? "")
      .trim()
      .toLowerCase();

    return normalized === ProductTypeEnum.sunglasses
      ? ProductTypeEnum.sunglasses
      : ProductTypeEnum.eyeglasses;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static deser(data: any): Product {
    return new Product({
      id: data.id,
      name: data.name,
      slug: data.slug,
      type: Product.normalizeType(data.type),
      collectionId: data.collectionId,
      brand: data.brand,
      salePercent: data.salePercent ?? 0,
      availability: getAvailabilityOrDefault(data.availability),
      description: data.description,
      specifications: ProductSpecifications.deser(data.specifications),
      variants: (data.variants ?? []).map((variant: unknown) =>
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

    return Math.round(this.price / (1 - this.salePercent / 100));
  }

  get variantCountLabel(): string {
    const count = this.variants.length;
    if (count === 1) {
      return "1 Color";
    }

    return `${count} Colors`;
  }

  get isOnSale(): boolean {
    return this.salePercent > 0;
  }

  get frameMaterial(): FrameMaterial {
    return this.specifications.frameType.material;
  }

  get frameSize(): FrameSize {
    return this.specifications.frameType.size.label;
  }

  get sizeGuideImage(): string {
    return this.specifications.frameType.size.image;
  }
}
