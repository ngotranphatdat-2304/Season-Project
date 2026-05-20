"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { heroImage, heroImage2, heroImage3 } from "@/images/landing-page";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useState } from "react";

export function Hero() {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));
  const [api, setApi] = useState<CarouselApi>();

  const handlePrevious = () => {
    api?.scrollPrev();
    api?.plugins().autoplay.reset();
  };

  const handleNext = () => {
    api?.scrollNext();
    api?.plugins().autoplay.reset();
  };
  const heroImages = [heroImage, heroImage2, heroImage3];
  return (
    <section className="relative w-full h-[70vh] md:h-[95vh] bg-white border-b border-season-gray overflow-hidden group">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full h-full"
        opts={{
          loop: true,
          duration: 60,
        }}
      >
        <CarouselContent className="h-full ml-0">
          {heroImages.map((image, index) => (
            <CarouselItem
              key={index}
              className="pl-0 relative h-full w-full basis-full min-w-0"
            >
              <div className="relative w-full h-full">
                <Image
                  src={image}
                  alt={`Season Campaign Visual ${index + 1}`}
                  fill
                  sizes="100vw"
                  className="object-cover md:object-center select-none"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Buttons */}
        <CarouselPrevious
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 md:left-8 bg-transparent border-white/50 text-white hover:bg-white hover:text-black hover:border-white transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-0 h-10 w-10 md:h-12 md:w-12"
        />
        <CarouselNext
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 md:right-8 bg-transparent border-white/50 text-white hover:bg-white hover:text-black hover:border-white transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-0 h-10 w-10 md:h-12 md:w-12"
        />
      </Carousel>

      <div className="absolute inset-0 z-10 flex flex-col  items-center justify-end mb-10 md:justify-center text-center gap-6 md:gap-8 animate-in fade-in zoom-in duration-700 pointer-events-none px-4">
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-serif text-white uppercase tracking-[0.20em] font-extralight drop-shadow-md">
          New Collections
        </h1>
        <Link
          href="/products/sunglasses/view-all"
          className="rounded-none outline border-white bg-transparent px-6 py-5 md:px-8 md:py-6 font-sans text-[10px] md:text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors duration-300 backdrop-blur-sm pointer-events-auto"
        >
          Shop Now
        </Link>
      </div>
    </section>
  );
}
