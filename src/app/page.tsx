"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useCatalog } from "@/components/CatalogProvider";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard from "@/components/ProductCard";
import { categorySlug } from "@/data/store";

const categoryIcons: Record<string, string> = {
  Displays: "▣",
  Batteries: "▰",
  "Charging Parts": "ϟ",
  "Camera Parts": "◎",
  Housing: "▤",
  Flex: "⌁",
};

export default function HomePage() {
  const { products, categories, brands: catalogBrands, reviews, homepage, banners } = useCatalog();
  const brands = useMemo(
    () => catalogBrands.length
      ? catalogBrands.map((brand) => brand.name)
      : [...new Set(products.map((product) => product.brand))],
    [catalogBrands, products]
  );

  const featuredProducts = useMemo(
    () => (Array.isArray(products) ? products.filter((product) => product.is_featured).slice(0, 8) : []),
    [products],
  );

  const categoryList = Array.isArray(categories)
    ? categories
    : [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="store-hero">
        <div className="site-container store-hero-grid">
          <div className="store-hero-copy">
            <span className="store-hero-eyebrow">{homepage.eyebrow}</span>
            <h1 className="store-hero-title">{homepage.headline}</h1>
            <p className="store-hero-description">{homepage.description}</p>

            <form action="/search" method="GET" role="search" className="store-search">
              <label htmlFor="homepage-product-search" className="sr-only">
                Search parts by name, brand or device model
              </label>
              <input
                id="homepage-product-search"
                type="search"
                name="q"
                placeholder="Search by model, brand or part"
              />
              <button type="submit" className="site-button site-button-primary">
                Find a part
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="store-hero-actions">
              <Link href={homepage.button_href} className="store-hero-link">
                {homepage.button_label}
                <span className="ml-2" aria-hidden="true">→</span>
              </Link>
              <a href="#categories" className="store-hero-link">
                Browse categories
              </a>
            </div>

            {homepage.hero_highlights.filter((highlight) => highlight.trim()).length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/80 sm:text-sm">
                {homepage.hero_highlights
                  .filter((highlight) => highlight.trim())
                  .map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2">
                      <span className="text-orange-300" aria-hidden="true">✓</span>
                      {highlight}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="store-hero-visual" aria-hidden="true">
            <Image
              src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
              priority
              className="store-hero-image"
            />
            <div className="store-hero-note">
              <strong>Find parts with confidence</strong>
              <span>Check model, grade and availability on every listing.</span>
            </div>
          </div>
        </div>
      </section>

      <BannerCarousel
        label="Homepage promotions"
        banners={banners.filter((banner) => banner.placement === "Homepage")}
      />

      {/* Categories */}
      {homepage.show_categories && <section id="categories" className="site-container site-section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="site-eyebrow">
              Browse by category
            </p>
            <h2 className="site-section-heading mt-2">
              {homepage.category_heading}
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              {homepage.category_description}
            </p>
          </div>

          <Link
            href="/search"
            className="font-bold text-orange-600 hover:text-orange-700"
          >
            View all parts →
          </Link>
        </div>

        {categoryList.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categoryList.map((category) => {
              const name = category.name;
              return (
                <Link
                  key={name}
                  href={`/shop/${categorySlug(name)}`}
                  className="store-category-card group"
                >
                <span className="store-category-icon">
                  {category.icon_image_url ? (
                    <img src={category.icon_image_url} alt="" className="h-full w-full object-cover" />
                  ) : category.icon || categoryIcons[name] || "▣"}
                </span>

                <h3 className="mt-4 font-bold text-slate-900">
                  {name || "Mobile Parts"}
                </h3>

                <p className="mt-2 text-xs font-medium text-slate-500">
                  {category.count} {category.count === 1 ? "product" : "products"} →
                </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No visible categories are available yet. Browse the full product list instead.
            <Link href="/search" className="ml-1 font-bold text-orange-600 hover:text-orange-700">
              Browse products →
            </Link>
          </p>
        )}
      </section>}

      {/* Brands */}
      {homepage.show_brands && <section className="border-y border-slate-200 bg-white">
        <div className="site-container site-section">
          <div className="text-center">
            <p className="site-eyebrow">
              Find compatible parts
            </p>
            <h2 className="site-section-heading mt-2">
              {homepage.brand_heading}
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {brands.map((brand) => (
              <Link
                key={brand}
                href={`/search?q=${encodeURIComponent(brand)}`}
                className="store-brand-link"
              >
                {brand}
              </Link>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            {homepage.brand_description}
          </p>
        </div>
      </section>}

      {homepage.show_featured && <section className="site-container site-section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
              Explore our catalog
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {homepage.featured_heading}
            </h2>
            <p className="mt-3 text-slate-600">
              Browse selected products from the current catalog.
            </p>
          </div>

          <Link
            href="/search"
            className="font-bold text-orange-600 hover:text-orange-700"
          >
            View all products →
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <span className="text-4xl" aria-hidden="true">⌕</span>
            <h3 className="mt-3 text-xl font-bold">No featured products yet</h3>
            <p className="mt-2 text-slate-600">
              Explore the full catalog to see all currently listed parts.
            </p>
            <Link
              href="/search"
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600"
            >
              Browse all parts
            </Link>
          </div>
        )}
      </section>}

      {homepage.show_products && <section className="border-t border-slate-200 bg-white">
        <div className="site-container site-section">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Browse the catalog</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{homepage.products_heading}</h2>
            </div>
            <Link href="/search" className="font-bold text-orange-600 hover:text-orange-700">View all products →</Link>
          </div>
          {products.some((product) => !product.is_featured) ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.filter((product) => !product.is_featured).slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <p className="mt-8 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No other products are available yet.</p>
          )}
        </div>
      </section>}

      {homepage.show_reviews && reviews.length > 0 && <section className="site-container site-section">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Customer feedback</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">{homepage.reviews_heading}</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <StarRatingDisplay rating={review.rating} className="text-amber-500" />
              {review.is_demo && (
                <p className="mt-2 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-900">
                  Demo — not a customer review
                </p>
              )}
              {review.review_text ? (
                <p className="mt-3 text-sm leading-6 text-slate-600">{review.review_text}</p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-600">Rated this product</p>
              )}
              <p className="mt-4 font-bold text-slate-900">{review.reviewer_name}</p>
              <p className="mt-1 text-xs text-slate-500">{review.product_name}</p>
            </article>
          ))}
        </div>
      </section>}

      {/* Retailer CTA */}
      {homepage.show_retailer_cta && <section className="site-container pb-14 lg:pb-20">
        <div className="store-retailer-callout">
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="site-eyebrow text-orange-300">
                For retailers
              </p>
              <h2 className="site-section-heading mt-3 text-white">
                {homepage.retailer_heading}
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                {homepage.retailer_description}
              </p>
            </div>

            <Link
              href="/retailer"
              className="site-button site-button-primary shrink-0"
            >
              {homepage.retailer_button_label} →
            </Link>
          </div>
        </div>
      </section>}

    </main>
  );
}
