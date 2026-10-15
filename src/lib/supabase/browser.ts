import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null | undefined;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient !== undefined) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ""
  ).trim();

  if (!url || !key) {
    console.error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or public API key."
    );
    browserClient = null;
    return browserClient;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.protocol !== "https:" &&
      parsedUrl.hostname !== "localhost" &&
      parsedUrl.hostname !== "127.0.0.1"
    ) {
      console.error("[Supabase] The project URL must use HTTPS.");
      browserClient = null;
      return browserClient;
    }

    browserClient = createClient(url, key);
    return browserClient;
  } catch (error) {
    console.error("[Supabase] Client initialization failed:", error);
    browserClient = null;
    return browserClient;
  }
}
