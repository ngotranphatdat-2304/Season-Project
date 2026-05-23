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
      return SunglassesProduct.deser(record as SunglassesProductArgs);
    }

    return EyeglassesProduct.deser(record as EyeglassesProductArgs);
  });
}
