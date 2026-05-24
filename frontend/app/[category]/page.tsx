import { notFound, redirect } from "next/navigation";
import {
  getProductCategoryConfig,
  parseProductCategory,
} from "@/components/products/view-by-category/category-config";

type CategoryRouteProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function CategoryPage({ params }: CategoryRouteProps) {
  const { category: categoryParam } = await params;
  const category = parseProductCategory(categoryParam);

  if (category !== undefined) {
    const categoryConfig = getProductCategoryConfig(category);

    if (categoryConfig === undefined) {
      notFound();
    }

    redirect(`/products/${categoryParam}/view-all`);
  }
}
