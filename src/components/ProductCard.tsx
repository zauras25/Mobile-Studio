"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useCatalog } from "@/components/CatalogProvider";
import ProductImage from "@/components/ProductImage";
import type { Product } from "@/data/store";
import { formatStorePrice, retailerPrice } from "@/lib/pricing";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCart();
  const { isRetailer } = useCatalog();
  const [added, setAdded] = useState(false);

  const inStock = product.stock > 0;

  const discounted =
    product.oldPrice > product.price && product.oldPrice > 0;

  const discount = discounted
    ? Math.round(
        ((product.oldPrice - product.price) / product.oldPrice) * 100
      )
    : 0;
  const hasRetailerDiscount = isRetailer && product.retailerDiscountPercent > 0;
  const discountedRetailerPrice = hasRetailerDiscount ? retailerPrice(product) : null;

  function handleAdd() {
    if (!inStock) return;

    addToCart(product, 1);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1600);
  }

  return (
    <article className="site-card group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
      <Link
        href={`/product/${product.slug}`}
        className="relative block overflow-hidden bg-slate-100"
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-square">
          <ProductImage
            src={product.image}
            alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>

        {discounted && (
          <span className="absolute left-3 top-3 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-black text-white shadow-sm">
            -{discount}%
          </span>
        )}

        {!inStock ? (
          <span className="absolute right-3 top-3 rounded-lg bg-slate-900/90 px-2.5 py-1.5 text-xs font-bold text-white">
            Sold Out
          </span>
        ) : product.stock <= 5 ? (
          <span className="absolute right-3 top-3 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700">
            Low Stock
          </span>
        ) : null}

        <span className="absolute bottom-3 left-3 rounded-lg border border-white/70 bg-white/90 px-2.5 py-1.5 text-xs font-bold text-slate-700 backdrop-blur">
          {product.quality}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-orange-600">
            {product.brand}
          </span>

          <span className="shrink-0 text-xs font-bold text-amber-500">
            ★ {product.rating}
          </span>
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="mt-2"
        >
          <h3 className="min-h-12 text-base font-extrabold leading-6 text-slate-900 transition group-hover:text-orange-600">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 text-xs text-slate-500">
          Model: {product.model}
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="text-xl font-black tracking-tight text-slate-950">
            Rs. {product.price.toLocaleString("en-PK")}
          </span>

          {discounted && (
            <span className="pb-0.5 text-xs font-medium text-slate-400 line-through">
              Rs. {product.oldPrice.toLocaleString("en-PK")}
            </span>
          )}
        </div>
        {hasRetailerDiscount && discountedRetailerPrice !== null && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-800">
              Retailer price · {product.retailerDiscountPercent}% off
            </p>
            <p className="mt-0.5 text-lg font-black text-emerald-900">{formatStorePrice(discountedRetailerPrice)}</p>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              inStock ? "bg-green-500" : "bg-red-500"
            }`}
          />

          <span className={inStock ? "text-green-700" : "text-red-600"}>
            {inStock
              ? `${product.stock} units available`
              : "Currently unavailable"}
          </span>
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {added ? (
              <>
                <span aria-hidden="true">✓</span>
                Added to Cart
              </>
            ) : inStock ? (
              <>
                <span aria-hidden="true">+</span>
                Add to Cart
              </>
            ) : (
              "Sold Out"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
