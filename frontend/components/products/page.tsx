import { notFound } from "next/navigation";
import { ProductsPage } from "@/components/products/products-page";
import { getProductCategoryConfig } from "@/components/products/products-data";

type CategoryRouteProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function CategoryRoute({ params }: CategoryRouteProps) {
  const { category } = await params;
  const categoryConfig = getProductCategoryConfig(category);

  if (categoryConfig === undefined) {
    notFound();
  }

  return <ProductsPage category={category} />;
}
