import { ProductTypeEnum } from "@/lib/enums";
import { ProductCard } from "@/lib/model/misc";
import {
  EyeglassesProduct,
  type EyeglassesProductArgs,
} from "@/lib/model/eyeglasses/eyeglasses";
import {
  SunglassesProduct,
  type SunglassesProductArgs,
} from "@/lib/model/sunglasses/sunglasses";

export function toEyeglassesCard(product: EyeglassesProduct): ProductCard {
  return {
    id: product.id,
    type: ProductTypeEnum.eyeglasses,
    title: product.name,
    slug: product.slug,
    images: product.variants
      .map((variant) => variant.images[0] ?? "")
      .filter((image) => image !== ""),
    colorCount: product.variantCountLabel,
    price: product.price,
    originalPrice: product.originalPrice,
    isOnSale: product.isOnSale,
    meta: `${product.frameSize} / ${product.frameMaterial}`,
  };
}
export function toSunglassesCard(product: SunglassesProduct): ProductCard {
  return {
    id: product.id,
    type: ProductTypeEnum.sunglasses,
    title: product.name,
    slug: product.slug,
    images: product.variants
      .map((variant) => variant.images[0] ?? "")
      .filter((image) => image !== ""),
    colorCount: product.variantCountLabel,
    price: product.price,
    originalPrice: product.originalPrice,
    isOnSale: product.isOnSale,
    meta: product.brand,
  };
}
export type ProductModel = EyeglassesProduct | SunglassesProduct;

export function toProductCards(products: ProductModel[]): ProductCard[] {
  return products.map((product) =>
    product instanceof EyeglassesProduct
      ? toEyeglassesCard(product)
      : toSunglassesCard(product),
  );
}

export type SerializedProductRecord =
  | EyeglassesProductArgs
  | SunglassesProductArgs;

export function deserializeProductRecord(
  record: SerializedProductRecord,
): ProductModel {
  const normalizedType = String(record.type ?? "")
    .trim()
    .toLowerCase();

  if (
    normalizedType === "sunglasses" ||
    normalizedType === ProductTypeEnum.sunglasses
  ) {
    return SunglassesProduct.deser({
      ...record,
      type: ProductTypeEnum.sunglasses,
    } as SunglassesProductArgs);
  }

  return EyeglassesProduct.deser({
    ...record,
    type: ProductTypeEnum.eyeglasses,
  } as EyeglassesProductArgs);
}

// General hydration function that can handle both product types based on the type field in the serialized record. This is useful for scenarios where we have a mixed list of products and need to hydrate them without knowing the category upfront.
export function hydrateProducts(
  records: SerializedProductRecord[],
  category?: ProductTypeEnum,
): ProductModel[] {
  return records.map((record) => {
    const normalizedType =
      category ??
      String(record.type ?? "")
        .trim()
        .toLowerCase();

    if (
      normalizedType === "sunglasses" ||
      normalizedType === ProductTypeEnum.sunglasses
    ) {
      return deserializeProductRecord({
        ...record,
        type: ProductTypeEnum.sunglasses,
      } as SunglassesProductArgs);
    }

    return deserializeProductRecord({
      ...record,
      type: ProductTypeEnum.eyeglasses,
    } as EyeglassesProductArgs);
  });
}
