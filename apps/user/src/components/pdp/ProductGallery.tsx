"use client";

import { useEffect, useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@repo/ui/components/icons";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@repo/ui/components/ui/carousel";

function GalleryArrows() {
  const { snapCount, scrollPrev, scrollNext } = useCarousel();
  if (snapCount <= 1) return null;
  return (
    <>
      <button
        type="button"
        aria-label="Ảnh trước"
        onClick={scrollPrev}
        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-black hover:bg-white"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Ảnh sau"
        onClick={scrollNext}
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-black hover:bg-white"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </>
  );
}

function GalleryThumbs({ images, name }: { images: string[]; name: string }) {
  const { selectedIndex, scrollTo } = useCarousel();
  const stripRef = useRef<HTMLDivElement>(null);

  // Keep the active thumbnail in view when the main image is swiped. Scroll the
  // strip itself (not scrollIntoView) so the page never jumps vertically.
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[selectedIndex] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    strip.scrollTo({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [selectedIndex]);

  return (
    <div ref={stripRef} className="relative mt-3 flex gap-2 overflow-x-auto">
      {images.map((src, i) => (
        <button
          key={i}
          type="button"
          onClick={() => scrollTo(i)}
          className="shrink-0"
          aria-label={`Ảnh ${i + 1}`}
          aria-current={i === selectedIndex}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${name} ${i + 1}`}
            className={`h-16 w-16 cursor-pointer rounded ${
              i === selectedIndex ? "ring-2 ring-[#b08560]" : ""
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/** Swipeable product images with arrows and a synced thumbnail strip. */
export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  return (
    <Carousel opts={{ loop: true }} aria-label="Ảnh sản phẩm">
      <div className="relative overflow-hidden rounded-lg">
        <CarouselContent>
          {images.map((src, i) => (
            <CarouselItem key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={i === 0 ? name : `${name} ${i + 1}`}
                draggable={false}
                className="aspect-square w-full"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <GalleryArrows />
      </div>
      <GalleryThumbs images={images} name={name} />
    </Carousel>
  );
}
