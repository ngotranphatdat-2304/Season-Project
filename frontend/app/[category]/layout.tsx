import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CategoryLayout } from "@/components/products/view-by-category/category-layout";
import {
  getProductCategoryConfig,
  parseProductCategory,
} from "@/components/products/view-by-category/category-config";

type CategoryLayoutProps = {
  children: ReactNode;
  params: Promise<{
    category: string;
  }>;
};

export default async function CategoryRouteLayout({
  children,
  params,
}: CategoryLayoutProps) {
  const { category: categoryParam } = await params;
  const category = parseProductCategory(categoryParam);

  if (category === undefined) {
    return children;
  }

  const categoryConfig = getProductCategoryConfig(category);

  if (categoryConfig === undefined) {
    notFound();
  }

  return (
    <CategoryLayout category={category} categoryConfig={categoryConfig}>
      {children}
    </CategoryLayout>
  );
}
