"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useCatalog } from "@/components/CatalogProvider";
import {
  calculateDeliveryCharge,
  findDeliveryRate,
  findLahoreLocalDeliveryRate,
} from "@/lib/delivery";
import {
  type CourierPreference,
  type FulfillmentMethod,
  type PaymentMethod,
  paymentMethods,
  normalizeSavedOrder,
} from "@/lib/orders";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type CustomerForm = {
  name: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  preferredCourier: CourierPreference | "";
  payment: PaymentMethod | "";
};

type CheckoutField = "name" | "phone" | "address" | "city" | "area" | "payment" | "courier";
type LocationStatus = "idle" | "requesting" | "looking-up" | "detected" | "error";

function CheckoutIcon({
  name,
  className = "h-5 w-5",
}: {
  name: "user" | "phone" | "pin" | "locate" | "truck" | "bag" | "shield" | "check";
  className?: string;
}) {
  const paths: Record<typeof name, ReactNode> = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.7a2 2 0 0 1-.6 1.8L7.7 9.5a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 1.8-.6l2.7.5a2 2 0 0 1 1.7 1.8Z" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    locate: <><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /></>,
    truck: <><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z" /><circle cx="7.5" cy="18.5" r="1.5" /><circle cx="17.5" cy="18.5" r="1.5" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
  };

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="p-8">Loading checkout...</main>}>
      <CheckoutForm />
    </Suspense>
  );
}

function CheckoutForm() {
  const { items: cartItems, clearCart } = useCart();
  const { settings } = useCatalog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const retailerCheckout = searchParams.get("type") === "retailer";
  const items = cartItems;
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("delivery");
  const [form, setForm] = useState<CustomerForm>({
    name: "",
    phone: "",
    address: "",
    city: "",
    area: "",
    preferredCourier: "",
    payment: "",
  });
  const isLahore = form.city.trim().toLocaleLowerCase() === "lahore";
  const selectedDeliveryRate =
    findDeliveryRate(settings.deliveryRates, form.city, form.area) ??
    (isLahore ? findLahoreLocalDeliveryRate(settings.deliveryRates) : null);
  const deliveryCharge = fulfillmentMethod === "store_pickup"
    ? 0
    : isLahore && selectedDeliveryRate
      ? calculateDeliveryCharge(selectedDeliveryRate, subtotal)
      : null;
  const total = deliveryCharge === null ? null : subtotal + deliveryCharge;

  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CheckoutField, string>>>({});
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);

  function updateField<K extends keyof CustomerForm>(field: K, value: CustomerForm[K]) {
    setForm((current) => field === "city"
      ? {
          ...current,
          city: String(value),
          area: "",
          preferredCourier: String(value).trim().toLocaleLowerCase() === "lahore" ? "store_choice" : "",
        }
      : { ...current, [field]: value });
    if (field === "city") {
      setFieldErrors((current) => ({ ...current, area: undefined }));
      setLocationStatus("idle");
      setLocationMessage("");
    }
    if (field === "name" || field === "phone" || field === "address" || field === "city" || field === "area" || field === "preferredCourier") {
      const errorField = field === "preferredCourier" ? "courier" : field;
      setFieldErrors((current) => ({ ...current, [errorField]: undefined }));
      setDetailsConfirmed(false);
    }
    setError("");
  }

  function validateField(field: CheckoutField, value: string) {
    const cleanValue = value.trim();
    if (field === "name") {
      if (cleanValue.length < 3) return "Enter your full name (at least 3 characters).";
      if (cleanValue.length > 120) return "Name must be 120 characters or fewer.";
    }
    if (field === "phone" && !/^03\d{9}$/.test(cleanValue.replace(/\D/g, ""))) {
      return "Enter an 11-digit Pakistani mobile number starting with 03.";
    }
    if (field === "address") {
      if (cleanValue.length < 10) return "Enter a complete address (at least 10 characters).";
      if (cleanValue.length > 500) return "Address must be 500 characters or fewer.";
    }
    if (field === "city") {
      if (cleanValue.length < 2) return "Enter your delivery city.";
      if (cleanValue.length > 120) return "City must be 120 characters or fewer.";
    }
    if (field === "area") {
      if (cleanValue.length < 2) return "Choose your delivery area.";
      if (cleanValue.length > 120) return "Area must be 120 characters or fewer.";
    }
    if (field === "courier" && !isLahore && !value) {
      return "Select a courier or postal service for delivery outside Lahore.";
    }
    if (field === "payment" && !paymentMethods.some((method) => method === cleanValue)) {
      return "Choose a payment method.";
    }
    return "";
  }

  function blurField(field: Exclude<CheckoutField, "courier">) {
    setFieldErrors((current) => ({
      ...current,
      [field]: validateField(field, form[field]),
    }));
  }

  function detectCity() {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationMessage("Location detection is not available in this browser. Enter your city below.");
      return;
    }

    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setLocationStatus("looking-up");
        try {
          const params = new URLSearchParams({
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
            localityLanguage: "en",
          });
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
          );
          if (!response.ok) {
            throw new Error(`City lookup returned status ${response.status}.`);
          }
          const result: unknown = await response.json();
          if (!result || typeof result !== "object") {
            throw new Error("The location service returned an invalid response.");
          }
          const location = result as Record<string, unknown>;
          const city = [location.city, location.locality].find(
            (value): value is string => typeof value === "string" && value.trim().length >= 2,
          );
          if (!city) {
            throw new Error("A city could not be identified from your location.");
          }
          updateField("city", city.trim().slice(0, 120));
          setFieldErrors((current) => ({ ...current, city: undefined }));
          setLocationStatus("detected");
          setLocationMessage(`City detected: ${city.trim()}. Please check it before placing the order.`);
        } catch (lookupError) {
          setLocationStatus("error");
          setLocationMessage(
            `Could not detect your city: ${lookupError instanceof Error ? lookupError.message : "Unknown error"} Enter it manually.`,
          );
        }
      },
      (locationError) => {
        setLocationStatus("error");
        setLocationMessage(
          locationError.code === locationError.PERMISSION_DENIED
            ? "Location permission was not granted. Enter your city manually."
            : "Could not read your location. Enter your city manually.",
        );
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (placing) {
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const name = form.name.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    const city = form.city.trim();
    const area = form.area.trim();
    const nextFieldErrors: Partial<Record<CheckoutField, string>> = {
      name: validateField("name", name),
      phone: validateField("phone", phone),
      ...(fulfillmentMethod === "delivery"
        ? {
            address: validateField("address", address),
            city: validateField("city", city),
            area: validateField("area", area),
          }
        : {}),
      ...(fulfillmentMethod === "delivery" && !isLahore
        ? { courier: validateField("courier", form.preferredCourier) }
        : {}),
      payment: validateField("payment", form.payment),
    };
    if (fulfillmentMethod === "delivery" && isLahore && !selectedDeliveryRate) {
      nextFieldErrors.area = "Lahore local delivery rate is not configured. Contact the store or choose pickup.";
    }
    setFieldErrors(nextFieldErrors);
    const invalidField = (Object.keys(nextFieldErrors) as CheckoutField[]).find(
      (field) => nextFieldErrors[field],
    );
    if (invalidField) {
      setError("Check the highlighted details before continuing.");
      document.getElementById(`checkout-${invalidField}`)?.focus();
      return;
    }
    if (!detailsConfirmed) {
      setError("Confirm that your contact and delivery details are correct.");
      document.getElementById("checkout-details-confirmed")?.focus();
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setPlacing(false);
      setError("Order service is not configured. Please contact the store; your order was not placed.");
      return;
    }

    setPlacing(true);
    let data: unknown;
    let createError: { message: string } | null;
    try {
      const result = await supabase.rpc("create_customer_order", {
        p_name: name,
        p_phone: phone,
        p_address: fulfillmentMethod === "store_pickup" ? "" : address,
        p_city: fulfillmentMethod === "store_pickup" ? "" : city,
        p_area: fulfillmentMethod === "store_pickup" ? "" : area,
        p_items: items.map(({ product, quantity }) => ({
          product_id: product.id,
          quantity,
        })),
        p_preferred_courier: fulfillmentMethod === "store_pickup" || isLahore ? "store_choice" : form.preferredCourier,
        p_fulfillment_method: fulfillmentMethod,
        p_expected_delivery: deliveryCharge,
        p_payment_method: form.payment,
      });
      data = result.data;
      createError = result.error;
    } catch (requestError) {
      setPlacing(false);
      setError(
        `Order could not be submitted: ${requestError instanceof Error ? requestError.message : "the order service could not be reached."}`,
      );
      return;
    }
    if (createError) {
      setPlacing(false);
      setError(`Order was not placed: ${createError.message}`);
      return;
    }

    const order = normalizeSavedOrder(data);
    if (!order) {
      setPlacing(false);
      setError("The store saved a response we could not verify. Contact the store with your phone number before retrying.");
      return;
    }
    clearCart();
    router.push(
      `/order-confirmation?order=${encodeURIComponent(order.trackingCode ?? order.orderNumber)}`,
    );
  }

  if (retailerCheckout) {
    return (
      <main className="min-h-[65vh] bg-slate-50 px-4 py-16">
        <section className="ui-card mx-auto max-w-2xl p-7 text-center sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">Retailer ordering</p>
          <h1 className="mt-3 text-3xl font-black">Wholesale checkout is not available yet</h1>
          <p className="mt-4 leading-7 text-slate-600">
            Retailer pricing and ordering terms have not been confirmed. No wholesale discount has been applied. Contact the store to discuss approved terms, or browse the catalog at its listed prices.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/retailer" className="ui-button-primary">Retailer information</Link>
            <Link href="/search" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 font-bold hover:border-orange-300 hover:text-orange-700">
              Browse listed prices
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-2xl">
            Cart
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Your cart is empty
          </h1>

          <p className="mt-3 text-slate-500">
            Add products before continuing to checkout.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-xl bg-orange-500 px-6 py-3 font-black text-white hover:bg-orange-600"
          >
            Start Shopping
          </Link>

        </div>
      </main>
    );
  }

  const inputClass = (field: CheckoutField) =>
    `mt-2 w-full rounded-xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white ${
      fieldErrors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-slate-200 focus:border-orange-500"
    }`;

  const courierOptions: { value: CourierPreference; label: string }[] = [
    { value: "store_choice", label: "Store chooses available service" },
    { value: "postex", label: "PostEx" },
    { value: "tcs", label: "TCS" },
    { value: "leopards", label: "Leopards Courier" },
    { value: "mnp", label: "M&P" },
    { value: "pakistan_post", label: "Pakistan Post" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            {settings.storeName} · Checkout
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            How would you like to receive your order?
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Choose delivery or store pickup, then add the relevant contact details. The store will confirm availability and payment before processing.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-2 text-orange-700"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100">1</span>Choose fulfillment</span>
            <span className="inline-flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200">2</span>Store confirmation</span>
            <span className="inline-flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200">3</span>Payment</span>
          </div>
        </header>

        <form noValidate onSubmit={submitOrder} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <section aria-labelledby="fulfillment-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700"><CheckoutIcon name="truck" /></span>
                <div>
                  <h2 id="fulfillment-heading" className="text-lg font-black text-slate-950">Choose how to receive it</h2>
                  <p className="mt-1 text-sm text-slate-500">You can have it delivered or collect it from the store.</p>
                </div>
              </div>
              <fieldset className="mt-5 grid gap-3 sm:grid-cols-2">
                <legend className="sr-only">Order fulfillment method</legend>
                {([
                  { value: "delivery", title: "Home delivery", description: "Enter your delivery address and courier preference.", icon: "truck" as const },
                  { value: "store_pickup", title: "Pick up at store", description: "Collect your order yourself; no delivery fee.", icon: "bag" as const },
                ] satisfies { value: FulfillmentMethod; title: string; description: string; icon: "truck" | "bag" }[]).map((option) => (
                  <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${fulfillmentMethod === option.value ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-orange-200"}`}>
                    <input type="radio" name="fulfillment-method" value={option.value}
                      checked={fulfillmentMethod === option.value}
                      onChange={() => { setFulfillmentMethod(option.value); setFieldErrors({}); setError(""); setDetailsConfirmed(false); }}
                      className="mt-1 h-4 w-4 accent-orange-600" />
                    <CheckoutIcon name={option.icon} className="mt-0.5 h-5 w-5 shrink-0 text-orange-700" />
                    <span>
                      <span className="block text-sm font-black text-slate-900">{option.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">{option.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </section>

            <section aria-labelledby="contact-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700"><CheckoutIcon name="user" /></span>
                <div>
                  <h2 id="contact-heading" className="text-lg font-black text-slate-950">
                    {fulfillmentMethod === "delivery" ? "Contact and delivery address" : "Contact for pickup"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {fulfillmentMethod === "delivery" ? "Required fields help the store verify and deliver your order." : "The store will contact you to confirm when your order is ready and where to collect it."}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="checkout-name" className="text-sm font-bold text-slate-800">Full name <span className="text-red-600">*</span></label>
                  <div className="relative">
                    <CheckoutIcon name="user" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="checkout-name" name="name" required autoComplete="name" maxLength={120} value={form.name}
                      onChange={(event) => updateField("name", event.target.value)} onBlur={() => blurField("name")}
                      placeholder="e.g. Ayesha Khan" aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "checkout-name-error" : undefined}
                      className={`${inputClass("name")} pl-10`} />
                  </div>
                  {fieldErrors.name && <p id="checkout-name-error" className="mt-1.5 text-xs font-medium text-red-700">{fieldErrors.name}</p>}
                </div>

                <div>
                  <label htmlFor="checkout-phone" className="text-sm font-bold text-slate-800">Mobile number <span className="text-red-600">*</span></label>
                  <div className="relative">
                    <CheckoutIcon name="phone" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="checkout-phone" name="tel" type="tel" inputMode="numeric" autoComplete="tel" required maxLength={11}
                      value={form.phone} onChange={(event) => updateField("phone", event.target.value.replace(/\D/g, "").slice(0, 11))}
                      onBlur={() => blurField("phone")} placeholder="03001234567" aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? "checkout-phone-error" : "checkout-phone-help"}
                      className={`${inputClass("phone")} pl-10`} />
                  </div>
                  {fieldErrors.phone
                    ? <p id="checkout-phone-error" className="mt-1.5 text-xs font-medium text-red-700">{fieldErrors.phone}</p>
                    : <p id="checkout-phone-help" className="mt-1.5 text-xs text-slate-500">11 digits, starting with 03.</p>}
                </div>

                {fulfillmentMethod === "delivery" && <div className="sm:col-span-2">
                  <label htmlFor="checkout-address" className="text-sm font-bold text-slate-800">Complete delivery address <span className="text-red-600">*</span></label>
                  <textarea id="checkout-address" name="street-address" required autoComplete="street-address" minLength={10} maxLength={500}
                    rows={3} value={form.address} onChange={(event) => updateField("address", event.target.value)}
                    onBlur={() => blurField("address")} placeholder="House/shop, street, area, and any nearby landmark"
                    aria-invalid={Boolean(fieldErrors.address)} aria-describedby={fieldErrors.address ? "checkout-address-error" : undefined}
                    className={`${inputClass("address")} resize-y`} />
                  {fieldErrors.address && <p id="checkout-address-error" className="mt-1.5 text-xs font-medium text-red-700">{fieldErrors.address}</p>}
                </div>}

                {fulfillmentMethod === "delivery" && <div className="sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="checkout-city" className="text-sm font-bold text-slate-800">City anywhere in Pakistan <span className="text-red-600">*</span></label>
                    <button type="button" onClick={detectCity} disabled={locationStatus === "requesting" || locationStatus === "looking-up"}
                      className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-bold text-orange-800 transition hover:bg-orange-50 disabled:cursor-wait disabled:opacity-60">
                      <CheckoutIcon name="locate" className="h-4 w-4" />
                      {locationStatus === "requesting" ? "Waiting for permission…" : locationStatus === "looking-up" ? "Finding city…" : "Detect my city"}
                    </button>
                  </div>
                  <div className="relative">
                    <CheckoutIcon name="pin" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="checkout-city" name="address-level2" required autoComplete="address-level2" maxLength={120}
                      value={form.city} onChange={(event) => updateField("city", event.target.value)} onBlur={() => blurField("city")}
                      placeholder="e.g. Lahore, Karachi, Islamabad"
                      aria-invalid={Boolean(fieldErrors.city)}
                      aria-describedby={fieldErrors.city ? "checkout-city-error" : "checkout-location-help"}
                      className={`${inputClass("city")} pl-10`} />
                  </div>
                  <p id={fieldErrors.city ? "checkout-city-error" : "checkout-location-help"}
                    aria-live="polite" className={`mt-1.5 text-xs leading-5 ${fieldErrors.city || locationStatus === "error" ? "font-medium text-red-700" : locationStatus === "detected" ? "font-medium text-emerald-700" : "text-slate-500"}`}>
                    {fieldErrors.city || locationMessage || "Enter any Pakistani city. Lahore is served by local delivery; other cities are delivered through the courier/post service you select. The store confirms out-of-city delivery charges before payment."}
                  </p>
                </div>}

                {fulfillmentMethod === "delivery" && <div className="sm:col-span-2">
                  <label htmlFor="checkout-area" className="text-sm font-bold text-slate-800">Area / locality / society <span className="text-red-600">*</span></label>
                  <input id="checkout-area" name="delivery-area" required maxLength={120} value={form.area}
                    onChange={(event) => updateField("area", event.target.value)}
                    onBlur={() => blurField("area")} aria-invalid={Boolean(fieldErrors.area)}
                    aria-describedby={fieldErrors.area ? "checkout-area-error" : "checkout-area-help"}
                    placeholder="Enter your area, town or locality"
                    className={inputClass("area")} />
                  <p id={fieldErrors.area ? "checkout-area-error" : "checkout-area-help"}
                    className={`mt-1.5 text-xs leading-5 ${fieldErrors.area ? "font-medium text-red-700" : selectedDeliveryRate ? "font-medium text-emerald-700" : "text-slate-500"}`}>
                    {fieldErrors.area || (isLahore && selectedDeliveryRate
                      ? `Lahore local delivery: Rs. ${deliveryCharge?.toLocaleString()} flat.`
                      : !isLahore && form.city.trim()
                        ? "Nationwide courier/post charges are confirmed by the store after you submit the order request."
                        : "Enter your locality so the delivery team can route your order.")}
                  </p>
                </div>}
              </div>
            </section>

            <section aria-labelledby="payment-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 id="payment-heading" className="text-lg font-black text-slate-950">Choose a payment method</h2>
              <p className="mt-1 text-sm text-slate-500">The store will confirm payment details before processing your order. No payment is taken now.</p>
              <label htmlFor="checkout-payment" className="mt-5 block text-sm font-bold text-slate-800">Payment method <span className="text-red-600">*</span></label>
              <select
                id="checkout-payment"
                name="payment-method"
                required
                value={form.payment}
                onChange={(event) => updateField("payment", paymentMethods.find((method) => method === event.target.value) ?? "")}
                aria-invalid={Boolean(fieldErrors.payment)}
                aria-describedby={fieldErrors.payment ? "checkout-payment-error" : undefined}
                className={`${inputClass("payment")} ${fieldErrors.payment ? "border-red-400 focus:border-red-500" : ""}`}
              >
                <option value="">Select a payment method</option>
                {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
              {fieldErrors.payment && <p id="checkout-payment-error" className="mt-1.5 text-xs font-medium text-red-700">{fieldErrors.payment}</p>}
            </section>

            {fulfillmentMethod === "delivery" && <section aria-labelledby="delivery-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><CheckoutIcon name="truck" /></span>
                <div>
                  <h2 id="delivery-heading" className="text-lg font-black text-slate-950">Delivery preference</h2>
                  <p className="mt-1 text-sm text-slate-500">Choose a preference, or let the store select an available courier.</p>
                </div>
              </div>
              {isLahore ? (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-black text-emerald-900">Lahore local delivery</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Courier/post selection is not needed for Lahore. {deliveryCharge === null
                      ? "The local delivery charge is not configured yet; contact the store or choose pickup."
                      : `Local delivery charge is Rs. ${deliveryCharge.toLocaleString()}.`} The store will coordinate delivery.
                  </p>
                </div>
              ) : (
                <>
              <label htmlFor="preferred-courier" className="mt-5 block text-sm font-bold text-slate-800">Choose courier / postal service <span className="text-red-600">*</span></label>
              <select id="preferred-courier" required value={form.preferredCourier}
                onChange={(event) => {
                  const option = courierOptions.find(({ value }) => value === event.target.value);
                  if (option) updateField("preferredCourier", option.value);
                }}
                aria-invalid={Boolean(fieldErrors.courier)}
                aria-describedby={fieldErrors.courier ? "checkout-courier-error" : undefined}
                className={`${inputClass("courier")}`}>
                <option value="">Select your delivery service</option>
                {courierOptions.filter(({ value }) => value !== "store_choice").map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
              {fieldErrors.courier && <p id="checkout-courier-error" className="mt-1.5 text-xs font-medium text-red-700">{fieldErrors.courier}</p>}
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Nationwide delivery is available across Pakistan. This is a request, not a booking; courier coverage and delivery charge are confirmed by the store. The payable total remains pending until confirmed.
              </p>
                </>
              )}
            </section>}

            {fulfillmentMethod === "store_pickup" && <section aria-labelledby="pickup-heading" className="rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700"><CheckoutIcon name="pin" /></span>
                <div>
                  <h2 id="pickup-heading" className="text-lg font-black text-slate-950">Pickup details are confirmed by the store</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">There is no delivery charge for store pickup. The store will contact you to confirm the pickup address and when your items are ready. Please wait for that confirmation before travelling.</p>
                </div>
              </div>
            </section>}

            <section aria-labelledby="confirmation-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckoutIcon name="shield" /></span>
                <div>
                  <h2 id="confirmation-heading" className="text-lg font-black text-slate-950">Before you submit</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Your order is a request for the store to review. Payment is not collected at this step; the store confirms stock, final delivery cost, and payment details with you.</p>
                </div>
              </div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-5 text-slate-700">
                <input id="checkout-details-confirmed" type="checkbox" checked={detailsConfirmed}
                  onChange={(event) => { setDetailsConfirmed(event.target.checked); setError(""); }}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-orange-600" />
                <span>
                  I confirm that my name and mobile number are correct
                  {fulfillmentMethod === "delivery" ? " and my delivery address is complete." : "."}
                </span>
              </label>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckoutIcon name="bag" className="h-5 w-5 text-orange-700" />
                <h2 className="text-lg font-black text-slate-950">Order summary</h2>
              </div>
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-black text-orange-800">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-5 text-slate-900">{product.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{product.model} · Qty {quantity}</p>
                    <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Listed quality: {product.quality}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-bold text-slate-900">
                    Rs. {(product.price * quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              Quality is shown as listed for each product; confirm model compatibility and final product details with the store before payment.
            </p>

            <div className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm">
              <div className="flex justify-between gap-4 text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-600">
                <span>
                  {fulfillmentMethod === "store_pickup"
                    ? "Store pickup"
                    : selectedDeliveryRate
                      ? `Delivery · ${selectedDeliveryRate.zone}`
                      : "Delivery"}
                </span>
                <span className="text-right font-bold text-slate-900">
                  {fulfillmentMethod === "store_pickup" ? "FREE" : deliveryCharge === null ? "To be confirmed" : deliveryCharge === 0 ? "FREE" : `Rs. ${deliveryCharge.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
                <span className="font-black text-slate-900">{total === null ? "Subtotal before delivery" : "Estimated total"}</span>
                <span className="text-right text-xl font-black text-slate-950">
                  {total === null ? `Rs. ${subtotal.toLocaleString()}` : `Rs. ${total.toLocaleString()}`}
                </span>
              </div>
              <p className="text-xs leading-5 text-slate-500">Final payable amount is confirmed by the store before payment.</p>
            </div>

            {error && (
              <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={placing}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 font-black text-white transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60">
              {placing ? "Submitting order…" : <>Submit order request <CheckoutIcon name="check" className="h-5 w-5" /></>}
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              No online payment is taken when you submit this request.
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}
