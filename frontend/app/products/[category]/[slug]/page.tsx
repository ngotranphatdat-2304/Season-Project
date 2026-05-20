import { notFound } from "next/navigation";
import { ProductTypeEnum } from "@/lib/enums";
import { getSunglassesPageData, getEyeglassesPageData } from "@/lib/model";
import {
  isEyeglassesSlug,
  isSunglassesSlug,
  ProductsPageData,
} from "@/lib/model/misc";
import { ProductsPageShell } from "@/components/products/products-page-shell";
import { parseProductCategory } from "@/components/products/utils";

type CategoryRouteProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export default async function CategoryPage({ params }: CategoryRouteProps) {
  const { category: categoryParam, slug } = await params;
  const category = parseProductCategory(categoryParam);

  if (category === undefined) {
    notFound();
  }

  if (category === ProductTypeEnum.eyeglasses) {
    if (!isEyeglassesSlug(slug)) {
      notFound();
    }

    const data: ProductsPageData = await getEyeglassesPageData(slug);

    return (
      <ProductsPageShell category={category} view={slug} initialData={data} />
    );
  }

  if (category === ProductTypeEnum.sunglasses) {
    if (!isSunglassesSlug(slug)) {
      notFound();
    }

    const data: ProductsPageData = await getSunglassesPageData(slug);

    return (
      <ProductsPageShell category={category} view={slug} initialData={data} />
    );
  }

  notFound();
}
