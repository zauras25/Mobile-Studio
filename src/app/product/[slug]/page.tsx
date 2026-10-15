import type { Metadata } from "next";
import { Suspense } from "react";
import type { Product } from "@/data/store";
import { products as fallbackProducts } from "@/data/store";
import { getPublicCatalogServerClient } from "@/lib/supabase/public-server";
import { SITE_URL } from "@/lib/site-config";
import ProductPageClient from "./ProductPageClient";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type ProductMetadata = Pick<
  Product,
  "name" | "brand" | "model" | "category" | "quality"
>;

async function getProductMetadata(slug: string): Promise<ProductMetadata | null> {
  const client = getPublicCatalogServerClient();
  if (!client) {
    const product = fallbackProducts.find((item) => item.slug === slug);
    return product ?? null;
  }

  const { data, error } = await client
    .from("products")
    .select("name,brand,model,category,quality")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()
    .returns<ProductMetadata>();

  if (error) {
    console.error(`[SEO] Could not load product metadata for "${slug}":`, error.message);
    const fallback = fallbackProducts.find((item) => item.slug === slug);
    return fallback ?? null;
  }

  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductMetadata(slug);

  if (!product) {
    return {
      title: "Mobile replacement parts",
      description: "Browse mobile parts by device brand, model and category.",
    };
  }

  const title = `${product.name} for ${product.model}`;
  const description = `${product.quality} ${product.category.toLowerCase()} for ${product.brand} ${product.model}. Review product details and current availability before ordering.`;

  return {
    title,
    description,
    keywords: [product.name, product.brand, product.model, product.category, "mobile repair parts"],
    alternates: {
      canonical: new URL(`/product/${encodeURIComponent(slug)}`, SITE_URL).toString(),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: new URL(`/product/${encodeURIComponent(slug)}`, SITE_URL).toString(),
    },
  };
}

export default function ProductPage({ params }: PageProps) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">Loading product…</main>}>
      <ProductRoute params={params} />
    </Suspense>
  );
}

async function ProductRoute({ params }: PageProps) {
  const { slug } = await params;
  return <ProductPageClient slug={slug} />;
}
