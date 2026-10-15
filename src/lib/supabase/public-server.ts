import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicClient: SupabaseClient | null | undefined;

export function getPublicCatalogServerClient(): SupabaseClient | null {
  if (publicClient !== undefined) return publicClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ""
  ).trim();

  if (!url || !key) {
    publicClient = null;
    return publicClient;
  }

  try {
    const parsedUrl = new URL(url);
    if (
      parsedUrl.protocol !== "https:" &&
      parsedUrl.hostname !== "localhost" &&
      parsedUrl.hostname !== "127.0.0.1"
    ) {
      throw new Error("The public Supabase project URL must use HTTPS.");
    }

    publicClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.error(
      "[Supabase] Public server client initialization failed:",
      error,
    );
    publicClient = null;
  }

  return publicClient;
}
