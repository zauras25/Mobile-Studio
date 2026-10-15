import { categories, categorySlug } from "@/data/store";
import { getPublicCatalogServerClient } from "@/lib/supabase/public-server";
import { SITE_URL } from "@/lib/site-config";

const basePublicPaths = [
  "/",
  "/search",
  "/customer-care",
  "/faq",
  "/shipping-policy",
  "/returns-policy",
  "/privacy-policy",
  "/terms",
  "/retailer",
  "/track-order",
];

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const client = getPublicCatalogServerClient();
  let categoryNames = categories.map((category) => category.name);
  const productSlugs: string[] = [];

  if (client) {
    const { data: liveCategories, error: categoryError } = await client
      .from("categories")
      .select("name")
      .eq("is_enabled", true)
      .order("sort_order");
    if (categoryError) {
      console.error("[SEO] Could not load categories for sitemap:", categoryError.message);
    } else {
      categoryNames = liveCategories.map((category) => category.name);
    }

    for (let offset = 0; offset < 50_000; offset += 1_000) {
      const { data, error } = await client
        .from("products")
        .select("slug")
        .eq("is_published", true)
        .order("slug")
        .range(offset, offset + 999);
      if (error) {
        console.error("[SEO] Could not load products for sitemap:", error.message);
        break;
      }

      productSlugs.push(...data.map((product) => product.slug));
      if (data.length < 1_000) break;
    }
  }

  const paths = new Set([
    ...basePublicPaths,
    ...categoryNames.map((name) => `/shop/${categorySlug(name)}`),
    ...productSlugs.map((slug) => `/product/${encodeURIComponent(slug)}`),
  ]);
  const urls = [...paths]
    .map((path) => `  <url><loc>${xmlEscape(new URL(path, SITE_URL).toString())}</loc></url>`)
    .join("\n");
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
