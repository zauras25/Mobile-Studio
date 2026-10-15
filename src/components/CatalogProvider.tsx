"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  categories as initialCategories,
  products as initialProducts,
  type Product,
} from "@/data/store";
import { normalizeDeliveryRates, type DeliveryRate } from "@/lib/delivery";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  hasRetailerDemoSession,
  isRetailerDemoEnabled,
  subscribeToRetailerDemoSession,
} from "@/lib/auth/retailer-demo";
import { normalizeStoreName, STORE_NAME } from "@/lib/site-config";

export type StoreCategory = {
  name: string;
  icon: string;
  icon_image_url?: string;
  count: number;
};

export type StoreBrand = {
  id: number;
  name: string;
  sort_order: number;
};

export type StoreReview = {
  id: number;
  product_id: number;
  reviewer_name: string;
  rating: number;
  review_text: string;
  is_demo: boolean;
  created_at: string;
  product_name: string;
};

export type StoreBanner = {
  id: number;
  title: string;
  image_url: string;
  placement: string;
  link_url: string;
};

export type StoreSettings = {
  storeName: string;
  supportEmail: string;
  phone: string;
  whatsapp: string;
  contactVerified: boolean;
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
  };
  deliveryRates: DeliveryRate[];
  estimatedDelivery: string;
  deliveryVerified: boolean;
};

type CatalogStatus = "loading" | "ready" | "unconfigured" | "error";

type CatalogContextValue = {
  products: Product[];
  categories: StoreCategory[];
  brands: StoreBrand[];
  reviews: StoreReview[];
  homepage: HomepageContent;
  banners: StoreBanner[];
  settings: StoreSettings;
  status: CatalogStatus;
  error: string;
  isRetailer: boolean;
  retailerAccessError: string;
  refresh: () => Promise<void>;
};

export type HomepageContent = {
  eyebrow: string;
  headline: string;
  description: string;
  button_label: string;
  button_href: string;
  hero_highlights: string[];
  category_heading: string;
  category_description: string;
  show_categories: boolean;
  brand_heading: string;
  brand_description: string;
  show_brands: boolean;
  featured_heading: string;
  show_featured: boolean;
  products_heading: string;
  show_products: boolean;
  show_reviews: boolean;
  reviews_heading: string;
  show_retailer_cta: boolean;
  retailer_heading: string;
  retailer_description: string;
  retailer_button_label: string;
};

const unavailableProductImageIds = [
  "photo-1592286927505-2fd7b8e6b9a0",
  "photo-1609592424274-7f7f8f6e8b35",
];

function normalizeProductImage(image: string): string {
  return unavailableProductImageIds.some((id) => image.includes(id)) ? "" : image;
}

const initialHomepage: HomepageContent = {
  eyebrow: "MOBILE REPAIR PARTS",
  headline: "The right part for your repair",
  description:
    "Search displays, batteries and repair parts by brand or model. Check product grade, compatibility and stock before you order.",
  button_label: "Browse all parts",
  button_href: "/search",
  hero_highlights: [
    "Search by model",
    "Product details and stock",
    "Order support available",
  ],
  category_heading: "Shop by Category",
  category_description:
    "Start with a part type, then check the product listing to confirm it matches your device.",
  show_categories: true,
  brand_heading: "Browse by brand",
  brand_description:
    "Choose a brand to find products listed for its devices. Confirm the exact model before ordering.",
  show_brands: true,
  featured_heading: "Featured parts",
  show_featured: true,
  products_heading: "Explore more parts",
  show_products: true,
  show_reviews: true,
  reviews_heading: "What Customers Say",
  show_retailer_cta: true,
  retailer_heading: "Buying for a repair shop?",
  retailer_description:
    "Explore retailer access for business ordering. Product availability and retailer pricing are shown in the catalog when available.",
  retailer_button_label: "Retailer information",
};

const initialSettings: StoreSettings = {
  storeName: STORE_NAME,
  supportEmail: "",
  phone: "",
  whatsapp: "",
  contactVerified: false,
  social: { instagram: "", facebook: "", tiktok: "" },
  deliveryRates: [],
  estimatedDelivery: "",
  deliveryVerified: false,
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] =
    useState<StoreCategory[]>(initialCategories);
  const [brands, setBrands] = useState<StoreBrand[]>([]);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [homepage, setHomepage] = useState(initialHomepage);
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  const [settings, setSettings] = useState(initialSettings);
  const [status, setStatus] = useState<CatalogStatus>("loading");
  const [error, setError] = useState("");
  const [isRetailer, setIsRetailer] = useState(false);
  const [retailerAccessError, setRetailerAccessError] = useState("");

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setProducts(initialProducts);
      setCategories(initialCategories);
      setBrands([]);
      setReviews([]);
      setHomepage(initialHomepage);
      setBanners([]);
      setSettings(initialSettings);
      setStatus("unconfigured");
      setError("");
      setRetailerAccessError("");
      return;
    }

    setStatus("loading");
    setError("");

    const [productResult, categoryResult, brandResult, reviewResult, contentResult, bannerResult, settingsResult] = await Promise.all([
      supabase
        .from("products")
        .select("id,slug,name,brand,model,category,quality,price,old_price,retailer_discount_percent,stock,rating,image,is_featured")
        .eq("is_published", true)
        .order("name")
        .returns<(Omit<Product, "oldPrice" | "retailerDiscountPercent"> & { old_price: number; retailer_discount_percent: number })[]>(),
      supabase
        .from("categories")
        .select("name,icon,count,sort_order")
        .eq("is_enabled", true)
        .order("sort_order")
        .returns<StoreCategory[]>(),
      supabase
        .from("brands")
        .select("id,name,sort_order")
        .eq("is_enabled", true)
        .order("sort_order")
        .returns<StoreBrand[]>(),
      supabase
        .from("reviews")
        .select("id,product_id,reviewer_name,rating,review_text,is_demo,created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("site_content")
        .select("content")
        .eq("content_key", "homepage")
        .maybeSingle(),
      supabase
        .from("banners")
        .select("id,title,image_url,placement,link_url")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .returns<StoreBanner[]>(),
      supabase
        .from("site_settings")
        .select("setting_key,setting_value")
        .returns<{ setting_key: string; setting_value: Record<string, unknown> }[]>(),
    ]);

    if (
      productResult.error ||
      categoryResult.error ||
      brandResult.error ||
      reviewResult.error ||
      contentResult.error ||
      bannerResult.error ||
      settingsResult.error
    ) {
      const message = [
        productResult.error?.message,
        categoryResult.error?.message,
        brandResult.error?.message,
        reviewResult.error?.message,
        contentResult.error?.message,
        bannerResult.error?.message,
        settingsResult.error?.message,
      ]
        .filter(Boolean)
        .join(" ");
      setProducts(initialProducts);
      setCategories(initialCategories);
      setBrands([]);
      setReviews([]);
      setHomepage(initialHomepage);
      setBanners([]);
      setSettings(initialSettings);
      setError(message);
      setStatus("error");
      return;
    }

    const publishedProducts = productResult.data.map(({ old_price, retailer_discount_percent, ...product }) => ({
      ...product,
      image: normalizeProductImage(product.image),
      oldPrice: old_price,
      retailerDiscountPercent: Number(retailer_discount_percent),
    }));
    const { data: categoryImageData, error: categoryImageError } = await supabase
      .from("categories")
      .select("name,icon_image_url")
      .eq("is_enabled", true);
    const iconColumnUnavailable =
      categoryImageError?.message.includes("icon_image_url") === true &&
      (categoryImageError.message.includes("schema cache") ||
        categoryImageError.message.includes("does not exist"));
    if (categoryImageError && !iconColumnUnavailable) {
      setError(`Could not load category icons: ${categoryImageError.message}`);
      setStatus("error");
      return;
    }
    const categoryImages = new Map(
      (categoryImageData ?? []).map((category) => [
        category.name,
        category.icon_image_url,
      ])
    );
    const enabledCategories = categoryResult.data.map((category) => ({
      ...category,
      icon_image_url: categoryImages.get(category.name) ?? "",
      count: publishedProducts.filter(
        (product) => product.category === category.name
      ).length,
    }));
    const enabledCategoryNames = new Set(
      enabledCategories.map((category) => category.name)
    );
    setProducts(
      publishedProducts.filter((product) =>
        enabledCategoryNames.has(product.category)
      )
    );
    setCategories(enabledCategories);
    setBrands(brandResult.data);
    setReviews(
      reviewResult.data.map((review) => ({
        ...review,
        product_name:
          publishedProducts.find((product) => product.id === review.product_id)?.name ??
          "Mobile part",
      }))
    );
    const savedHomepage = contentResult.data?.content;
    setHomepage(
      savedHomepage && typeof savedHomepage === "object"
        ? {
            ...initialHomepage,
            ...savedHomepage,
            ...(savedHomepage.headline === "Your Repair Starts With the Right Part" ||
            savedHomepage.headline === "Find Quality Mobile Spare Parts" ||
            savedHomepage.headline === "Find the right part for your next repair"
              ? { headline: initialHomepage.headline }
              : {}),
            ...(savedHomepage.description ===
              "Explore displays, batteries, charging parts and more. Browse the catalog to find the mobile parts you need for the repair ahead." ||
            savedHomepage.description ===
              "Browse displays, batteries, charging parts and more by device brand, model or part type. Check each listing for product grade, compatibility and current stock before ordering." ||
            savedHomepage.description ===
            "Displays, batteries, charging parts and other mobile spare parts — explore our catalog to find the part that matches your device."
              ? { description: initialHomepage.description }
              : {}),
            ...(savedHomepage.eyebrow === "UMER MOBILE PARTS" ||
            savedHomepage.eyebrow === "PARTS OF THE REPLACEMENT"
              ? { eyebrow: initialHomepage.eyebrow }
              : {}),
            ...(savedHomepage.button_label === "Shop Parts"
              ? { button_label: initialHomepage.button_label }
              : {}),
            ...(typeof savedHomepage.button_href !== "string" ||
            !savedHomepage.button_href.startsWith("/") ||
            savedHomepage.button_href.startsWith("//")
              ? { button_href: initialHomepage.button_href }
              : {}),
            ...(savedHomepage.category_description ===
            "Find the spare part you need with a simpler category-based shopping experience."
              ? { category_description: initialHomepage.category_description }
              : {}),
            ...(savedHomepage.brand_heading === "Shop by Mobile Brand"
              ? { brand_heading: initialHomepage.brand_heading }
              : {}),
            ...(savedHomepage.brand_description ===
            "Availability and model compatibility should be confirmed against the actual product listing."
              ? { brand_description: initialHomepage.brand_description }
              : {}),
            ...(savedHomepage.featured_heading === "Featured Products"
              ? { featured_heading: initialHomepage.featured_heading }
              : {}),
            ...(savedHomepage.retailer_heading === "Looking for wholesale?"
              ? { retailer_heading: initialHomepage.retailer_heading }
              : {}),
            ...(savedHomepage.retailer_description === "For retailers and repair shops"
              ? { retailer_description: initialHomepage.retailer_description }
              : {}),
            ...(savedHomepage.retailer_button_label === "Explore retailer options"
              ? { retailer_button_label: initialHomepage.retailer_button_label }
              : {}),
            hero_highlights:
              "hero_highlights" in savedHomepage &&
              Array.isArray(savedHomepage.hero_highlights)
                ? savedHomepage.hero_highlights.filter(
                    (highlight: unknown): highlight is string =>
                      typeof highlight === "string"
                  )
                : initialHomepage.hero_highlights,
          }
        : initialHomepage
    );
    setBanners(bannerResult.data);
    const settingsByKey = Object.fromEntries(
      settingsResult.data.map(({ setting_key, setting_value }) => [
        setting_key,
        setting_value,
      ])
    );
    const storeSettings = settingsByKey.store ?? {};
    const deliverySettings = settingsByKey.delivery ?? {};
    const socialSettings = settingsByKey.social ?? {};
    const hasAllContactDetails =
      typeof storeSettings.phone === "string" &&
      storeSettings.phone.trim() !== "" &&
      typeof storeSettings.whatsapp === "string" &&
      storeSettings.whatsapp.trim() !== "" &&
      typeof storeSettings.support_email === "string" &&
      storeSettings.support_email.trim() !== "";
    const contactVerified =
      storeSettings.contact_verified === true && hasAllContactDetails;
    const deliveryVerified = deliverySettings.details_verified === true;
    setSettings({
      storeName: normalizeStoreName(storeSettings.name),
      supportEmail:
        contactVerified && typeof storeSettings.support_email === "string"
          ? storeSettings.support_email
          : "",
      phone:
        contactVerified && typeof storeSettings.phone === "string"
          ? storeSettings.phone
          : "",
      whatsapp:
        contactVerified && typeof storeSettings.whatsapp === "string"
          ? storeSettings.whatsapp
          : "",
      contactVerified,
      social: {
        instagram:
          typeof socialSettings.instagram === "string"
            ? socialSettings.instagram
            : "",
        facebook:
          typeof socialSettings.facebook === "string"
            ? socialSettings.facebook
            : "",
        tiktok:
          typeof socialSettings.tiktok === "string"
            ? socialSettings.tiktok
            : "",
      },
      deliveryRates: deliveryVerified
        ? normalizeDeliveryRates(deliverySettings.zones)
        : [],
      estimatedDelivery:
        deliveryVerified && typeof deliverySettings.estimated_time === "string"
          ? deliverySettings.estimated_time
          : "",
      deliveryVerified,
    });
    setStatus("ready");
  }, []);

  useEffect(() => {
    let active = true;
    const refreshRetailerAccess = async () => {
      if (isRetailerDemoEnabled()) {
        try {
          if (hasRetailerDemoSession()) {
            setIsRetailer(true);
            setRetailerAccessError("");
            return;
          }
        } catch (accessError) {
          setIsRetailer(false);
          setRetailerAccessError(
            accessError instanceof Error ? accessError.message : "Could not verify retailer demo access.",
          );
          return;
        }
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setIsRetailer(false);
        setRetailerAccessError("");
        return;
      }
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) {
        setIsRetailer(false);
        setRetailerAccessError(`Could not verify retailer pricing access: ${sessionError.message}`);
        return;
      }
      setIsRetailer(data.session?.user.app_metadata.role === "retailer");
      setRetailerAccessError("");
    };

    void refreshRetailerAccess();
    const supabase = getSupabaseBrowserClient();
    const { data: authData } = supabase?.auth.onAuthStateChange(() => {
      void refreshRetailerAccess();
    }) ?? { data: { subscription: null } };
    const unsubscribeDemo = subscribeToRetailerDemoSession(() => {
      void refreshRetailerAccess();
    });

    return () => {
      active = false;
      authData.subscription?.unsubscribe();
      unsubscribeDemo();
    };
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const value = useMemo(
    () => ({ products, categories, brands, reviews, homepage, banners, settings, status, error, isRetailer, retailerAccessError, refresh }),
    [products, categories, brands, reviews, homepage, banners, settings, status, error, isRetailer, retailerAccessError, refresh]
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);

  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider.");
  }

  return context;
}
