"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import {
  deserializeProductRecord,
  type SerializedProductRecord,
} from "../utils";
import {
  buildProductFacts,
  formatDisplayName,
  getVariantStartIndex,
  humanizeLabel,
  inferColorSwatch,
  splitDescription,
  type AccordionSection,
} from "./utils";
import { RelatedProductGrid } from "./related-product-grid";

type ProductDetailViewProps = {
  product: SerializedProductRecord;
  relatedProducts?: SerializedProductRecord[];
  collectionSlug?: string;
};

type AccordionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
};

function ProductAccordion({
  title,
  isOpen,
  onToggle,
  children,
  className,
}: AccordionProps) {
  return (
    <section className={cn("border-b border-black/12", className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-6 text-left"
        onClick={onToggle}
      >
        <span className="font-afacad text-[16px] font-semibold uppercase leading-[1.2] tracking-[0.8px] text-black">
          {title}
        </span>
        {isOpen ? (
          <Minus className="size-5 shrink-0 text-black/45" />
        ) : (
          <Plus className="size-5 shrink-0 text-black/45" />
        )}
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pb-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function ProductDetailView({
  product,
  relatedProducts = [],
  collectionSlug,
}: ProductDetailViewProps) {
  const hydratedProduct = useMemo(
    () => deserializeProductRecord(product),
    [product],
  );
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(() =>
    getVariantStartIndex(hydratedProduct),
  );
  const [openSection, setOpenSection] = useState<AccordionSection | null>(
    "info",
  );
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeSlide, setActiveSlide] = useState(0);

  const selectedVariant =
    hydratedProduct.variants[selectedVariantIndex] ??
    hydratedProduct.defaultVariant ??
    hydratedProduct.variants[0];
  const variantImages = selectedVariant?.images ?? [];
  const sizeImage = hydratedProduct.sizeGuideImage ?? "";
  const galleryImages = variantImages;
  const selectedColor = humanizeLabel(selectedVariant?.color);
  const productFacts = buildProductFacts(hydratedProduct);
  const descriptionParagraphs = splitDescription(hydratedProduct.description);
  const displayName = formatDisplayName(hydratedProduct.name);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateActiveSlide = () => {
      setActiveSlide(carouselApi.selectedScrollSnap());
    };

    updateActiveSlide();
    carouselApi.on("select", updateActiveSlide);
    carouselApi.on("reInit", updateActiveSlide);

    return () => {
      carouselApi.off("select", updateActiveSlide);
      carouselApi.off("reInit", updateActiveSlide);
    };
  }, [carouselApi]);

  const toggleSection = (section: AccordionSection) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  const renderSummary = (className?: string) => (
    <div className={cn("space-y-7", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="whitespace-pre-line font-seesans text-[24px] font-normal uppercase tracking-[-0.05em] text-black">
            {displayName}
          </h1>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-0.5 size-6 shrink-0 rounded-none border-0 bg-transparent p-0 text-black hover:bg-transparent hover:text-black/70"
        >
          <Bookmark className="size-5 stroke-[1.75]" />
        </Button>
      </div>

      <div className="space-y-4 font-afacad font-normal">
        <div className="space-y-4">
          <p className="text-[16px] font-normal text-black">Colors Available</p>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] text-black/42">{selectedColor}</p>
            <div className="flex flex-wrap justify-end gap-2.5">
              {hydratedProduct.variants.map((variant, index) => {
                const variantLabel = humanizeLabel(variant.color);
                const isActive = index === selectedVariantIndex;

                return (
                  <button
                    key={variant.sku}
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`Select ${variantLabel}`}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border p-0.5 transition-all duration-200",
                      isActive
                        ? "border-black"
                        : "border-transparent hover:border-black/25",
                    )}
                    onClick={() => {
                      setActiveSlide(0);
                      setSelectedVariantIndex(index);
                    }}
                  >
                    <span
                      className="block size-full rounded-full border border-black/10"
                      style={{
                        backgroundColor: inferColorSwatch(variantLabel, index),
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {hydratedProduct.isOnSale ? (
          <p className="text-[11px] uppercase tracking-[0.22em] text-black/35 line-through">
            {hydratedProduct.originalPrice.toLocaleString("vi-VN")} VND
          </p>
        ) : null}

        <button
          type="button"
          className="flex w-full items-center justify-between bg-[#111111] px-5 py-5 text-[15px] font-normal uppercase tracking-normal text-white transition-colors duration-200 hover:bg-black/85"
        >
          <span>Thêm Vào Giỏ</span>
          <span>+ {selectedVariant?.price.toLocaleString("vi-VN")} VND</span>
        </button>
      </div>
    </div>
  );

  const renderAccordionContent = (section: AccordionSection) => {
    if (section === "info") {
      return (
        <div className="space-y-5 font-afacad text-[16px] font-normal leading-[1.4] tracking-[0.55px] text-black">
          {descriptionParagraphs.map((paragraph, index) => (
            <p key={`${hydratedProduct.id}-description-${index}`}>
              {paragraph}
            </p>
          ))}

          <div className="space-y-1 pt-1">
            {productFacts.map((fact) => (
              <p key={fact}>{fact}</p>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5 font-afacad text-[12px] uppercase tracking-[0.18em] text-black/56">
        {sizeImage !== "" ? (
          <div className="overflow-hidden bg-white/70">
            <Image
              src={sizeImage}
              alt={`${hydratedProduct.name} size guide`}
              width={1200}
              height={900}
              className="h-auto w-full"
              sizes="(max-width: 767px) calc(100vw - 32px), 300px"
            />
          </div>
        ) : (
          <div className="flex aspect-4/3 items-center justify-center bg-white/40 px-6 text-center text-[11px] tracking-[0.22em] text-black/40">
            No size image available
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#f0f0f0] px-4 pb-16 pt-6 text-[#1d1b18] md:px-8 md:pb-24 md:pt-10">
      <div className="mx-auto max-w-420">
        <div className="space-y-10 md:hidden">
          <section className="space-y-4">
            {galleryImages.length > 0 ? (
              <>
                <Carousel
                  key={selectedVariant?.sku ?? hydratedProduct.id}
                  setApi={setCarouselApi}
                  opts={{ loop: false }}
                  className="w-full"
                >
                  <CarouselContent className="ml-0">
                    {galleryImages.map((image, imageIndex) => (
                      <CarouselItem
                        key={`${selectedVariant?.sku ?? hydratedProduct.id}-${imageIndex}`}
                        className="pl-0"
                      >
                        <div className="relative aspect-4/5 overflow-hidden bg-[#f0f0f0]">
                          <Image
                            src={image}
                            alt={`${hydratedProduct.name} ${imageIndex + 1}`}
                            fill
                            priority={imageIndex === 0}
                            className="object-contain"
                            sizes="calc(100vw - 32px)"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>

                {galleryImages.length > 1 ? (
                  <div className="flex items-center justify-center gap-3 pt-1">
                    {galleryImages.map((_, index) => (
                      <button
                        key={`${selectedVariant?.sku ?? hydratedProduct.id}-dot-${index}`}
                        type="button"
                        aria-label={`Go to image ${index + 1}`}
                        className={cn(
                          "size-2 rounded-full transition-colors",
                          activeSlide === index ? "bg-black" : "bg-black/25",
                        )}
                        onClick={() => {
                          carouselApi?.scrollTo(index);
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex aspect-4/5 items-center justify-center bg-white/40 text-sm text-black/45">
                No gallery images available
              </div>
            )}
          </section>

          {renderSummary()}

          <div>
            <ProductAccordion
              title="THÔNG TIN SẢN PHẨM"
              isOpen={openSection === "info"}
              onToggle={() => {
                toggleSection("info");
              }}
            >
              {renderAccordionContent("info")}
            </ProductAccordion>

            <ProductAccordion
              title="KÍCH THƯỚC"
              isOpen={openSection === "size"}
              onToggle={() => {
                toggleSection("size");
              }}
            >
              {renderAccordionContent("size")}
            </ProductAccordion>
          </div>
        </div>

        <div className="hidden md:grid md:grid-cols-[1fr_2.08fr_0.98fr] md:gap-7.75">
          <aside className="md:sticky md:top-[25vh] md:[align-self:start]">
            <div className="max-w-75 space-y-2">
              <ProductAccordion
                title="THÔNG TIN SẢN PHẨM"
                isOpen={openSection === "info"}
                onToggle={() => {
                  toggleSection("info");
                }}
                className="pt-0"
              >
                {renderAccordionContent("info")}
              </ProductAccordion>

              <ProductAccordion
                title="KÍCH THƯỚC"
                isOpen={openSection === "size"}
                onToggle={() => {
                  toggleSection("size");
                }}
              >
                {renderAccordionContent("size")}
              </ProductAccordion>
            </div>
          </aside>

          <section className="space-y-2">
            {galleryImages.length > 0 ? (
              galleryImages.map((image, imageIndex) => (
                <div
                  key={`${selectedVariant?.sku ?? hydratedProduct.id}-${imageIndex}`}
                  className="relative aspect-4/5 overflow-hidden bg-[#f0f0f0]"
                >
                  <Image
                    src={image}
                    alt={`${hydratedProduct.name} ${imageIndex + 1}`}
                    fill
                    priority={imageIndex === 0}
                    className="object-contain"
                    sizes="(max-width: 767px) 100vw, 624px"
                  />
                </div>
              ))
            ) : (
              <div className="flex aspect-4/5 items-center justify-center bg-white/40 text-sm text-black/45">
                No gallery images available
              </div>
            )}
          </section>

          <aside className="md:sticky md:top-[25vh] md:[align-self:start]">
            {renderSummary("max-w-full")}

            <div className="pt-4 text-center">
              <button
                type="button"
                className="border-b border-transparent pb-1 font-afacad text-[11px] font-normal uppercase tracking-[0.22em] text-black/45 transition-colors hover:border-black/20 hover:text-black/72"
              >
                View Shipping & Returns
              </button>
            </div>
          </aside>
        </div>
      </div>
      <RelatedProductGrid
        products={relatedProducts}
        collectionSlug={collectionSlug}
      />
    </main>
  );
}
