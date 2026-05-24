import { parseProductCategory } from "@/components/products/view-by-category/category-config";
import { toPlainObject } from "@/lib/model/misc";
import { fetchEyeglassesById } from "@/lib/model/eyeglasses/eyeglasses-api";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/products/view-product-detail/product-detail";
import { ProductTypeEnum } from "@/lib/enums";
import { fetchSunglassesById } from "@/lib/model/sunglasses/sunglasses-api";
import { getSingleSearchParam } from "@/app/utils/search-params";

type ProductPageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
};

export default async function ProductsPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { productId } = await params;
  const productType = getSingleSearchParam((await searchParams).type);

  if (productType === undefined || parseProductCategory(productType) === undefined) {
    notFound();
  }

  let product;

  try {
    product =
      productType === ProductTypeEnum.sunglasses
        ? await fetchSunglassesById(productId)
        : await fetchEyeglassesById(productId);
  } catch {
    console.error(
      `Failed to fetch product with id ${productId} in category ${productType}`,
    );
    notFound();
  }

  return <ProductDetailView product={toPlainObject(product)} />;
}
