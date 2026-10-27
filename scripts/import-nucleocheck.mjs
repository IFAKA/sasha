// Pulls a shop's digital menu from Núcleo Check (prod.nucleocheck.com/menu/<company-id>/<price-list>)
// and writes shops/<shop>/menu.json. The whole catalog becomes both the menu (to view) and the
// order catalog. Photos are downloaded to public/shops/<shop>/, so the site serves them itself
// instead of waiting on Núcleo Check's storage.
//   npm run import-nucleocheck -- 654 delfis
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const [COMPANY, SHOP, PRICE_LIST = "1"] = process.argv.slice(2);
if (!/^\d+$/.test(COMPANY ?? "") || !/^[a-z0-9][a-z0-9-]*$/.test(SHOP ?? "") || !/^\d+$/.test(PRICE_LIST)) {
  console.error("Uso: npm run import-nucleocheck -- <id-de-empresa> <tienda> [lista-de-precios]");
  process.exit(1);
}
const target = new URL(`../shops/${SHOP}/menu.json`, import.meta.url);
if (!existsSync(new URL(".", target))) {
  console.error(`No existe shops/${SHOP}. Creala primero con: npm run new-shop ${SHOP}`);
  process.exit(1);
}

const res = await fetch(`https://api-prod.nucleocheck.com/MenuCommensal/GetMenuCommensal?PriceListId=${PRICE_LIST}`, {
  headers: { CompanyId: COMPANY },
});
if (!res.ok) throw new Error(`Núcleo Check: HTTP ${res.status}`);
const data = await res.json();
const config = data.SystemConfigurationDigitalMenu ?? {};
const folder = config.UploadPaths?.find((p) => p.Id === 3)?.Name;
const remote = (path, file) => `https://${encodeURI(path)}/${encodeURIComponent(file)}`;

const photosDir = new URL(`../public/shops/${SHOP}/products/`, import.meta.url);
mkdirSync(photosDir, { recursive: true });

/**
 * Saves a photo as public/shops/<shop>/<name>.webp (once), at most 1200 px a side, and returns
 * its public path. Phone photos come at several MB; this keeps the whole catalog small.
 */
async function download(url, name) {
  const local = `${name}.webp`;
  const file = fileURLToPath(new URL(`../public/shops/${SHOP}/${local}`, import.meta.url));
  if (!existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) return null;
    await sharp(Buffer.from(await res.arrayBuffer()))
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(file);
  }
  return `/shops/${SHOP}/${local}`;
}

// Abbreviations that stay in capitals when a name written in capitals is tidied up,
// and the ones spelled out.
const KEEP_UPPER = new Set(["DDL", "XL", "XXL", "NY"]);
const EXPAND = { FR: "frutos rojos" };
// The shop's own name keeps its capital: "bandeja delfis" → "bandeja Delfis".
const brandWord = (config.Name ?? "").split(" ")[0];

/**
 * "TORTA CUMPLE CHICA + VELITA" → "Torta cumple chica + velita". In mixed-case names only
 * long shouted words are lowered ("Cheesecake VASCO" → "Cheesecake vasco").
 */
function tidyName(raw) {
  const words = raw.trim().replace(/\s*\+\s*/g, " + ").replace(/\s{2,}/g, " ").split(" ");
  const letters = raw.replace(/[^\p{L}]/gu, "");
  const shouting = letters.replace(/[^\p{Lu}]/gu, "").length / letters.length > 0.6;
  const name = words
    .map((word) => {
      const isUpper = word === word.toUpperCase() && /\p{Lu}/u.test(word);
      if (!isUpper || KEEP_UPPER.has(word)) return word;
      if (EXPAND[word]) return EXPAND[word];
      return shouting || word.length > 3 ? word.toLowerCase() : word;
    })
    .join(" ")
    .replace(new RegExp(`\\b${brandWord}\\b`, "gi"), brandWord);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** "2.POSTRES, TARTAS Y TORTAS" → "Postres, tartas y tortas". */
function tidyCategory(raw) {
  const name = raw.replace(/^\s*\d+\s*\.\s*/, "").trim().toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function tidyDescription(html) {
  return (html ?? "")
    .replace(/<\/p>\s*<p>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const slug = (text) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const takeaway = data.Categories.filter((c) => c.Products?.length).map((c) => ({
  id: slug(tidyCategory(c.Name)),
  name: tidyCategory(c.Name),
  products: c.Products.map((p) => {
    const sizes = (p.ProductSizes ?? [])
      .map((s) => ({ label: String(s.Name ?? s.Description ?? "").trim(), price: Number(s.PriceWithIva ?? s.Price) }))
      .filter((s) => s.label && s.price > 0)
      .map((s) => ({ id: slug(s.label).replace(/-/g, ""), ...s }))
      .sort((a, b) => a.price - b.price);
    return {
      id: p.Id,
      name: tidyName(p.ProductName),
      description: tidyDescription(p.ProductDescription),
      price: sizes[0]?.price ?? p.PriceWithIva,
      sizes: sizes.length ? sizes : [{ id: "unica", label: "Tamaño único", price: p.PriceWithIva }],
      image: folder && p.PicturePath ? remote(folder, p.PicturePath) : null,
    };
  }),
}));

// Download the photos, a few at a time.
const all = takeaway.flatMap((c) => c.products);
for (let i = 0; i < all.length; i += 6) {
  await Promise.all(all.slice(i, i + 6).map(async (p) => (p.image = p.image && (await download(p.image, `products/${p.id}`)))));
}

// Keep the rating and reviews from the previous menu, if there was one.
const previous = existsSync(target) ? JSON.parse(readFileSync(target, "utf8")) : {};
await writeFile(
  target,
  JSON.stringify({ salon: takeaway, takeaway, rating: previous.rating ?? null, reviews: previous.reviews ?? [] }, null, 2) + "\n",
);

const products = takeaway.flatMap((c) => c.products);
console.log(`${config.Name ?? SHOP}: ${products.length} productos en ${takeaway.length} categorías, ${products.filter((p) => !p.image).length} sin foto.`);
console.log(`Colores del menú: fondo #${config.BackColor}, menú #${config.MenuColor}.`);
if (config.LogoPath) console.log(`Logo: https://${encodeURI(config.UploadPaths.find((p) => p.Id === 11)?.Name ?? "")}/${config.LogoPath}`);
const coverPath = config.UploadPaths?.find((p) => p.Id === 10)?.Name;
if (config.ImagePath && coverPath) console.log(`Portada: ${(await download(remote(coverPath, config.ImagePath), "cover")) ?? "no se pudo descargar"}`);
