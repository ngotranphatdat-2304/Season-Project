import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ProductsCategoryShell } from "@/components/products/products-category-shell";
import {
  getProductCategoryConfig,
  parseProductCategory,
} from "@/components/products/utils";

type CategoryLayoutProps = {
  children: ReactNode;
  params: Promise<{
    category: string;
  }>;
};

export default async function CategoryLayout({
  children,
  params,
}: CategoryLayoutProps) {
  const { category: categoryParam } = await params;
  const category = parseProductCategory(categoryParam);

  if (category === undefined) {
    notFound();
  }

  const categoryConfig = getProductCategoryConfig(category);

  if (categoryConfig === undefined) {
    notFound();
  }

  return (
    <ProductsCategoryShell category={category} categoryConfig={categoryConfig}>
      {children}
    </ProductsCategoryShell>
  );
}
