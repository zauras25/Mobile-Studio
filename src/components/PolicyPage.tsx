"use client";

import Link from "next/link";
import { useCatalog } from "@/components/CatalogProvider";

type PolicyPageProps = {
  title: string;
  description: string;
  sections: {
    heading: string;
    paragraphs: string[];
  }[];
  confirmationItems: string[];
};

export default function PolicyPage({
  title,
  description,
  sections,
  confirmationItems,
}: PolicyPageProps) {
  const { settings } = useCatalog();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-600">{settings.storeName} · Store draft</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <h2 className="font-black">General store draft — review before launch</h2>
          <p className="mt-2 text-sm leading-6">
            This draft reflects the website&apos;s current customer and order flow, but it is not yet the store&apos;s final active policy. Confirm the listed business details and applicable legal requirements before relying on it for an order or request.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
            {confirmationItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-black tracking-tight">{section.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          For an active order, contact {settings.storeName} to confirm the applicable price, stock, compatibility, delivery, payment, or resolution directly.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/customer-care" className="ui-button-primary">Contact Customer Care</Link>
          <Link href="/faq" className="inline-flex min-h-11 items-center font-bold text-orange-700 hover:text-orange-800">Read FAQs</Link>
        </div>
      </article>
    </main>
  );
}
