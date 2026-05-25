"use client";

import Link from "next/link";
import { ProductGrid } from "../products-grid";
import {
  hydrateProducts,
  toProductCards,
  type SerializedProductRecord,
} from "../utils";

type RelatedProductGridProps = {
  products: SerializedProductRecord[];
  collectionSlug?: string;
};

export function RelatedProductGrid({
  products,
  collectionSlug,
}: RelatedProductGridProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-40">
      <div className="mx-auto max-w-420 space-y-8 md:space-y-10">
        <h2 className="font-afacad text-[16px] font-semibold uppercase tracking-[0.08em] text-black md:text-[30px]">
          SẢN PHẨM LIÊN QUAN
        </h2>

        <ProductGrid
          products={toProductCards(hydrateProducts(products))}
          gridClassName="grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-x-4 md:gap-y-12 xl:grid-cols-4"
          cardClassName="bg-[#f0f0f0]"
          imageFrameClassName="bg-[#f0f0f0]"
          imageOverlayClassName="from-[#f0f0f0] via-[#f0f0f0]/92"
        />

        {collectionSlug ? (
          <div className="pt-2 text-center">
            <Link
              href={`/collections/${collectionSlug}`}
              className="font-afacad text-[16px] uppercase tracking-[0.02em] text-black/28 underline underline-offset-6 transition-colors hover:text-black/55"
            >
              KHÁM PHÁ TẤT CẢ
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
