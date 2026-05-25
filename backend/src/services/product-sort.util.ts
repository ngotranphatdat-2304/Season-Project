import type { ProductSort } from "../types/product.types.js";

export function buildProductSort(sort: ProductSort): Record<string, 1 | -1> {
  if (sort === "title-desc") {
    return { name: -1, slug: 1 };
  }

  if (sort === "price-desc") {
    return { "variants.0.price": -1, slug: 1 };
  }

  if (sort === "price-asc") {
    return { "variants.0.price": 1, slug: 1 };
  }

  return { name: 1, slug: 1 };
}
