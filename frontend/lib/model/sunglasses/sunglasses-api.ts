import { fetchList, fetchOne, ListResponse } from "@/lib/fetcher";
import { ProductGenderEnum } from "@/lib/enums";
import {
  SunglassesProduct,
  type SunglassesQuery,
  serializeSunglassesQuery,
} from "@/lib/model";
import { serializePaginationQuery } from "@/lib/serialize";
import {
  DEFAULT_PRODUCT_SORT,
  ProductsQueryState,
  PAGE_SIZE,
} from "../misc";
import { ProductRouteView } from "../type";

function getSunglassesQueryByView(view: ProductRouteView): SunglassesQuery {
  if (view === "men") {
    return { gender: ProductGenderEnum.Male };
  }

  if (view === "women") {
    return { gender: ProductGenderEnum.Female };
  }

  if (view === "sale") {
    return { sale: true };
  }

  return {};
}

async function fetchSunglassesPage(
  query: SunglassesQuery,
  sort: ProductsQueryState["sort"],
  offset: number,
  limit: number,
): Promise<ListResponse<SunglassesProduct>> {
  return fetchList("/sunglasses", SunglassesProduct, {
    ...serializeSunglassesQuery(query),
    sort,
    ...serializePaginationQuery({ offset, limit }),
  });
}

export async function fetchSunglassesBatch(
  view: ProductRouteView,
  offset: number,
  limit: number = PAGE_SIZE,
  sort: ProductsQueryState["sort"] = DEFAULT_PRODUCT_SORT,
): Promise<ListResponse<SunglassesProduct>> {
  return fetchSunglassesPage(
    getSunglassesQueryByView(view),
    sort,
    offset,
    limit,
  );
}

export async function getSunglassesPageData(
  view: ProductRouteView,
  sort: ProductsQueryState["sort"] = DEFAULT_PRODUCT_SORT,
): Promise<ListResponse<SunglassesProduct>> {
  return fetchSunglassesBatch(view, 0, PAGE_SIZE, sort);
}

export async function fetchSunglassesCollectionBatch(
  collectionSlug: string,
  offset: number,
  limit: number = PAGE_SIZE,
  sort: ProductsQueryState["sort"] = DEFAULT_PRODUCT_SORT,
): Promise<ListResponse<SunglassesProduct>> {
  return fetchSunglassesPage(
    { collectionSlug },
    sort,
    offset,
    limit,
  );
}

export async function fetchSunglassesById(
  id: string,
): Promise<SunglassesProduct> {
  return fetchOne(`/sunglasses/${id}`, SunglassesProduct);
}
