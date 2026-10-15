"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function RetailerRegister() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    let uploadedDocumentPath: string | null = null;

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Retailer applications are unavailable because the store service is not configured.");
        return;
      }

      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "").trim().toLowerCase();
      if (!email || !formData.has("terms_accepted")) {
        setError("Enter your email address and accept the application terms before submitting.");
        return;
      }

      const documentFile = formData.get("required_document");
      if (!(documentFile instanceof File) || documentFile.size === 0) {
        setError("Upload your shop or business proof document to continue.");
        return;
      }

      const extensions: Record<string, string> = {
        "application/pdf": "pdf",
        "image/jpeg": "jpg",
        "image/png": "png",
      };
      const extension = extensions[documentFile.type];
      if (!extension || documentFile.size > 10 * 1024 * 1024) {
        setError("Choose a PDF, JPG or PNG business document up to 10 MB.");
        return;
      }

      uploadedDocumentPath = `applications/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("retailer-documents")
        .upload(uploadedDocumentPath, documentFile, {
          contentType: documentFile.type,
          upsert: false,
        });
      if (uploadError) {
        uploadedDocumentPath = null;
        setError(`Could not upload the business document: ${uploadError.message}`);
        return;
      }

      const { error: insertError } = await supabase.from("retailer_applications").insert({
        owner_name: String(formData.get("owner_name") ?? "").trim(),
        email,
        business_name: String(formData.get("business_name") ?? "").trim(),
        business_type: String(formData.get("business_type") ?? ""),
        phone: String(formData.get("phone") ?? "").trim(),
        address: String(formData.get("address") ?? "").trim(),
        city: String(formData.get("city") ?? "").trim(),
        business_details: String(formData.get("business_details") ?? "").trim(),
        required_document_path: uploadedDocumentPath,
        terms_accepted: true,
        status: "pending",
      });

      if (insertError) {
        throw new Error(`Could not submit your application: ${insertError.message}`);
      }

      uploadedDocumentPath = null;
      router.replace("/retailer/pending");
    } catch (submissionError) {
      const message = submissionError instanceof Error
        ? submissionError.message
        : "An unexpected error prevented the application from being submitted.";
      if (uploadedDocumentPath) {
        const supabase = getSupabaseBrowserClient();
        let cleanupMessage = "";
        if (supabase) {
          try {
            const { error: cleanupError } = await supabase.storage
              .from("retailer-documents")
              .remove([uploadedDocumentPath]);
            cleanupMessage = cleanupError?.message ?? "";
          } catch (cleanupError) {
            cleanupMessage = cleanupError instanceof Error
              ? cleanupError.message
              : "Unknown document cleanup error.";
          }
        } else {
          cleanupMessage = "The retailer document service is unavailable.";
        }
        setError(cleanupMessage
          ? `${message} The uploaded document could not be removed: ${cleanupMessage}`
          : message);
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
      <main className="site-container max-w-2xl py-14">
      <section>
        <div className="mb-8">
          <Link href="/retailer" className="text-sm font-bold text-orange-700 hover:text-orange-800">
            ← Retailer programme
          </Link>
          <p className="site-eyebrow mt-6">Retailer application</p>
          <h1 className="site-section-heading mt-2">Tell us about your business.</h1>
          <p className="site-copy mt-3">Complete the details below. The store will review your application and contact you about retailer access and ordering terms.</p>
        </div>

        <div className="site-card p-5 sm:p-8">
          <form onSubmit={submitApplication} aria-busy={busy} className="retailer-form grid gap-5">
            <label className="text-sm font-bold text-slate-700">
              Owner full name
              <input name="owner_name" required maxLength={120} autoComplete="name" className="mt-2 w-full rounded-xl border p-4" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Business contact email
              <input name="email" required type="email" maxLength={254} autoComplete="email" className="mt-2 w-full rounded-xl border p-4" />
              <span className="mt-1 block text-xs font-normal text-slate-500">Use the email you want associated with retailer account setup. Submitting this form does not create or sign in to an account.</span>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Shop / business name
              <input name="business_name" required maxLength={160} autoComplete="organization" className="mt-2 w-full rounded-xl border p-4" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Type of business
              <select name="business_type" required defaultValue="" className="mt-2 w-full rounded-xl border bg-white p-4">
                <option value="" disabled>Select your business type</option>
                <option value="repair_shop">Mobile repair shop</option>
                <option value="mobile_parts_retailer">Mobile parts retailer / wholesaler</option>
                <option value="online_seller">Online seller</option>
                <option value="other">Other related business</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Phone number
              <input name="phone" required maxLength={40} type="tel" autoComplete="tel" className="mt-2 w-full rounded-xl border p-4" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Shop address
              <input name="address" required maxLength={300} autoComplete="street-address" className="mt-2 w-full rounded-xl border p-4" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              City
              <input name="city" required maxLength={120} autoComplete="address-level2" className="mt-2 w-full rounded-xl border p-4" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              What parts or products are you interested in?
              <textarea name="business_details" maxLength={2000} placeholder="For example: screens, batteries, charging parts, brands/models, or the products you usually source." className="mt-2 min-h-32 w-full rounded-xl border p-4" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Shop/business proof document (required · PDF, JPG or PNG · max 10 MB)
              <input required name="required_document" type="file" accept="application/pdf,image/jpeg,image/png" className="mt-2 w-full rounded-xl border p-4" />
            </label>
            <label className="flex items-start gap-3 text-sm font-normal leading-6 text-slate-600">
              <input required name="terms_accepted" type="checkbox" value="true" className="mt-1 h-4 w-4 shrink-0 accent-orange-500" />
              <span>
                I confirm the information is accurate and allow the store to review my business proof for this application. I understand retailer access is subject to approval; pricing, minimum orders, payment, delivery, and return terms will be agreed separately before ordering. I have read the{" "}
                <Link href="/terms" target="_blank" className="font-bold text-orange-700 underline">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy-policy" target="_blank" className="font-bold text-orange-700 underline">Privacy Policy</Link>.
              </span>
            </label>
            <p className="text-xs leading-5 text-slate-500">Submitting an application does not create a login or send an authentication email. The store will contact you using the email or phone above after review.</p>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="site-button site-button-primary w-full disabled:cursor-not-allowed disabled:bg-slate-300">
              {busy ? "Submitting application…" : "Submit application"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already approved? <Link href="/retailer/login" className="font-bold text-orange-700">Sign in to your retailer account</Link>
        </p>
      </section>
      </main>
  );
}
