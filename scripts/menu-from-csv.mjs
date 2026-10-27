// Builds shops/<shop>/menu.json from a spreadsheet (a Google Sheets link or a .csv file).
//   npm run menu-from-csv -- cafe-roma "https://docs.google.com/spreadsheets/d/<id>/edit#gid=0"
//   npm run menu-from-csv -- cafe-roma menu.csv
//
// One row per product, or one row per size when it comes in several sizes. Columns:
//   seccion      "salon" (menu to view) or "encargo" (products to order)
//   categoria    e.g. "Desayunos", "Tortas"
//   producto     product name
//   descripcion  optional
//   tamano       optional, e.g. "18 cm". Rows with the same product and different sizes are merged.
//   precio       e.g. 28000 or "$ 28.000"
//   foto         optional: a URL, a file in public/ (e.g. /shops/cafe-roma/rogel.jpg), or an
//                illustrative photo from public/menu-stock/ (credited automatically)
// shops/_template/menu-ejemplo.csv is a ready example to import into Google Sheets.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const [shop, source] = process.argv.slice(2);
if (!/^[a-z0-9][a-z0-9-]*$/.test(shop ?? "") || !source) {
  console.error("Uso: npm run menu-from-csv -- <tienda> <archivo.csv o link de Google Sheets>");
  process.exit(1);
}
const target = new URL(`../shops/${shop}/menu.json`, import.meta.url);
if (!existsSync(new URL(".", target))) {
  console.error(`No existe shops/${shop}. Creala primero con: npm run new-shop ${shop}`);
  process.exit(1);
}

const rows = parseCsv(await load(source));
const header = rows.shift()?.map(normalize) ?? [];
const column = (name) => header.indexOf(name);
const missing = ["seccion", "categoria", "producto", "precio"].filter((c) => column(c) === -1);
if (missing.length) {
  console.error(`Faltan columnas: ${missing.join(", ")}. La primera fila tiene que tener los títulos.`);
  process.exit(1);
}

const sections = { salon: new Map(), takeaway: new Map() };
const errors = [];
rows.forEach((row, i) => {
  const cell = (name) => (column(name) === -1 ? "" : (row[column(name)] ?? "").trim());
  if (row.every((c) => !c.trim())) return;
  const line = i + 2;

  const section = normalize(cell("seccion"));
  const key = section === "salon" ? "salon" : ["encargo", "encargos", "take away", "takeaway"].includes(section) ? "takeaway" : null;
  const price = Number(cell("precio").replace(/[^\d,]/g, "").replace(",", "."));
  if (!key) return errors.push(`fila ${line}: la sección tiene que ser "salon" o "encargo"`);
  if (!cell("categoria") || !cell("producto")) return errors.push(`fila ${line}: falta la categoría o el producto`);
  if (!Number.isFinite(price) || price <= 0) return errors.push(`fila ${line}: precio inválido "${cell("precio")}"`);

  const categories = sections[key];
  const categoryName = cell("categoria");
  if (!categories.has(categoryName)) categories.set(categoryName, { id: slugify(categoryName), name: categoryName, products: new Map() });
  const products = categories.get(categoryName).products;

  const name = cell("producto");
  if (!products.has(name)) {
    products.set(name, {
      id: stableId(`${key}/${categoryName}/${name}`),
      name,
      description: cell("descripcion"),
      price,
      sizes: [],
      image: cell("foto") || null,
    });
  }
  const product = products.get(name);
  const sizeLabel = cell("tamano");
  product.sizes.push(sizeLabel ? { id: slugify(sizeLabel).replace(/-/g, ""), label: sizeLabel, price } : { id: "unica", label: "Tamaño único", price });
  product.description ||= cell("descripcion");
  product.image ||= cell("foto") || null;
});

if (errors.length) {
  console.error(`No se generó el menú:\n  ${errors.join("\n  ")}`);
  process.exit(1);
}

const toList = (categories) =>
  [...categories.values()].map((c) => ({
    id: c.id,
    name: c.name,
    products: [...c.products.values()].map((p) => {
      const sizes = p.sizes.sort((a, b) => a.price - b.price);
      return { ...p, price: sizes[0].price, sizes };
    }),
  }));

// Keep the rating and reviews from the previous menu, if there was one.
const previous = existsSync(target) ? JSON.parse(readFileSync(target, "utf8")) : {};
const menu = {
  salon: toList(sections.salon),
  takeaway: toList(sections.takeaway),
  rating: previous.rating ?? null,
  reviews: previous.reviews ?? [],
};

// Photos from the shared library in public/menu-stock/ are openly licensed: they're listed
// in stock-photos.json (credits page + "Foto ilustrativa" badge) instead of as the shop's own.
const library = new Map(
  readdirSync(new URL("../shops/", import.meta.url), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(new URL(`../shops/${d.name}/stock-photos.json`, import.meta.url)))
    .flatMap((d) => Object.values(JSON.parse(readFileSync(new URL(`../shops/${d.name}/stock-photos.json`, import.meta.url), "utf8"))))
    .map((photo) => [photo.src, photo]),
);
const stock = {};
for (const product of [...menu.salon, ...menu.takeaway].flatMap((c) => c.products)) {
  if (!product.image?.startsWith("/menu-stock/")) continue;
  const credit = library.get(product.image);
  if (!credit) {
    console.error(`${product.name}: ${product.image} no tiene créditos registrados; usá otra foto.`);
    process.exit(1);
  }
  stock[product.id] = credit;
  product.image = null;
}

writeFileSync(target, JSON.stringify(menu, null, 2) + "\n");
writeFileSync(new URL("stock-photos.json", new URL(".", target)), JSON.stringify(stock, null, 2) + "\n");

const count = (list) => list.reduce((n, c) => n + c.products.length, 0);
console.log(`shops/${shop}/menu.json: salón ${count(menu.salon)} productos, encargo ${count(menu.takeaway)} productos.`);
const hosts = new Set(
  [...menu.salon, ...menu.takeaway].flatMap((c) => c.products).flatMap((p) => (p.image?.startsWith("http") ? [new URL(p.image).hostname] : [])),
);
if (hosts.size) console.log(`Fotos remotas en: ${[...hosts].join(", ")}. Agregá esos hosts a remoteImages en shops/${shop}/shop.ts.`);

// ---------------------------------------------------------------------------

async function load(input) {
  if (!/^https?:\/\//.test(input)) return readFileSync(input, "utf8");
  // A Google Sheets "edit" link becomes its CSV export (the sheet must be shared as "anyone with the link").
  const sheet = input.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
  const url = sheet
    ? `https://docs.google.com/spreadsheets/d/${sheet[1]}/export?format=csv&gid=${input.match(/gid=(\d+)/)?.[1] ?? 0}`
    : input;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar la planilla (HTTP ${res.status}). ¿Está compartida con "cualquiera con el enlace"?`);
  return res.text();
}

/** RFC 4180 CSV: quoted fields may contain commas, quotes ("") and line breaks. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") endField();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else field += c;
  }
  if (field || row.length) endRow();
  return rows;
}

function normalize(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

function slugify(text) {
  return normalize(text).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Same name, same id, so carts and orders survive re-importing the sheet. */
function stableId(text) {
  let hash = 0x811c9dc5;
  for (const char of text) hash = Math.imul(hash ^ char.codePointAt(0), 0x01000193);
  return (hash >>> 1) % 1_000_000_000;
}
