"use client";

import Link from "next/link";
import { useCatalog } from "@/components/CatalogProvider";
import { categorySlug } from "@/data/store";

const linkClass = "text-sm text-slate-400 transition hover:text-orange-400";

export default function Footer() {
  const { categories, settings } = useCatalog();
  const whatsapp = settings.whatsapp.replace(/\D/g, "");
  const featuredCategories = categories.slice(0, 4);
  const socialLinks = [
    ["Instagram", settings.social.instagram],
    ["Facebook", settings.social.facebook],
    ["TikTok", settings.social.tiktok],
  ].filter(([, value]) => isHttpsUrl(value));

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-9 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl font-black">
              {settings.storeName.trim().charAt(0).toUpperCase() || "M"}
            </span>
            <span>
              <span className="block text-lg font-black">{settings.storeName}</span>
              <span className="block text-xs font-bold tracking-wider text-orange-400">
                MOBILE PARTS
              </span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
            Browse mobile spare parts by category, device brand and model. Check product details and availability before ordering.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-wider">Browse</h2>
          <nav aria-label="Browse links" className="mt-4 flex flex-col items-start gap-3">
            <Link className={linkClass} href="/search">All products</Link>
            {featuredCategories.map((category) => (
              <Link
                className={linkClass}
                href={`/shop/${categorySlug(category.name)}`}
                key={category.name}
              >
                {category.name}
              </Link>
            ))}
            <Link className="text-sm font-bold text-orange-400 hover:text-orange-300" href="/#categories">
              All categories →
            </Link>
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-wider">Help</h2>
          <nav aria-label="Help and policy links" className="mt-4 flex flex-col items-start gap-3">
            <Link className={linkClass} href="/customer-care">Contact &amp; FAQs</Link>
            <Link className={linkClass} href="/track-order">Track order</Link>
            <Link className={linkClass} href="/shipping-policy">Shipping</Link>
            <Link className={linkClass} href="/returns-policy">Returns</Link>
            <Link className={linkClass} href="/privacy-policy">Privacy</Link>
            <Link className={linkClass} href="/terms">Terms</Link>
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-wider">Contact</h2>
          <div className="mt-4 flex flex-col items-start gap-4">
            {settings.phone && (
              <a className={linkClass} href={`tel:${settings.phone}`}>
                Call: {settings.phone}
              </a>
            )}
            {settings.whatsapp && (
              <a
                className={linkClass}
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp: {settings.whatsapp}
              </a>
            )}
            {settings.supportEmail && (
              <a className={linkClass} href={`mailto:${settings.supportEmail}`}>
                {settings.supportEmail}
              </a>
            )}
            {socialLinks.map(([label, url]) => (
              <a
                className={linkClass}
                href={url}
                key={label}
                target="_blank"
                rel="noopener noreferrer"
              >
                {label}
              </a>
            ))}
            {!settings.phone &&
              !settings.whatsapp &&
              !settings.supportEmail &&
              socialLinks.length === 0 && (
              <p className="max-w-xs text-sm leading-6 text-slate-400">
                Visit Customer Care for current support options, FAQs and order information.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>{"\u00A9"} 2026 {settings.storeName}. All rights reserved.</p>
          <Link className="hover:text-slate-300" href="/retailer">
            Retailer enquiries
          </Link>
        </div>
      </div>
    </footer>
  );
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
