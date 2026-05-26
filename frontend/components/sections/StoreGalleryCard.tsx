"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type StoreGalleryCardProps = {
  name: string;
  address: string;
  openingHours: string;
  phone: string;
  images: string[];
  priority?: boolean;
};

export function StoreGalleryCard({
  name,
  address,
  openingHours,
  phone,
  images,
  priority = false,
}: StoreGalleryCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = images.length > 1;
  const activeImage = images[activeIndex] ?? images[0] ?? "";

  const goToPreviousImage = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? images.length - 1 : currentIndex - 1,
    );
  };

  const goToNextImage = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % images.length);
  };

  return (
    <article className="relative min-h-110 overflow-hidden bg-black md:min-h-170">
      {activeImage !== "" ? (
        <Image
          key={activeImage}
          src={activeImage}
          alt={name}
          fill
          priority={priority}
          sizes="(max-width: 767px) calc(100vw - 40px), 50vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#d8d8d8]" />
      )}

      <div className="absolute inset-0 bg-linear-to-b from-black/44 via-black/10 to-black/24" />

      <div className="absolute left-5 top-5 max-w-[84%] font-afacad text-white md:left-8 md:top-8">
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-white/62">
          Flagship Store
        </p>
        <h2 className="text-[24px] font-semibold uppercase leading-none tracking-[0.08em] md:text-[32px]">
          {name}
        </h2>
        <div className="mt-5 space-y-1.5 text-[14px] leading-[1.45] text-white/88 md:text-[16px]">
          <p>{address}</p>
          <p>{openingHours}</p>
          <p>{phone}</p>
        </div>
      </div>

      {hasMultipleImages === true ? (
        <>
          <button
            type="button"
            aria-label={`Previous ${name} image`}
            className="absolute left-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center bg-black/10 text-white opacity-80 backdrop-blur-[1px]"
            onClick={goToPreviousImage}
          >
            <ChevronLeft className="size-5 stroke-[1.6]" />
          </button>

          <button
            type="button"
            aria-label={`Next ${name} image`}
            className="absolute right-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center bg-black/10 text-white opacity-80 backdrop-blur-[1px]"
            onClick={goToNextImage}
          >
            <ChevronRight className="size-5 stroke-[1.6]" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                aria-label={`Go to ${name} image ${index + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  activeIndex === index
                    ? "w-8 bg-white"
                    : "w-2 bg-white/50",
                )}
                onClick={() => {
                  setActiveIndex(index);
                }}
              />
            ))}
          </div>
        </>
      ) : null}
    </article>
  );
}
