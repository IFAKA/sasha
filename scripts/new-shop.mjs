// Creates a new shop from shops/_template.
//   npm run new-shop -- cafe-roma "Café Roma"
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const [slug, nameArg] = process.argv.slice(2);
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug ?? "")) {
  console.error('Uso: npm run new-shop -- <slug> "Nombre del local"   (slug en minúsculas, ej: cafe-roma)');
  process.exit(1);
}

const dir = new URL(`../shops/${slug}/`, import.meta.url);
if (existsSync(dir)) {
  console.error(`shops/${slug} ya existe.`);
  process.exit(1);
}

const name = nameArg?.trim() || slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
// Order numbers: up to 10 capital letters taken from the slug (cafe-roma → CAFEROMA).
const prefix = slug.replace(/[^a-z]/g, "").toUpperCase().slice(0, 10).padEnd(2, "X");

cpSync(new URL("../shops/_template/", import.meta.url), dir, { recursive: true });
const configFile = new URL("shop.ts", dir);
const config = readFileSync(configFile, "utf8")
  .replace(/^\/\/ Template for a new shop.*\n/m, "")
  .replace('name: "Café Ejemplo"', `name: ${JSON.stringify(name)}`)
  .replace('shortName: "Café Ejemplo"', `shortName: ${JSON.stringify(name)}`)
  .replace('referencePrefix: "EJEMPLO"', `referencePrefix: "${prefix}"`);
writeFileSync(configFile, config);
mkdirSync(new URL(`../public/shops/${slug}/`, import.meta.url), { recursive: true });

console.log(`Listo: shops/${slug}

Siguientes pasos:
  1. Completá shops/${slug}/shop.ts (dirección, WhatsApp, horarios, colores, textos).
  2. Poné el logo y la portada en public/shops/${slug}/ y apuntalos en shop.ts.
  3. Cargá el menú desde la planilla:  npm run menu-from-csv -- ${slug} <archivo.csv o link de Google Sheets>
  4. Probalo:  SHOP=${slug} npm run dev   (en PowerShell: $env:SHOP="${slug}"; npm run dev)
  5. En Vercel: nuevo proyecto con este repo y la variable SHOP=${slug}.`);
