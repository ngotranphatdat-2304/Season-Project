"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import type { ProductCard } from "../../lib/model/misc";
import { cn } from "@/lib/utils";

type ProductsPageViewProps = {
  products: ProductCard[];
};

type ProductImageCardProps = {
  product: ProductCard;
  index: number;
};

function ProductImageCard({ product, index }: ProductImageCardProps) {
  const imageCount = product.images.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasManualNavigation, setHasManualNavigation] = useState(false);

  const displayedIndex = useMemo(() => {
    if (
      isHovered &&
      !hasManualNavigation &&
      imageCount > 1 &&
      activeIndex < imageCount - 1
    ) {
      return activeIndex + 1;
    }

    return activeIndex;
  }, [activeIndex, hasManualNavigation, imageCount, isHovered]);

  const handlePrevious = () => {
    if (imageCount <= 1) {
      return;
    }

    setHasManualNavigation(true);
    setActiveIndex(Math.max(displayedIndex - 1, 0));
  };

  const handleNext = () => {
    if (imageCount <= 1) {
      return;
    }

    setHasManualNavigation(true);
    setActiveIndex(Math.min(displayedIndex + 1, imageCount - 1));
  };

  return (
    <Card
      className="group overflow-hidden border-0 bg-[#f5f5f7] shadow-none"
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="relative aspect-[4/4.4] overflow-hidden bg-[#f7f7fb] transition-transform duration-500 group-hover:-translate-y-1">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 z-10 size-8 rounded-full bg-white/70 text-neutral-700 opacity-85 backdrop-blur-xs transition-all duration-300 hover:bg-white md:size-9"
          >
            <Bookmark data-icon="inline-start" />
          </Button>

          <div className="absolute inset-0 overflow-hidden">
            {imageCount > 0 ? (
              <div
                className="flex h-full w-full transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${displayedIndex * 100}%)`,
                }}
              >
                {product.images.map((image, imageIndex) => (
                  <div
                    key={`${product.slug}-${imageIndex}`}
                    className="relative h-full min-w-full"
                  >
                    <Image
                      src={image}
                      alt={`${product.title} ${imageIndex + 1}`}
                      fill
                      loading={index === 0 && imageIndex === 0 ? "eager" : "lazy"}
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {imageCount > 1 ? (
            <>
              <button
                type="button"
                aria-label="Show previous image"
                className={cn(
                  "absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center text-neutral-700 opacity-0 transition-all duration-300 group-hover:opacity-100 md:size-10",
                  displayedIndex === 0 && "pointer-events-none opacity-0",
                )}
                onClick={handlePrevious}
              >
                <ChevronLeft className="size-4" />
              </button>

              <button
                type="button"
                aria-label="Show next image"
                className={cn(
                  "absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center text-neutral-700 opacity-0 transition-all duration-300 group-hover:opacity-100 md:size-10",
                  displayedIndex >= imageCount - 1 &&
                    "pointer-events-none opacity-0",
                )}
                onClick={handleNext}
              >
                <ChevronRight className="size-4" />
              </button>

              <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center bg-linear-to-t from-[#f7f7fb] via-[#f7f7fb]/92 to-transparent px-3 pb-3 pt-10 sm:px-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-800 sm:text-xs">
                  {Math.min(displayedIndex + 1, imageCount)} / {imageCount} colors
                </div>
              </div>
            </>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-2 px-3 pb-3 pt-0 sm:px-4 sm:pb-4 md:flex-row md:items-end md:justify-between md:gap-3">
        <div className="flex flex-col gap-1">
          {product.meta ? (
            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px] md:text-xs">
              {product.meta}
            </p>
          ) : null}
          <CardTitle className="text-sm font-serif font-normal uppercase tracking-[0.08em] sm:text-base md:text-lg md:tracking-[0.12em]">
            {product.title}
          </CardTitle>
        </div>
        <div className="text-left text-xs text-neutral-600 sm:text-sm md:text-right">
          {product.isOnSale ? (
            <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-400 line-through sm:text-xs sm:tracking-[0.18em]">
              {product.originalPrice.toLocaleString("vi-VN")} VND
            </div>
          ) : null}
          <div>{product.price.toLocaleString("vi-VN")} VND</div>
        </div>
      </CardFooter>
    </Card>
  );
}

export function ProductGrid({ products }: ProductsPageViewProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-3">
      {products.map((product, index) => (
        <ProductImageCard
          key={product.slug}
          product={product}
          index={index}
        />
      ))}
    </div>
  );
}
