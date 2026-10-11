"use client";

import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import { cn } from "@repo/ui/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];

interface CarouselContextValue {
  viewportRef: UseEmblaCarouselType[0];
  api: CarouselApi;
  selectedIndex: number;
  snapCount: number;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number) => void;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

/** Embla state + controls for custom arrows, dots and thumbnails. */
function useCarousel() {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) throw new Error("useCarousel must be used within <Carousel>");
  return ctx;
}

/**
 * Swipeable carousel (Embla). Touch/mouse drag, snap and keyboard arrows come
 * built in; render arrows/dots yourself with `useCarousel()` so each section
 * keeps its own look. `autoplayDelay` (ms) auto-advances; a swipe or arrow
 * press restarts the timer rather than stopping it for good.
 */
function Carousel({
  opts,
  autoplayDelay,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  opts?: CarouselOptions;
  autoplayDelay?: number;
}) {
  // Embla re-initialises when the plugin array identity changes, so build it once.
  const [plugins] = React.useState(() =>
    autoplayDelay
      ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })]
      : [],
  );
  const [viewportRef, api] = useEmblaCarousel(opts, plugins);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [snapCount, setSnapCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    const sync = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
    };
    sync();
    api.on("select", sync).on("reInit", sync);
    return () => {
      api.off("select", sync).off("reInit", sync);
    };
  }, [api]);

  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);
  const scrollTo = React.useCallback((i: number) => api?.scrollTo(i), [api]);

  const onKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollNext();
    }
  };

  return (
    <CarouselContext.Provider
      value={{
        viewportRef,
        api,
        selectedIndex,
        snapCount,
        scrollPrev,
        scrollNext,
        scrollTo,
      }}
    >
      <div
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        className={cn("relative", className)}
        onKeyDownCapture={onKeyDownCapture}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { viewportRef } = useCarousel();
  return (
    <div ref={viewportRef} className="overflow-hidden" data-slot="carousel-content">
      <div className={cn("flex touch-pan-y", className)} {...props} />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  );
}

export { Carousel, CarouselContent, CarouselItem, useCarousel, type CarouselApi };
