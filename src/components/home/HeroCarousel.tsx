"use client";

import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const SLIDES = [
  "/images/cocandy/hero-1.png",
  "/images/cocandy/hero-2.png",
  "/images/cocandy/hero-3.png",
  "/images/cocandy/hero-4.png",
  "/images/cocandy/hero-5.png",
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const goTo = (i: number) => setIndex((i + SLIDES.length) % SLIDES.length);
  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  return (
    <section className="relative w-full overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((src, i) => (
          <a key={src} href="#" className="w-full shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Slide ${i + 1}`}
              className="aspect-[2/1] max-h-[560px] w-full object-cover"
            />
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/60 text-black transition-colors hover:bg-white/90"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/60 text-black transition-colors hover:bg-white/90"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {SLIDES.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-[#b08560]" : "w-2 bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
