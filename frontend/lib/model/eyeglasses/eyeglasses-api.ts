import { fetchList, fetchOne, type ListResponse } from "@/lib/fetcher";
import { ProductGenderEnum } from "@/lib/enums";
import {
  EyeglassesProduct,
  serializeEyeglassesQuery,
  EyeglassesQuery,
} from "@/lib/model";
import { serializePaginationQuery } from "@/lib/serialize";
import {
  DEFAULT_PRODUCT_SORT,
  ProductsQueryState,
  PAGE_SIZE,
} from "../misc";
import { ProductRouteView } from "../type";

function getEyeglassesQueryByView(
  view: ProductRouteView,
  queryState: ProductsQueryState,
): EyeglassesQuery {
  const filters: EyeglassesQuery = {
    frameType: queryState.frameType ?? undefined,
    frameSize: queryState.frameSize ?? undefined,
  };

  if (view === "men") {
    return {
      ...filters,
      gender: ProductGenderEnum.Male,
    };
  }

  if (view === "women") {
    return {
      ...filters,
      gender: ProductGenderEnum.Female,
    };
  }

  if (view === "sale") {
    return {
      ...filters,
      sale: true,
    };
  }

  return filters;
}

async function fetchEyeglassesPage(
  query: EyeglassesQuery,
  sort: ProductsQueryState["sort"],
  offset: number,
  limit: number,
): Promise<ListResponse<EyeglassesProduct>> {
  return fetchList("/eyeglasses", EyeglassesProduct, {
    ...serializeEyeglassesQuery(query),
    sort,
    ...serializePaginationQuery({ offset, limit }),
  });
}

export async function fetchEyeglassesBatch(
  view: ProductRouteView,
  offset: number,
  limit: number = PAGE_SIZE,
  queryState: ProductsQueryState = {
    sort: DEFAULT_PRODUCT_SORT,
    frameType: null,
    frameSize: null,
  },
): Promise<ListResponse<EyeglassesProduct>> {
  return fetchEyeglassesPage(
    getEyeglassesQueryByView(view, queryState),
    queryState.sort,
    offset,
    limit,
  );
}

export async function getEyeglassesPageData(
  view: ProductRouteView,
  queryState: ProductsQueryState = {
    sort: DEFAULT_PRODUCT_SORT,
    frameType: null,
    frameSize: null,
  },
): Promise<ListResponse<EyeglassesProduct>> {
  return fetchEyeglassesBatch(view, 0, PAGE_SIZE, queryState);
}

export async function fetchEyeglassesCollectionBatch(
  collectionSlug: string,
  offset: number,
  limit: number = PAGE_SIZE,
  sort: ProductsQueryState["sort"] = DEFAULT_PRODUCT_SORT,
): Promise<ListResponse<EyeglassesProduct>> {
  return fetchEyeglassesPage(
    { collectionSlug },
    sort,
    offset,
    limit,
  );
}

export async function fetchEyeglassesById(
  id: string,
): Promise<EyeglassesProduct> {
  return fetchOne(`/eyeglasses/${id}`, EyeglassesProduct);
}
