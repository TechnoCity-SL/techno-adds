"use client";

import { useState } from "react";
import Image from "next/image";

export interface AdGalleryImage {
  id: string;
  /** Pre-resolved by the server — buildImageUrl() reads a non-NEXT_PUBLIC_
   * env var, so calling it from this client component would compute
   * "undefined" for the cloud name on the client and cause a hydration
   * mismatch against the server-rendered URL (confirmed by testing). */
  fullUrl: string;
  thumbUrl: string;
}

export function AdGallery({
  images,
  alt,
  badge,
}: {
  images: AdGalleryImage[];
  alt: string;
  badge?: { label: string; className: string } | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div className="bg-card overflow-hidden rounded-xl shadow-sm">
      <div className="bg-muted relative aspect-4/3 w-full overflow-hidden lg:aspect-auto lg:h-[480px]">
        {active ? (
          <Image
            key={active.id}
            src={active.fullUrl}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 65vw"
            className="object-cover"
          />
        ) : null}
        {badge ? (
          <span
            className={`absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold uppercase shadow-sm ${badge.className}`}
          >
            {badge.label}
          </span>
        ) : null}
        {images.length > 1 ? (
          <span className="absolute right-4 bottom-4 rounded-lg bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-md">
            {activeIndex + 1} / {images.length}
          </span>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 p-4 sm:grid-cols-6 lg:grid-cols-4">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View photo ${i + 1}`}
              className={`bg-muted relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                i === activeIndex ? "border-primary" : "border-transparent"
              }`}
            >
              <Image
                src={img.thumbUrl}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
