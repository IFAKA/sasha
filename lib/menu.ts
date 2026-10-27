import data from "@/data/menu.json";
import stock from "@/data/stock-photos.json";

export type Size = { id: string; label: string; price: number };

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  sizes: Size[];
  image: string | null;
  /** True when `image` is an illustrative stock photo, not Sasha's own. */
  isStockImage: boolean;
};

export type Category = { id: string; name: string; products: Product[] };

export type Review = { author: string; rating: number; text: string; when: string };

export type StockPhoto = { src: string; title: string; author: string; license: string; source: string };

// Openly licensed photos (Wikimedia Commons) for products Sasha has no photo of.
// Kept apart from menu.json so `npm run import-menu` doesn't wipe them.
export const stockPhotos: Record<string, StockPhoto> = stock;

type RawCategory = Omit<Category, "products"> & { products: Omit<Product, "isStockImage">[] };

function withStockImages(categories: RawCategory[]): Category[] {
  return categories.map((c) => ({
    ...c,
    products: c.products.map((p) => {
      const fallback = p.image ? undefined : stockPhotos[p.id];
      return { ...p, image: p.image ?? fallback?.src ?? null, isStockImage: Boolean(fallback) };
    }),
  }));
}

export const salonMenu: Category[] = withStockImages(data.salon);
export const takeawayMenu: Category[] = withStockImages(data.takeaway);
export const rating: number | null = data.rating;
export const reviews: Review[] = data.reviews;

const takeawayById = new Map(takeawayMenu.flatMap((c) => c.products).map((p) => [p.id, p]));

export function findTakeawayProduct(id: number) {
  return takeawayById.get(id);
}

/** Slug used for in-page category anchors. */
export function categorySlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number) {
  return ars.format(value);
}
