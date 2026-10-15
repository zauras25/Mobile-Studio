"use client";

import Link from "next/link";
import { useState } from "react";
import type { StoreBanner } from "@/components/CatalogProvider";

type Props = {
  banners: StoreBanner[];
  label: string;
};

export default function BannerCarousel({ banners, label }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [unavailableImages, setUnavailableImages] = useState<Set<number>>(
    () => new Set(),
  );

  if (banners.length === 0) return null;

  const visibleIndex = activeIndex % banners.length;
  const showControls = banners.length > 1;

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + banners.length) % banners.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % banners.length);
  }

  return (
    <section
      aria-label={label}
      aria-roledescription="carousel"
      className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 shadow-lg">
        <div
          className="flex transition-transform duration-700 ease-in-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${visibleIndex * 100}%)` }}
          aria-live="polite"
        >
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${banners.length}`}
              aria-hidden={index !== visibleIndex}
              className="w-full flex-none"
            >
              <Link
                href={`/banner/${banner.id}`}
                tabIndex={index === visibleIndex ? 0 : -1}
                aria-label={`View banner: ${banner.title}`}
                className="banner-carousel-slide group relative flex aspect-[16/8] min-h-52 items-end overflow-hidden p-5 sm:aspect-[16/6] sm:min-h-64 sm:p-8 lg:aspect-[16/5]"
              >
                {!unavailableImages.has(banner.id) && (
                  <img
                    src={banner.image_url}
                    alt=""
                    loading={index === visibleIndex ? "eager" : "lazy"}
                    decoding="async"
                    onError={() =>
                      setUnavailableImages((current) => new Set(current).add(banner.id))
                    }
                    className="banner-carousel-image"
                  />
                )}
                <span className="banner-carousel-title">
                  {banner.title}
                </span>
              </Link>
            </div>
          ))}
        </div>

        {showControls && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 sm:px-5">
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Show previous banner"
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/90 text-xl font-black text-slate-900 shadow transition hover:bg-white sm:h-12 sm:w-12"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Show next banner"
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/90 text-xl font-black text-slate-900 shadow transition hover:bg-white sm:h-12 sm:w-12"
              >
                ›
              </button>
            </div>

          </>
        )}
      </div>

      {showControls && (
        <div className="mt-3 flex justify-center gap-2" aria-label="Choose a banner">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show banner ${index + 1}: ${banner.title}`}
              aria-current={index === visibleIndex ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all ${
                index === visibleIndex ? "w-7 bg-orange-500" : "w-2.5 bg-slate-300 hover:bg-orange-300"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
