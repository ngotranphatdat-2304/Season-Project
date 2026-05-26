"use client";

import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "../products-grid";
import { SortFilterControl } from "../sort-filter-control";
import {
  PAGE_SIZE,
  parseProductsQueryState,
} from "@/lib/model/misc";
import { Spinner } from "../../ui/spinner";
import { cn } from "@/lib/utils";
import { ListResponse } from "@/lib/fetcher";
import { fetchCollectionProductsBatch } from "@/lib/model";
import {
  hydrateProducts,
  SerializedProductRecord,
  toProductCards,
} from "../utils";

type CollectionListShellProps = {
  collectionSlug: string;
  initialData: ListResponse<SerializedProductRecord>;
};

export function CollectionListShell({
  collectionSlug,
  initialData,
}: CollectionListShellProps) {
  return (
    <Suspense fallback={<Spinner className="size-4" />}>
      <CollectionListContent
        collectionSlug={collectionSlug}
        initialData={initialData}
      />
    </Suspense>
  );
}

function CollectionListContent({
  collectionSlug,
  initialData,
}: CollectionListShellProps) {
  const searchParams = useSearchParams();
  const sortParam = searchParams.get("sort") ?? undefined;
  const frameTypeParam = searchParams.get("frameType") ?? undefined;
  const frameSizeParam = searchParams.get("frameSize") ?? undefined;
  const queryState = useMemo(
    () =>
      parseProductsQueryState({
        sort: sortParam,
        frameType: frameTypeParam,
        frameSize: frameSizeParam,
      }),
    [sortParam, frameTypeParam, frameSizeParam],
  );
  const initialProducts = useMemo(
    () => toProductCards(hydrateProducts(initialData.records)),
    [initialData],
  );
  const [products, setProducts] = useState(initialProducts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isApplyingQuery, setIsApplyingQuery] = useState(false);

  useEffect(() => {
    setProducts(initialProducts);
    setError(null);
  }, [collectionSlug, initialProducts, queryState]);

  const loadedCount = products.length;
  const totalItems = initialData.total;
  const canLoadMore = loadedCount < totalItems;

  const loadMore = async () => {
    if (!canLoadMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const response = await fetchCollectionProductsBatch(
        collectionSlug,
        loadedCount,
        PAGE_SIZE,
        queryState,
      );

      startTransition(() => {
        setProducts((current) => [
          ...current,
          ...toProductCards(hydrateProducts(response.records)),
        ]);
      });
    } catch {
      setError("Failed to load more products.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="relative z-30 flex items-center justify-between gap-3">
          <SortFilterControl
            filterConfigKey="collections"
            onApplyingQueryChange={setIsApplyingQuery}
          />

          <Badge
            variant="secondary"
            className="w-fit rounded-full border border-[#ddd8d1] bg-white px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] sm:px-3 sm:text-[12px] md:text-[14px]"
          >
            {totalItems} Items
          </Badge>
        </div>

        <div
          className={cn(
            "transition-opacity duration-200",
            isApplyingQuery && "pointer-events-none opacity-50",
          )}
        >
          <ProductGrid products={products} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pb-8">
        <p className="text-center text-[15px] italic text-neutral-600">
          Showing {products.length} of {totalItems} products
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
