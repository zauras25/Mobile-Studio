"use client";

import Link from "next/link";
import ProductDetailClient from "@/components/ProductDetailClient";
import { useCatalog } from "@/components/CatalogProvider";

export default function ProductPageClient({ slug }: { slug: string }) {
  const { products, status, error } = useCatalog();
  const product = products.find((item) => item.slug === slug);

  if (product) {
    return <ProductDetailClient product={product} />;
  }

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">
        Loading product…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-black">Product not found</h1>
      <p className="mt-3 text-slate-500">
        {status === "error"
          ? `The live catalog could not be loaded. ${error}`
          : "This product may have been removed or is not published yet."}
      </p>
      <Link
        href="/search"
        className="site-button site-button-primary mt-6"
      >
        Browse products
      </Link>
    </main>
  );
}
