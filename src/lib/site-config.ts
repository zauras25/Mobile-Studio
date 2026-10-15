export const STORE_NAME = "Umar Mobile Parts";
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://umarparts.pk",
);

export function normalizeStoreName(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return STORE_NAME;
  return value.trim() === "Umer Mobile Parts" ? STORE_NAME : value.trim();
}
