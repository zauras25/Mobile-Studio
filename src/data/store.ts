export type Product = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  quality: string;
  price: number;
  oldPrice: number;
  retailerDiscountPercent: number;
  stock: number;
  rating: number;
  image: string;
  is_featured?: boolean;
};

export const products: Product[] = [
  {
    id: 1,
    slug: "iphone-13-lcd-premium",
    name: "iPhone 13 LCD Premium",
    brand: "Apple",
    model: "iPhone 13",
    category: "Displays",
    quality: "Premium",
    price: 12500,
    oldPrice: 14000,
    retailerDiscountPercent: 0,
    stock: 12,
    rating: 4.8,
    image: "",
    is_featured: true,
  },
  {
    id: 2,
    slug: "samsung-a15-lcd",
    name: "Samsung A15 LCD",
    brand: "Samsung",
    model: "A15",
    category: "Displays",
    quality: "Original",
    price: 7200,
    oldPrice: 8000,
    retailerDiscountPercent: 0,
    stock: 18,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80",
    is_featured: true,
  },
  {
    id: 3,
    slug: "iphone-11-battery",
    name: "iPhone 11 Battery",
    brand: "Apple",
    model: "iPhone 11",
    category: "Batteries",
    quality: "Premium",
    price: 4200,
    oldPrice: 4800,
    retailerDiscountPercent: 0,
    stock: 25,
    rating: 4.6,
    image: "",
    is_featured: true,
  },
  {
    id: 4,
    slug: "samsung-s23-charging-flex",
    name: "Samsung S23 Charging Flex",
    brand: "Samsung",
    model: "S23",
    category: "Charging Parts",
    quality: "Premium",
    price: 2800,
    oldPrice: 3200,
    retailerDiscountPercent: 0,
    stock: 31,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    slug: "iphone-12-camera-glass",
    name: "iPhone 12 Camera Glass",
    brand: "Apple",
    model: "iPhone 12",
    category: "Camera Parts",
    quality: "Original",
    price: 1600,
    oldPrice: 1900,
    retailerDiscountPercent: 0,
    stock: 40,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    slug: "redmi-note-12-housing",
    name: "Redmi Note 12 Housing",
    brand: "Xiaomi",
    model: "Note 12",
    category: "Housing",
    quality: "Premium",
    price: 2300,
    oldPrice: 2600,
    retailerDiscountPercent: 0,
    stock: 15,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80",
  },
];

export const categories = [
  { name: "Displays", icon: "▣", icon_image_url: "", count: 2 },
  { name: "Batteries", icon: "▰", icon_image_url: "", count: 1 },
  { name: "Charging Parts", icon: "⚡", icon_image_url: "", count: 1 },
  { name: "Camera Parts", icon: "◉", icon_image_url: "", count: 1 },
  { name: "Housing", icon: "▱", icon_image_url: "", count: 1 },
  { name: "Flex", icon: "≋", icon_image_url: "", count: 0 },
];

export function categorySlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
