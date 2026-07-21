"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export interface SuperAdsCarouselSlide {
  id: string;
  href: string;
  title: string;
  price: number;
  imageUrl: string | null;
}

export function SuperAdsCarousel({
  slides,
}: {
  slides: SuperAdsCarouselSlide[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByOneSlide(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Super Ads</h3>
        {slides.length > 1 ? (
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous super ad"
              onClick={() => scrollByOneSlide(-1)}
              className="border-border hover:bg-accent flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next super ad"
              onClick={() => scrollByOneSlide(1)}
              className="border-border hover:bg-accent flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide) => (
          <Link
            key={slide.id}
            href={slide.href}
            className="group relative block h-[360px] w-full flex-none snap-start overflow-hidden rounded-[32px]"
          >
            <div className="bg-muted absolute inset-0">
              {slide.imageUrl ? (
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  sizes="800px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : null}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-6 left-6 flex gap-2">
              <span className="bg-tier-super text-tier-super-foreground flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-lg">
                Super Ad
              </span>
              <span className="bg-card/80 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md">
                Premium Listing
              </span>
            </div>
            <div className="absolute bottom-8 left-8 max-w-lg text-white">
              <p className="mb-2 text-3xl font-bold">{slide.title}</p>
              <p className="mb-4 text-2xl font-bold">
                Rs. {slide.price.toLocaleString()}
              </p>
              <span className="bg-primary text-primary-foreground inline-block rounded-xl px-8 py-3 text-sm font-bold">
                View Full Details
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
