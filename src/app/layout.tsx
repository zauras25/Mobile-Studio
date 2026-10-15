import type { Metadata } from "next";
import "./globals.css";

import Layout from "@/components/Layout";
import { CartProvider } from "@/components/CartProvider";
import { CatalogProvider } from "@/components/CatalogProvider";
import { SITE_URL, STORE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: `${STORE_NAME} | Mobile Repair Parts & Supplies`,
    template: `%s | ${STORE_NAME}`,
  },
  description:
    "Browse mobile displays, batteries, charging parts and repair supplies by device brand and model. Check product details, stock and order support.",
  keywords: [
    "mobile phone parts",
    "mobile repair parts",
    "phone display replacement",
    "mobile batteries",
    "charging parts",
    "mobile parts wholesale",
  ],
  openGraph: {
    title: `${STORE_NAME} | Mobile Repair Parts & Supplies`,
    description:
      "Find mobile displays, batteries and repair parts by device brand and model.",
    siteName: STORE_NAME,
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${STORE_NAME} | Mobile Repair Parts & Supplies`,
    description:
      "Find mobile displays, batteries and repair parts by device brand and model.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CatalogProvider>
          <CartProvider>
            <Layout>{children}</Layout>
          </CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
