import type { ProductSort } from "../types/eyewear.js";

export function buildSort(sort: ProductSort): Record<string, 1 | -1> {
  if (sort === "title-desc") {
    return { name: -1, slug: 1 };
  }

  if (sort === "price-desc") {
    return { sortPrice: -1, slug: 1 };
  }

  if (sort === "price-asc") {
    return { sortPrice: 1, slug: 1 };
  }

  return { name: 1, slug: 1 };
}