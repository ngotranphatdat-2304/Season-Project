"use client";

import { useEffect, useState, useTransition } from "react";
import { ProductTypeEnum } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { ProductsPage } from "./products-page";
import { fetchProductsBatchByCategory } from "../../lib/model/";
import { PAGE_SIZE, ProductCard, ProductsPageData } from "../../lib/model/misc";
import { ProductsPageProps } from "./type";


type ProductsPageShellProps<C extends ProductTypeEnum = ProductTypeEnum> = {
  category: C;
  view: ProductsPageProps<C>["view"];
  initialData: ProductsPageData;
};

export function ProductsPageShell<C extends ProductTypeEnum = ProductTypeEnum>({
  category,
  view,
  initialData,
}: ProductsPageShellProps<C>) {
  const [products, setProducts] = useState<ProductCard[]>(
    initialData.initialProducts,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProducts(initialData.initialProducts);
    setError(null);
  }, [initialData, view]);

  const loadedCount = products.length;
  const canLoadMore = loadedCount < initialData.totalItems;

  const loadMore = async () => {
    if (canLoadMore === false) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const response = await fetchProductsBatchByCategory(
        category,
        view,
        loadedCount,
        PAGE_SIZE,
      );

      startTransition(() => {
        setProducts((current) => [...current, ...response.records]);
      });
    } catch (error) {
      setError("Failed to load more products.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <ProductsPage products={products} totalItems={initialData.totalItems} />

      <div className="flex flex-col items-center gap-4 pb-8">
        <p className="text-center text-[15px] italic text-neutral-600">
          Showing {products.length} of {initialData.totalItems} products
        </p>

        <div className="h-px w-28 bg-linear-to-r from-neutral-400 via-neutral-300 to-transparent" />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {canLoadMore ? (
          <Button
            variant="outline"
            className="min-w-32 rounded-none px-8 py-6 uppercase tracking-[0.18em]"
            disabled={isLoadingMore || isPending}
            onClick={() => {
              void loadMore();
            }}
          >
            Load More
          </Button>
        ) : (
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-400">
            All products loaded
          </p>
        )}
      </div>
    </div>
  );
}
