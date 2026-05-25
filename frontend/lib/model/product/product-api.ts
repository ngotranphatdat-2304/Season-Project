import { fetchList, fetchOne, type ListResponse } from "@/lib/fetcher";
import { ProductGenderEnum, ProductTypeEnum } from "@/lib/enums";
import { serializePaginationQuery } from "@/lib/serialize";
import {
  DEFAULT_PRODUCT_SORT,
  PAGE_SIZE,
  type ProductsQueryState,
} from "../misc";
import type { ProductRouteView } from "../type";
import { Product } from "./product";
import { serializeProductQuery, type ProductQuery } from "./product-query";

function getProductQueryByView(
  category: ProductTypeEnum,
  view: ProductRouteView,
  queryState: ProductsQueryState,
): ProductQuery {
  const baseQuery: ProductQuery = {
    type: category,
    frameType: queryState.frameType ?? undefined,
    frameSize: queryState.frameSize ?? undefined,
  };

  if (view === "men") {
    return {
      ...baseQuery,
      gender: ProductGenderEnum.Male,
    };
  }

  if (view === "women") {
    return {
      ...baseQuery,
      gender: ProductGenderEnum.Female,
    };
  }

  if (view === "sale") {
    return {
      ...baseQuery,
      sale: true,
    };
  }

  return baseQuery;
}

async function fetchProductsPage(
  query: ProductQuery,
  sort: ProductsQueryState["sort"],
  offset: number,
  limit: number,
): Promise<ListResponse<Product>> {
  return fetchList("/products", Product, {
    ...serializeProductQuery(query),
    sort,
    ...serializePaginationQuery({ offset, limit }),
  });
}

export async function fetchProductsBatchByCategory(
  category: ProductTypeEnum,
  view: ProductRouteView,
  offset: number,
  limit: number = PAGE_SIZE,
  queryState: ProductsQueryState = {
    sort: DEFAULT_PRODUCT_SORT,
    frameType: null,
    frameSize: null,
  },
): Promise<ListResponse<Product>> {
  return fetchProductsPage(
    getProductQueryByView(category, view, queryState),
    queryState.sort,
    offset,
    limit,
  );
}


export async function fetchProductById(id: string): Promise<Product> {
  return fetchOne(`/products/${id}`, Product);
}

export async function searchProducts(
  q: string,
  offset: number = 0,
  limit: number = PAGE_SIZE,
): Promise<ListResponse<Product>> {
  return fetchList("/products/search", Product, {
    q,
    ...serializePaginationQuery({ offset, limit }),
  });
}
