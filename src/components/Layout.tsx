"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCatalog } from "@/components/CatalogProvider";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>{children}</div>}>
      <RouteLayout>{children}</RouteLayout>
    </Suspense>
  );
}

function RouteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const { status, error } = useCatalog();

  return (
    <div className="min-h-screen bg-white">
      {isAdmin ? (
        children
      ) : (
        <>
          <Header />
          {status === "error" && (
            <p
              role="status"
              className="bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900"
            >
              Could not sync the live catalog. Showing demo products instead. {error}
            </p>
          )}
          <div>{children}</div>
          <Footer />
        </>
      )}
    </div>
  );
}
