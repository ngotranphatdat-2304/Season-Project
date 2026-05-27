"use client";

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
    <section className="group relative h-[calc(100svh-4rem)] min-h-[520px] max-h-[760px] w-full overflow-hidden border-b border-season-gray bg-white md:h-[95vh] md:max-h-none">
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
                  className="select-none object-cover object-[50%_42%] md:object-center"
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
          className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 border-white/35 bg-black/10 text-white opacity-80 backdrop-blur-[1px] transition-all duration-300 hover:border-white hover:bg-white hover:text-black disabled:opacity-0 md:left-8 md:h-12 md:w-12 md:bg-transparent md:opacity-0 md:group-hover:opacity-100"
        />
        <CarouselNext
          onClick={handleNext}
          className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 border-white/35 bg-black/10 text-white opacity-80 backdrop-blur-[1px] transition-all duration-300 hover:border-white hover:bg-white hover:text-black disabled:opacity-0 md:right-8 md:h-12 md:w-12 md:bg-transparent md:opacity-0 md:group-hover:opacity-100"
        />
      </Carousel>

      <div className="pointer-events-none absolute inset-0 z-10 flex animate-in flex-col items-center justify-end gap-5 px-5 pb-16 text-center fade-in zoom-in duration-700 sm:gap-6 sm:pb-18 md:justify-center md:gap-8 md:px-4 md:pb-0">
        <h1 className="font-serif text-[1.65rem] font-extralight uppercase leading-[1.04] tracking-[0.14em] text-white drop-shadow-md sm:text-4xl sm:tracking-[0.18em] md:text-6xl md:tracking-[0.20em]">
          New Collection
        </h1>
        <Link
          href="/collections/the-athletes/"
          className="pointer-events-auto inline-flex min-h-11 items-center justify-center rounded-none border border-white bg-transparent px-6 py-3 font-sans text-[10px] uppercase tracking-widest text-white outline transition-colors duration-300 hover:bg-white hover:text-black md:min-h-12 md:px-8 md:py-4 md:text-xs"
        >
          Shop Now
        </Link>
      </div>
    </section>
  );
}
