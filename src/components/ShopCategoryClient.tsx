"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCatalog } from "@/components/CatalogProvider";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard from "@/components/ProductCard";
import { categorySlug } from "@/data/store";

type Props = {
  category: string;
};

export default function ShopCategoryClient({ category }: Props) {
  const { products, categories, banners, settings, status, error: catalogError } = useCatalog();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [model, setModel] = useState("all");
  const [quality, setQuality] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const matchedCategory = categories.find(
    (item) => categorySlug(item.name) === category
  );

  const categoryProducts = useMemo(
    () => products.filter((product) => product.category === matchedCategory?.name),
    [matchedCategory?.name, products]
  );

  const brands = [...new Set(categoryProducts.map((p) => p.brand))];
  const models = [
    ...new Set(
      categoryProducts
        .filter((p) => brand === "all" || p.brand === brand)
        .map((p) => p.model)
    ),
  ];
  const qualities = [...new Set(categoryProducts.map((p) => p.quality))];

  const filteredProducts = useMemo(() => {
    let result = categoryProducts.filter((product) => {
      const term = search.trim().toLowerCase();

      const matchesSearch =
        !term ||
        `${product.name} ${product.brand} ${product.model} ${product.quality}`
          .toLowerCase()
          .includes(term);

      const matchesBrand = brand === "all" || product.brand === brand;
      const matchesModel = model === "all" || product.model === model;
      const matchesQuality = quality === "all" || product.quality === quality;

      const matchesStock =
        availability === "all" ||
        (availability === "in-stock" && product.stock > 0) ||
        (availability === "out-of-stock" && product.stock <= 0);

      const matchesMin =
        minPrice === "" || product.price >= Number(minPrice);
      const matchesMax =
        maxPrice === "" || product.price <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesBrand &&
        matchesModel &&
        matchesQuality &&
        matchesStock &&
        matchesMin &&
        matchesMax
      );
    });

    if (sort === "price-low") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sort === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [
    categoryProducts,
    search,
    brand,
    model,
    quality,
    availability,
    minPrice,
    maxPrice,
    sort,
  ]);

  const activeFilters = [
    brand !== "all",
    model !== "all",
    quality !== "all",
    availability !== "all",
    minPrice !== "",
    maxPrice !== "",
    search.trim() !== "",
  ].filter(Boolean).length;

  function resetFilters() {
    setSearch("");
    setBrand("all");
    setModel("all");
    setQuality("all");
    setAvailability("all");
    setMinPrice("");
    setMaxPrice("");
    setSort("featured");
  }

  function renderFilterControls() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-900">Brand</h3>
          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setModel("all");
            }}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All brands</option>
            {brands.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-900">
            Compatible model
          </h3>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All models</option>
            {models.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-900">Quality</h3>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All quality grades</option>
            {qualities.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-900">Price range (Rs.)</h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              placeholder="Minimum"
              aria-label="Minimum price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="min-w-0 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-500"
            />
            <input
              type="number"
              min="0"
              placeholder="Maximum"
              aria-label="Maximum price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="min-w-0 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-500"
            />
          </div>
          {minPrice !== "" && maxPrice !== "" &&
            Number(minPrice) > Number(maxPrice) && (
              <p className="mt-2 text-xs text-red-600">
                Minimum price cannot exceed maximum price.
              </p>
            )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-900">Availability</h3>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All products</option>
            <option value="in-stock">In stock</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="w-full rounded-xl border border-orange-200 px-4 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-50"
        >
          Reset all filters
        </button>
      </div>
    );
  }

  if (!matchedCategory) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900">
            Category not found
          </h1>
          <p className="mt-3 text-slate-500">
            Browse our mobile spare parts instead.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex rounded-xl bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600"
          >
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  if (!matchedCategory && status === "loading") {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">
        Loading category…
      </main>
    );
  }

  if (!matchedCategory) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black">Category not found</h1>
        <p className="mt-3 text-slate-500">
          {status === "error"
            ? `The available categories could not be loaded. ${catalogError}`
            : "This category may have been removed or is not visible right now."}
        </p>
        <Link
          href="/search"
          className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 font-black text-white"
        >
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <section className="border-b border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <Link href="/" className="transition hover:text-orange-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/search" className="transition hover:text-orange-600">Shop</Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-slate-900">
              {matchedCategory.name}
            </span>
          </nav>

          <div className="mt-7 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-700">
                {settings.storeName}
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                {matchedCategory.name}
                <span className="block text-orange-500">
                  Find the right part, faster.
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Find compatible mobile spare parts, compare prices and check
                product availability before placing your order.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-orange-50 text-xl text-orange-600">
                {matchedCategory.icon_image_url ? (
                  <img src={matchedCategory.icon_image_url} alt="" className="h-full w-full object-cover" />
                ) : matchedCategory.icon || "▦"}
              </span>
              <div>
                <p className="text-2xl font-black">{categoryProducts.length}</p>
                <p className="text-xs text-slate-500">Listed products</p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex max-w-2xl items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
            <span className="pl-3 text-xl text-slate-400" aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search part, brand, model or quality..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none sm:text-base"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      <BannerCarousel
        label="Category promotions"
        banners={banners.filter((banner) => banner.placement === "Category page")}
      />

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold text-orange-600">
              Shop / {matchedCategory.name}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Explore products
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Showing {filteredProducts.length} of {categoryProducts.length} products
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm transition hover:border-orange-300 lg:hidden"
              aria-haspopup="dialog"
            >
              <span aria-hidden="true">☷</span>
              Filters
              {activeFilters > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-xs text-white">
                  {activeFilters}
                </span>
              )}
            </button>

            <label className="flex items-center gap-2 text-sm">
              <span className="hidden text-slate-500 sm:inline">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="max-w-[190px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>
        </div>

        {activeFilters > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold text-slate-500">
              Active filters:
            </span>
            {brand !== "all" && (
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">{brand}</span>
            )}
            {model !== "all" && (
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">{model}</span>
            )}
            {quality !== "all" && (
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">{quality}</span>
            )}
            {availability !== "all" && (
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
                {availability === "in-stock" ? "In stock" : "Out of stock"}
              </span>
            )}
            {(minPrice !== "" || maxPrice !== "") && (
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
                Rs. {minPrice || "0"} – {maxPrice || "Any"}
              </span>
            )}
            {search.trim() && (
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
                Search: {search}
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="px-2 py-1 text-xs font-bold text-slate-500 underline hover:text-orange-600"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black">Filter products</h2>
              <p className="mt-1 text-xs text-slate-500">
                Refine your selection
              </p>
            </div>
            {renderFilterControls()}
          </aside>

          <div className="min-w-0">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div className="text-4xl text-orange-500" aria-hidden="true">⌕</div>
                <h2 className="mt-4 text-2xl font-black">
                  No matching products
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Try another search, widen your price range or reset the filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
        >
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 h-full w-full bg-slate-950/50"
          />

          <section className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-xl font-black">Filter products</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {filteredProducts.length} matching products
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filter panel"
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-xl hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {renderFilterControls()}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-white p-5">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600"
              >
                Show {filteredProducts.length}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
