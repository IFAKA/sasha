import { shop } from "@/lib/shop";

/**
 * Products that have a 3D model (a GLB in public/models). The model is already scaled to the real
 * size of the product (metres), so AR shows it at true size. Kept apart from menu.json like
 * stockPhotos. Key: "<shop short name>:<product id>".
 */
const models: Record<string, string> = {
  "Cardamomo:4003": "/models/cardamomo-4003.glb",
};

export function modelFor(productId: number): string | null {
  return models[`${shop.shortName}:${productId}`] ?? null;
}
