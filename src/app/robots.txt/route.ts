import { SITE_URL } from "@/lib/site-config";

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /account",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /my-orders",
    "Disallow: /order-confirmation",
    "Disallow: /retailer/dashboard",
    "Disallow: /retailer/orders",
    "Disallow: /retailer/pending",
    "Disallow: /retailer/setup-password",
    `Sitemap: ${new URL("/sitemap.xml", SITE_URL).toString()}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
