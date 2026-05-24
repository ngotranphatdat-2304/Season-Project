import { ProductAvailabilityEnum } from "@/lib/enums";
import { EyeglassesProduct } from "@/lib/model/eyeglasses/eyeglasses";
import type { ProductModel } from "../utils";

export type AccordionSection = "info" | "size";

export const availabilityLabels: Record<ProductAvailabilityEnum, string> = {
  [ProductAvailabilityEnum.InStock]: "In Stock",
  [ProductAvailabilityEnum.OutOfStock]: "Out of Stock",
  [ProductAvailabilityEnum.PreOrder]: "Pre Order",
};

const FALLBACK_SWATCHES = [
  "#3f2d24",
  "#151515",
  "#7f6958",
  "#b7a391",
  "#d9d4ca",
];

export function humanizeLabel(value?: string): string {
  if (value === undefined || value.trim() === "") {
    return "Default";
  }

  return value
    .split("-")
    .filter((part) => part !== "")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDisplayName(value: string): string {
  return value.replace(/\s+(SUNGLASSES|EYEGLASSES)$/i, "\n$1");
}

export function getVariantStartIndex(product: ProductModel): number {
  const defaultVariant = product.defaultVariant;

  if (defaultVariant === undefined) {
    return 0;
  }

  const index = product.variants.findIndex(
    (variant) => variant.sku === defaultVariant.sku,
  );

  return index >= 0 ? index : 0;
}

export function buildProductFacts(product: ProductModel): string[] {
  const facts = [product.brand, availabilityLabels[product.availability]];

  if (product instanceof EyeglassesProduct) {
    facts.unshift("Eyeglasses");
    facts.push(
      humanizeLabel(product.specifications.gender),
      humanizeLabel(product.frameMaterial),
      `${humanizeLabel(product.frameSize)} Frame`,
    );
  } else {
    facts.unshift("Sunglasses");
    facts.push(humanizeLabel(product.specifications.gender));
  }

  return facts;
}

export function splitDescription(description: string): string[] {
  return description
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function inferColorSwatch(color: string, index: number): string {
  const normalized = color.toLowerCase();

  if (
    normalized.includes("black") ||
    normalized.includes("onyx") ||
    normalized.includes("jet")
  ) {
    return "#171717";
  }

  if (
    normalized.includes("brown") ||
    normalized.includes("havana") ||
    normalized.includes("tortoise") ||
    normalized.includes("amber")
  ) {
    return "#4b3428";
  }

  if (
    normalized.includes("clear") ||
    normalized.includes("crystal") ||
    normalized.includes("ivory") ||
    normalized.includes("beige")
  ) {
    return "#d9d1c6";
  }

  if (normalized.includes("grey") || normalized.includes("gray")) {
    return "#707070";
  }

  if (
    normalized.includes("green") ||
    normalized.includes("olive") ||
    normalized.includes("forest")
  ) {
    return "#57634a";
  }

  if (normalized.includes("blue") || normalized.includes("navy")) {
    return "#334b67";
  }

  return FALLBACK_SWATCHES[index % FALLBACK_SWATCHES.length];
}
