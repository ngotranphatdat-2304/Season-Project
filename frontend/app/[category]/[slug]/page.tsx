import { notFound } from "next/navigation";
import { ProductTypeEnum } from "@/lib/enums";
import { getSunglassesPageData, getEyeglassesPageData } from "@/lib/model";
import {
  isEyeglassesSlug,
  isSunglassesSlug,
  parseProductsQueryState,
  toPlainObject,
} from "@/lib/model/misc";
import { CategoryListShell } from "@/components/products/view-by-category/category-list-shell";
import { parseProductCategory } from "@/components/products/view-by-category/category-config";
import { getSingleSearchParam } from "@/app/utils/search-params";

type CategoryRouteProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryRouteProps) {
  const { category: categoryParam, slug } = await params;
  const queryParams = await searchParams;
  const category = parseProductCategory(categoryParam);
  const queryState = parseProductsQueryState({
    sort: getSingleSearchParam(queryParams.sort),
    frameType: getSingleSearchParam(queryParams.frameType),
    frameSize: getSingleSearchParam(queryParams.frameSize),
  });

  if (category === undefined) {
    notFound();
  }

  if (category === ProductTypeEnum.eyeglasses) {
    if (!isEyeglassesSlug(slug)) {
      notFound();
    }

    const data = await getEyeglassesPageData(slug, queryState);

    return (
      <CategoryListShell
        category={category}
        view={slug}
        initialData={toPlainObject(data)}
      />
    );
  }

  if (category === ProductTypeEnum.sunglasses) {
    if (!isSunglassesSlug(slug)) {
      notFound();
    }

    const data = await getSunglassesPageData(slug, queryState.sort);

    return (
      <CategoryListShell
        category={category}
        view={slug}
        initialData={toPlainObject(data)}
      />
    );
  }

  notFound();
}
