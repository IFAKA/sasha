import { shop } from "@/lib/shop";

/**
 * Products that have a 3D model (a GLB in public/models). The model is already scaled to the real
 * size of the product (metres), so AR shows it at true size. Kept apart from menu.json like
 * stockPhotos. Key: "<shop short name>:<product id>".
 */
const models: Record<string, { src: string; widthCm: number }> = {
  "Cardamomo:4002": { src: "/models/cardamomo-4002.glb", widthCm: 18 },
  "Cardamomo:4003": { src: "/models/cardamomo-4003.glb", widthCm: 24 },
};

/** `widthCm` is the width the GLB was made at; other sizes are scaled from it. */
export function modelFor(productId: number) {
  return models[`${shop.shortName}:${productId}`] ?? null;
}

/** The cm in a size label like "18 cm", or null when it has none. */
export function sizeCm(label: string): number | null {
  const n = parseFloat(label.match(/(\d+(?:[.,]\d+)?)\s*cm/i)?.[1].replace(",", ".") ?? "");
  return Number.isFinite(n) ? n : null;
}
