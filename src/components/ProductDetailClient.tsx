"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { categorySlug, type Product } from "@/data/store";
import {
  getDevelopmentMockAccount,
  isDevelopmentAuthMockEnabled,
  subscribeToDevelopmentMockAccount,
} from "@/lib/auth/development-mock";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useCatalog } from "@/components/CatalogProvider";
import { formatStorePrice, retailerPrice } from "@/lib/pricing";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import ProductImage from "@/components/ProductImage";

type Props = {
  product: Product;
};

type ProductReview = {
  id: number;
  rating: number;
  is_demo: boolean;
};

export default function ProductDetailClient({ product }: Props) {
  const { addToCart } = useCart();
  const { isRetailer, retailerAccessError, settings } = useCatalog();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [accountName, setAccountName] = useState("");
  const [developmentAccountEmail, setDevelopmentAccountEmail] = useState("");
  const [developmentDemoRating, setDevelopmentDemoRating] = useState<number | null>(null);
  const [identityLoading, setIdentityLoading] = useState(
    () => !isDevelopmentAuthMockEnabled() && Boolean(getSupabaseBrowserClient()),
  );
  const [hasAuthenticatedSession, setHasAuthenticatedSession] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const canChooseRating =
    isDevelopmentAuthMockEnabled()
      ? Boolean(developmentAccountEmail)
      : hasAuthenticatedSession && !identityLoading;

  const inStock = product.stock > 0;
  const maxQuantity = Math.max(1, product.stock);
  const discounted = product.oldPrice > product.price && product.oldPrice > 0;
  const discount = discounted
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const formatPrice = (price: number) =>
    `Rs. ${price.toLocaleString("en-PK")}`;

  function handleAdd() {
    if (!inStock) return;
    addToCart(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  const loadReviews = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setReviewError("Reviews are unavailable because Supabase is not configured.");
      return;
    }
    const { data, error: queryError } = await supabase
      .from("reviews")
      .select("id,rating,is_demo")
      .eq("product_id", product.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .returns<ProductReview[]>();

    if (queryError) {
      setReviewError(`Could not load reviews: ${queryError.message}`);
      return;
    }
    setReviews(data);
    setReviewError("");
  }, [product.id]);

  useEffect(() => {
    void Promise.resolve().then(loadReviews);
  }, [loadReviews]);

  useEffect(() => {
    if (!isDevelopmentAuthMockEnabled()) return;

    const syncDevelopmentAccount = () => {
      try {
        const account = getDevelopmentMockAccount();
        setDevelopmentAccountEmail(account?.email ?? "");
        setAccountName(account?.fullName ?? "");
        if (!account) {
          setDevelopmentDemoRating(null);
          setReviewRating(0);
          return;
        }

        const storageKey = `mobile-studio-development-rating:${encodeURIComponent(account.email.toLowerCase())}:${product.id}`;
        const storedRating = window.localStorage.getItem(storageKey);
        if (storedRating === null) {
          setDevelopmentDemoRating(null);
          return;
        }
        const rating = Number(storedRating);
        if (!Number.isFinite(rating) || rating < 0.5 || rating > 5 || rating * 2 !== Math.trunc(rating * 2)) {
          throw new Error("The saved development rating is invalid. Clear this site's local storage and try again.");
        }
        setDevelopmentDemoRating(rating);
      } catch (error) {
        setReviewError(
          error instanceof Error
            ? error.message
            : "Could not load the development demo rating.",
        );
      }
    };

    syncDevelopmentAccount();
    return subscribeToDevelopmentMockAccount(syncDevelopmentAccount);
  }, [product.id]);

  useEffect(() => {
    let active = true;
    if (isDevelopmentAuthMockEnabled()) return;

    const supabase = getSupabaseBrowserClient();

    if (!supabase) return;
    const client = supabase;

    async function loadAccountName() {
      try {
        const { data, error: authError } = await client.auth.getSession();
        if (!active) return;

        if (authError) {
          setReviewError(`Could not verify your account: ${authError.message}`);
          return;
        }

        const user = data.session?.user;
        setHasAuthenticatedSession(Boolean(user));
        const metadataName = [
          user?.user_metadata.full_name,
          user?.user_metadata.name,
          user?.user_metadata.display_name,
        ].find((value): value is string => typeof value === "string" && value.trim().length > 0);
        const name = metadataName?.trim() || user?.email?.trim() || "";
        setAccountName(name.slice(0, 120));
      } catch (error) {
        if (active) {
          setReviewError(
            `Could not verify your account: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      } finally {
        if (active) setIdentityLoading(false);
      }
    }

    void loadAccountName();
    return () => {
      active = false;
    };
  }, []);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reviewRating === 0) {
      setReviewError("Choose a rating before submitting.");
      return;
    }
    setReviewBusy(true);
    setReviewError("");
    setReviewNotice("");

    if (isDevelopmentAuthMockEnabled()) {
      if (!developmentAccountEmail) {
        setReviewError("Sign in to a development account before choosing a demo rating.");
        setReviewBusy(false);
        return;
      }
      try {
        const storageKey = `mobile-studio-development-rating:${encodeURIComponent(developmentAccountEmail.toLowerCase())}:${product.id}`;
        window.localStorage.setItem(storageKey, String(reviewRating));
        setDevelopmentDemoRating(reviewRating);
        setReviewRating(0);
        setReviewNotice(
          `Demo rating saved: ${reviewRating.toFixed(1)} / 5. It is visible only in this browser and was not sent to the store.`,
        );
      } catch (error) {
        setReviewError(
          `Could not save the browser-only demo rating: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
      setReviewBusy(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setReviewError("Supabase is not configured. Your review has not been submitted.");
      setReviewBusy(false);
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      setReviewError(`Could not verify your account: ${sessionError.message}`);
      setReviewBusy(false);
      return;
    }

    const user = sessionData.session?.user;
    if (!user) {
      setHasAuthenticatedSession(false);
      setReviewError("Sign in to a customer account before submitting a rating.");
      setReviewBusy(false);
      return;
    }

    const metadataName = [
      user.user_metadata.full_name,
      user.user_metadata.name,
      user.user_metadata.display_name,
    ].find((value): value is string => typeof value === "string" && value.trim().length > 0);
    const name = metadataName?.trim() || user.email?.trim();
    if (!name) {
      setReviewError("Your account does not have a name or email to attach to this rating.");
      setReviewBusy(false);
      return;
    }

    const { error: insertError } = await supabase.from("reviews").insert({
      product_id: product.id,
      reviewer_name: name,
      rating: reviewRating,
      review_text: "",
      status: "pending",
    });

    if (insertError) {
      setReviewError(`Could not submit your review: ${insertError.message}`);
    } else {
      setReviewRating(0);
      setReviewNotice("Thanks for your rating. It will appear after moderation.");
    }
    setReviewBusy(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="transition hover:text-orange-600">Home</Link>
          <span>/</span>
          <Link href="/search" className="transition hover:text-orange-600">Shop</Link>
          <span>/</span>
          <Link href={`/shop/${categorySlug(product.category)}`} className="transition hover:text-orange-600">
            {product.category}
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900">{product.name}</span>
        </nav>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <section>
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
              <div className="absolute left-5 top-5 z-10 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                  {product.quality} Quality
                </span>
                {discounted && (
                  <span className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-white">
                    Save {discount}%
                  </span>
                )}
              </div>

              <div className="relative aspect-square">
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-contain p-5 transition duration-500 hover:scale-105 sm:p-10"
                />
              </div>

              <div className="absolute bottom-5 right-5 rounded-xl border border-slate-100 bg-white/95 px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
                SKU: {product.id}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: "✓", title: "Quality", text: "Grade shown" },
                { icon: "◇", title: "Compatibility", text: product.model },
                { icon: "↗", title: "Ordering", text: "Easy checkout" },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-white p-3 text-center sm:p-4">
                  <span className="text-xl font-black text-orange-500">{item.icon}</span>
                  <p className="mt-1 text-xs font-extrabold sm:text-sm">{item.title}</p>
                  <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8 lg:p-9">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
              {settings.storeName} · {product.brand}
            </p>

            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              {product.name}
            </h1>

            <form
              id="quick-rating"
              onSubmit={submitReview}
              className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">Rate this product</h2>
                  <p className="mt-1 text-xs text-slate-600">
                    {isDevelopmentAuthMockEnabled()
                      ? developmentAccountEmail
                        ? `Browser-only demo rating for ${accountName || developmentAccountEmail}.`
                        : "Sign in to rate. Guest ratings are disabled."
                      : accountName
                        ? `Rating as ${accountName}`
                        : "Sign in to a customer account to rate this product."}
                  </p>
                </div>
                <fieldset>
                  <legend className="sr-only">Choose your rating</legend>
                  <div role="group" aria-label="Choose a rating in half-star increments" className="flex items-center">
                    {[0, 1, 2, 3, 4].map((index) => {
                      const halfRating = index + 0.5;
                      const fullRating = index + 1;
                      const fill = Math.max(0, Math.min(1, reviewRating - index));
                      return (
                        <span key={index} className="relative inline-block h-9 w-8">
                          <span aria-hidden="true" className="pointer-events-none absolute inset-0 text-center text-3xl leading-9 text-slate-300">☆</span>
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-3xl leading-9 text-amber-500"
                            style={{ width: `${fill * 100}%` }}
                          >
                            ★
                          </span>
                          <button
                            type="button"
                            aria-label={`${halfRating} stars`}
                            aria-pressed={reviewRating === halfRating}
                            disabled={!canChooseRating}
                            onClick={() => setReviewRating(halfRating)}
                            className="absolute inset-y-0 left-0 w-1/2 rounded-l focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            aria-label={`${fullRating} ${fullRating === 1 ? "star" : "stars"}`}
                            aria-pressed={reviewRating === fullRating}
                            disabled={!canChooseRating}
                            onClick={() => setReviewRating(fullRating)}
                            className="absolute inset-y-0 right-0 w-1/2 rounded-r focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed"
                          />
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-right text-xs font-semibold text-slate-600">
                    {reviewRating ? `${reviewRating.toFixed(1)} / 5` : "Choose a rating"}
                  </p>
                </fieldset>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  disabled={
                    reviewBusy ||
                    reviewRating === 0 ||
                    !canChooseRating
                  }
                  className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {reviewBusy
                    ? "Submitting…"
                    : isDevelopmentAuthMockEnabled()
                      ? canChooseRating
                        ? "Save demo rating"
                        : "Sign in to rate"
                      : canChooseRating
                        ? "Submit rating"
                        : "Sign in to rate"}
                </button>
                {!canChooseRating && (
                  <Link href="/account" className="text-sm font-bold text-orange-700 hover:text-orange-800">
                    Sign in or create an account
                  </Link>
                )}
                {isDevelopmentAuthMockEnabled() && developmentDemoRating !== null && (
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    Your saved demo rating:
                    <StarRatingDisplay rating={developmentDemoRating} className="text-amber-500" />
                    <span>{developmentDemoRating.toFixed(1)} / 5 (this browser only)</span>
                  </p>
                )}
                {reviewNotice && (
                  <p role="status" className="text-sm font-semibold text-emerald-700">{reviewNotice}</p>
                )}
              </div>
            </form>
            {reviewError && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {reviewError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="#quick-rating"
                className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
              >
                {reviews.some((review) => !review.is_demo) ? (
                  <>
                    <StarRatingDisplay rating={reviews.filter((review) => !review.is_demo).reduce((total, review) => total + review.rating, 0) / reviews.filter((review) => !review.is_demo).length} className="text-amber-500" />
                    {(reviews.filter((review) => !review.is_demo).reduce((total, review) => total + review.rating, 0) / reviews.filter((review) => !review.is_demo).length).toFixed(1)}
                    <span className="font-medium text-amber-800">
                      ({reviews.filter((review) => !review.is_demo).length} {reviews.filter((review) => !review.is_demo).length === 1 ? "review" : "reviews"})
                    </span>
                  </>
                ) : reviews.some((review) => review.is_demo) ? (
                  "Demo review preview · no customer reviews yet"
                ) : (
                  "No reviews yet · Be the first"
                )}
              </a>
              <span className="text-sm text-slate-600">Model: {product.model}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {inStock ? "● In Stock" : "● Sold Out"}
              </span>
            </div>

            <div className="mt-7 rounded-2xl bg-slate-50 p-5">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-black tracking-tight sm:text-4xl">
                  {formatPrice(product.price)}
                </span>
                {discounted && (
                  <span className="pb-1 text-sm text-slate-400 line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
              </div>
              {discounted && (
                <p className="mt-2 text-sm font-bold text-emerald-700">
                  You save {formatPrice(product.oldPrice - product.price)} ({discount}% off)
                </p>
              )}
              {isRetailer && product.retailerDiscountPercent > 0 && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-800">
                    Retailer price · {product.retailerDiscountPercent}% off
                  </p>
                  <p className="mt-1 text-2xl font-black text-emerald-900">
                    {formatStorePrice(retailerPrice(product))}
                  </p>
                  <p className="mt-1 text-xs text-emerald-800">
                    Listed price: {formatStorePrice(product.price)}
                  </p>
                </div>
              )}
              {retailerAccessError && (
                <p role="status" className="mt-3 text-xs text-amber-800">
                  Retailer pricing could not be verified: {retailerAccessError}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Prices are displayed in Pakistani Rupees.
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-base font-extrabold">Product information</h2>
              <dl className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
                {[
                  ["Brand", product.brand],
                  ["Compatible model", product.model],
                  ["Category", product.category],
                  ["Quality grade", product.quality],
                  ["Availability", inStock ? `${product.stock} units available` : "Out of stock"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="text-right text-sm font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-6">
              <label htmlFor="product-quantity" className="mb-3 block text-sm font-extrabold">
                Quantity
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex h-12 w-fit items-center rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={!inStock || quantity <= 1}
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="h-full w-11 rounded-l-xl text-xl font-bold hover:bg-slate-50 disabled:opacity-40"
                  >
                    −
                  </button>
                  <input
                    id="product-quantity"
                    aria-label="Product quantity"
                    type="number"
                    min={1}
                    max={maxQuantity}
                    disabled={!inStock}
                    value={quantity}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isFinite(value)) {
                        setQuantity(Math.min(maxQuantity, Math.max(1, Math.floor(value || 1))));
                      }
                    }}
                    className="h-full w-14 border-x border-slate-200 text-center font-bold outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={!inStock || quantity >= maxQuantity}
                    onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                    className="h-full w-11 rounded-r-xl text-xl font-bold hover:bg-slate-50 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!inStock}
                  className="min-h-12 flex-1 rounded-xl bg-orange-500 px-5 py-3 font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {!inStock ? "Currently Unavailable" : added ? "✓ Added to Cart" : "Add to Cart →"}
                </button>
              </div>

              {added && (
                <p role="status" aria-live="polite" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                  Product added to your cart successfully.
                </p>
              )}

              <Link href="/cart" className="mt-3 flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700">
                View Shopping Cart
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm font-bold text-orange-700">
              <Link href="/customer-care" className="hover:text-orange-800">
                Contact Customer Support →
              </Link>
              <Link href="/shipping-policy" className="hover:text-orange-800">
                Shipping details
              </Link>
              <Link href="/returns-policy" className="hover:text-orange-800">
                Returns &amp; warranty
              </Link>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">Shop with confidence</p>
          <h2 className="mt-2 text-2xl font-black">Before you place your order</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="font-extrabold">Check compatibility</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Verify your exact phone model before buying a replacement part.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="font-extrabold">Review quantity</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Choose the required quantity and review your cart before checkout.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="font-extrabold">Get assistance</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Contact customer support if you need help identifying the right part.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
