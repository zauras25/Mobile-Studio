"use client";

import Link from "next/link";

const applicationSteps = [
  {
    number: "01",
    title: "Share your business details",
    description: "Tell us about your shop, your contact information and the parts you source.",
  },
  {
    number: "02",
    title: "Submit your application",
    description: "Upload one shop or business proof document and accept the application terms.",
  },
  {
    number: "03",
    title: "Review and agree terms",
    description: "The store reviews your application. Pricing, minimum orders and delivery are confirmed before ordering.",
  },
  {
    number: "04",
    title: "Set up approved access",
    description: "If approved, follow the secure email link to set up your retailer account.",
  },
];

export default function RetailerPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="retailer-hero">
        <div className="site-container grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.8fr)]">
          <div className="max-w-3xl">
            <p className="site-eyebrow text-orange-300">Retailer programme</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Parts sourcing, made clearer for your business.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              Apply for retailer access to discuss business ordering. We review each application before enabling an account, and confirm pricing and order terms with you before you buy.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/retailer/register"
                className="site-button site-button-primary"
              >
                Start retailer application
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/retailer/login"
                className="site-button border border-white/25 bg-white/5 text-white hover:bg-white/10"
              >
                Sign in to retailer account
              </Link>
            </div>
          </div>

          <aside className="retailer-hero-card" aria-label="Application information">
            <p className="text-sm font-bold text-orange-200">Before you apply</p>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-100">
              <li className="flex gap-3">
                <span aria-hidden="true" className="font-bold text-orange-300">01</span>
                <span>Applications are reviewed before retailer access is approved.</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="font-bold text-orange-300">02</span>
                <span>Have your shop details and a PDF, JPG or PNG business proof ready (up to 10 MB).</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="font-bold text-orange-300">03</span>
                <span>Prices, minimum quantities, payment and delivery terms are confirmed with the store.</span>
              </li>
            </ul>
            <p className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-slate-300">
              Submitting an application does not create an account or commit you to an order.
            </p>
          </aside>
        </div>
      </section>

      <section className="site-container site-section">
        <div className="max-w-2xl">
          <p className="site-eyebrow">A straightforward process</p>
          <h2 className="site-section-heading mt-3">
            Know what happens after you apply.
          </h2>
          <p className="site-copy mt-3">
            Each step is clear, so you know what information to prepare and when account access becomes available.
          </p>
        </div>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {applicationSteps.map((step) => (
            <li key={step.number} className="retailer-step">
              <span className="retailer-step-number">{step.number}</span>
              <h3 className="mt-5 text-lg font-bold leading-snug">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:flex-row sm:items-center sm:p-7">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ready to request retailer access?</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Have your business information ready so you can complete the form in one go.
            </p>
          </div>
          <Link href="/retailer/register" className="site-button site-button-primary shrink-0">
            Apply now
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
