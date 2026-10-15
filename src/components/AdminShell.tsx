"use client";

import Link from "next/link";
import { STORE_NAME } from "@/lib/site-config";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useCatalog } from "@/components/CatalogProvider";

const navigation = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin" }],
  },
  {
    label: "Website",
    items: [
      { label: "Homepage content", href: "/admin/content" },
      { label: "Banners", href: "/admin/banners" },
      { label: "Site settings", href: "/admin/settings" },
    ],
  },
  {
    label: "Store",
    items: [
      { label: "Products", href: "/admin/products" },
      { label: "Categories", href: "/admin/categories" },
      { label: "Brands", href: "/admin/brands" },
      { label: "Orders", href: "/admin/orders" },
      { label: "Customer accounts", href: "/admin/accounts" },
      { label: "Retailers", href: "/admin/retailers" },
      { label: "Reviews", href: "/admin/reviews" },
    ],
  },
];

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="CMS navigation"
      className={mobile ? "flex min-w-max gap-5 px-4 pb-3" : "space-y-6"}
    >
      {navigation.map((group) => (
        <div key={group.label} className={mobile ? "shrink-0" : undefined}>
          <p className={`mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] ${
            mobile ? "text-orange-300" : "text-slate-500"
          }`}>
              {group.label}
            </p>
          <div className={mobile ? "flex gap-2" : "space-y-1"}>
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                    active
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-950/10"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  } ${mobile ? "whitespace-nowrap border border-white/10" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useCatalog();
  const isLoginPage = pathname === "/admin/login";
  const [authState, setAuthState] = useState<
    "checking" | "ready" | "signed-out" | "not-admin" | "unconfigured"
  >("checking");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSignOutError("Supabase is not configured. Could not sign out.");
      return;
    }
    setSigningOut(true);
    setSignOutError("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSignOutError(`Could not sign out: ${error.message}`);
      setSigningOut(false);
      return;
    }
    router.replace("/admin/login");
  }

  useEffect(() => {
    if (isLoginPage) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.session) {
        setAuthState("signed-out");
        router.replace("/admin/login");
        return;
      }
      setAuthState(
        data.session.user.app_metadata.role === "admin" ? "ready" : "not-admin"
      );
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) {
        setAuthState("signed-out");
        router.replace("/admin/login");
      } else {
        setAuthState(
          session.user.app_metadata.role === "admin" ? "ready" : "not-admin"
        );
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const visibleAuthState =
    authState === "checking" && !getSupabaseBrowserClient()
      ? "unconfigured"
      : authState;

  if (visibleAuthState !== "ready") {
    const message =
      visibleAuthState === "unconfigured"
        ? "Supabase is not configured. Add the project URL and anon key to .env.local, then restart the development server."
        : visibleAuthState === "not-admin"
          ? "This account does not have CMS admin access. Ask the project owner to assign the admin app role."
          : visibleAuthState === "signed-out"
            ? "Redirecting to the secure admin sign-in page…"
            : "Checking admin session…";

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <section className="max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
            Umer CMS
          </p>
          <h1 className="mt-3 text-xl font-black">
            {visibleAuthState === "unconfigured"
              ? "Backend setup required"
              : visibleAuthState === "not-admin"
                ? "Access not authorized"
                : "Secure admin access"}
          </h1>
          <p role="status" className="mt-3 text-sm leading-6 text-slate-600">
            {message}
          </p>
          {authState === "unconfigured" && (
            <Link
              href="/admin/login"
              className="mt-5 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white"
            >
              Go to setup instructions
            </Link>
          )}
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-950 p-5 text-white md:flex">
        <Link href="/admin" className="border-b border-white/10 px-3 pb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-300">
            Store management
          </p>
          <span className="mt-1 block text-xl font-black">UMER CMS</span>
        </Link>
        <div className="mt-7 flex-1 overflow-y-auto">
          <NavigationLinks />
        </div>
        <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
          {status === "ready"
            ? "Shared CMS database connected"
            : status === "error"
              ? "CMS data sync needs attention"
              : "Supabase setup required"}
          <span className="mt-1 block text-amber-100/70">
            Products and website content are managed from the shared database.
          </span>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <Link href="/admin" className="text-lg font-black">
              UMER <span className="text-orange-500">CMS</span>
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={signingOut}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <NavigationLinks mobile />
          </div>
        </header>
        <div className="hidden h-12 items-center justify-between border-b border-slate-200 bg-white px-8 md:flex">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {STORE_NAME} <span className="mx-2 text-orange-500">/</span> CMS
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="text-sm font-bold text-orange-600 transition hover:text-orange-700"
            >
              View storefront →
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={signingOut}
              className="text-sm font-bold text-slate-600 transition hover:text-red-700 disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
        {signOutError && <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 md:px-8">{signOutError}</p>}
        <main className="admin-workspace min-h-screen">{children}</main>
      </div>
    </div>
  );
}
