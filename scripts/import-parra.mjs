// Pulls a shop's public menu from Parra Marketplace (menu.parramarketplace.com/<parra-slug>)
// and writes a cleaned copy to shops/<shop>/menu.json.
//   npm run import-parra -- sashapasteles sasha
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";

const [CLIENT, SHOP] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/i.test(CLIENT ?? "") || !/^[a-z0-9][a-z0-9-]*$/.test(SHOP ?? "")) {
  console.error("Uso: npm run import-parra -- <slug-en-parra> <tienda>");
  process.exit(1);
}
const target = new URL(`../shops/${SHOP}/menu.json`, import.meta.url);
if (!existsSync(new URL(".", target))) {
  console.error(`No existe shops/${SHOP}. Creala primero con: npm run new-shop ${SHOP}`);
  process.exit(1);
}

const API = "https://menuapi.parramarketplace.com/api";
const IMAGES = "https://storage.googleapis.com/prod-parra-argentina-assets/clients";

const ENGLISH =
  /\b(the|and|with|your|our|its|on|of|in|to|top|layer|layers|available|until|portion|place|order|cake|cream|milk|coffee|sweet|cheese|served|choice|bread|juice|squeezed|chocolate|discs?|berries|fruits?|strawberr(y|ies)|lemonade|smoothie|coconut|intermediate|intense|soft|chilled|passion|sponge|pieces|curls?|curlers|finish(ing)?|coating|crushed|surface|dough|candy|almond|walnut|meringue|base|moist|liqueur|refined|bath|threads|double|three|two|more|semi-sweet|vanilla|natural|peaches|dry|cookies|italian|walnut|apple|square|classic|quince|custard|hot|small|big|additional|bowl|cold|blueberries|pistachio|cornstarch)\b/gi;
const SPANISH =
  /[áéíóúñ¡¿]|\b(con|y|de|el|la|los|las|del|una?|en|capa|capas|porción|torta|crema|leche|bizcochuelo|frutos|rojos|frutillas|base|merengue|chocolate|discos|jugo|pan|queso)\b/gi;
const BOILERPLATE = [
  /La torta en molde[^.]*\.[^.]*\./i,
  /La torta en molde[^.]*\./i,
  /Realiza tu pedido[^.]*\./i,
  /¡?CONSUMIR DENTRO[^!]*!?/i,
];

const count = (re, text) => text.match(re)?.length ?? 0;
const isEnglish = (sentence) => count(ENGLISH, sentence) > count(SPANISH, sentence);

function cleanDescription(raw) {
  // Descriptions mix Spanish and English sentences, sometimes on the same line.
  const sentences = (raw ?? "")
    .replace(/__/g, "")
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s && !isEnglish(s));
  let text = sentences.join(" ");
  for (const re of BOILERPLATE) text = text.replace(re, "");
  return text.replace(/\s{2,}/g, " ").trim();
}

function parseSizes(product) {
  let extras = [];
  try {
    extras = JSON.parse(product.jsonDataConfiguration ?? "null")?.data?.extras ?? [];
  } catch {}
  return extras
    .filter((e) => e.action === "EDIT" && e.price)
    .map((e) => {
      const cm = Number(String(e.description).match(/\d+/)?.[0]);
      return { id: `${cm}cm`, label: `${cm} cm`, price: Number(e.price) };
    })
    .sort((a, b) => a.price - b.price);
}

const spanishName = (name) => name.split(" - ")[0].trim();

async function getJson(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

const home = await getJson(`/Home/${CLIENT}`);
const menuId = (code) => home.client.menus.find((m) => m.deliveryType.code === code).id;

async function loadMenu(code) {
  const { categories } = await getJson(`/Product/GetFiltered/${CLIENT}/${menuId(code)}`);
  return categories
    .filter((c) => c.isActive && c.products.length)
    .map((c) => ({
      id: c.id,
      name: spanishName(c.name),
      products: c.products
        .filter((p) => p.onSale !== false)
        .map((p) => {
          const sizes = parseSizes(p);
          return {
            id: p.id,
            name: p.name.trim(),
            description: cleanDescription(p.description),
            price: sizes[0]?.price ?? p.price,
            sizes: sizes.length ? sizes : [{ id: "unica", label: "Tamaño único", price: p.price }],
            image: p.hasImage ? `${IMAGES}/${home.client.id}/products/${p.id}/product.webp` : null,
          };
        }),
    }));
}

const [salon, takeaway] = await Promise.all([loadMenu("SALON"), loadMenu("TAKEAWAY")]);
const reviews = JSON.parse(home.client.reviewsData ?? "{}").result ?? {};

const data = {
  // Made-to-order cakes live in the take-away menu, so the salón view skips them.
  salon: salon.filter((c) => !/pedido/i.test(c.name)),
  takeaway,
  rating: reviews.rating ?? null,
  reviews: (reviews.reviews ?? [])
    .filter((r) => r.rating >= 4 && r.text)
    .slice(0, 3)
    .map((r) => ({ author: r.author_name, rating: r.rating, text: r.text, when: r.relative_time_description })),
};

await writeFile(target, JSON.stringify(data, null, 2) + "\n");
console.log(`Fotos en ${IMAGES}/${home.client.id}: agregá ese host a remoteImages en shops/${SHOP}/shop.ts.`);
console.log(
  `salón: ${data.salon.reduce((n, c) => n + c.products.length, 0)} items, ` +
    `take away: ${data.takeaway.reduce((n, c) => n + c.products.length, 0)} items`,
);
