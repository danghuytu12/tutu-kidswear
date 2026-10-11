"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@repo/ui/components/icons";
import { MotionButton } from "@repo/ui/components/motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@repo/ui/components/ui/carousel";

const SLIDES = [
  "/images/cocandy/hero-1.png",
  "/images/cocandy/hero-2.png",
  "/images/cocandy/hero-3.png",
  "/images/cocandy/hero-4.png",
  "/images/cocandy/hero-5.png",
];

function HeroControls() {
  const { selectedIndex, scrollPrev, scrollNext, scrollTo } = useCarousel();
  return (
    <>
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <MotionButton
          type="button"
          onClick={scrollPrev}
          aria-label="Previous slide"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-black transition-colors hover:bg-white/90"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </MotionButton>
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <MotionButton
          type="button"
          onClick={scrollNext}
          aria-label="Next slide"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-black transition-colors hover:bg-white/90"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </MotionButton>
      </div>

      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {SLIDES.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === selectedIndex ? "w-6 bg-[#b08560]" : "w-2 bg-white/70"
            }`}
          />
        ))}
      </div>
    </>
  );
}

export function HeroCarousel() {
  return (
    <section className="relative w-full overflow-hidden">
      <Carousel opts={{ loop: true }} autoplayDelay={5000} aria-label="Banner">
        <CarouselContent>
          {SLIDES.map((src, i) => (
            <CarouselItem key={src}>
              <a href="#" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Slide ${i + 1}`}
                  draggable={false}
                  className="aspect-[2/1] max-h-[660px] w-full"
                />
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
        <HeroControls />
      </Carousel>
    </section>
  );
}
