// Captures the real app screens of the fictional shop "Horno Lento" for the ad video.
//   node capture.mjs                              everything (demo + 3 colour variants)
//   node capture.mjs --shop demo --screen catalog  redo one shot
//   node capture.mjs --shop demoTeal               one shop key
//   --no-build  reuse the last `next build` (only if it was made for the same key)
// The shop lives in video/demo-shop; it is copied into shops/ and public/shops/ for the run and removed after.
import { chromium } from "playwright";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const DEMO = path.resolve(HERE, "../demo-shop");
const OUT = path.resolve(HERE, "../public/captures");
const SLUG = "horno-lento";
const TMP_SHOP = path.join(ROOT, "shops", SLUG);
const TMP_PUBLIC = path.join(ROOT, "public", "shops", SLUG);
const W = 390, H = 844, SCALE = 3;

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(`--${n}`); return i < 0 ? null : args[i + 1] ?? true; };
const onlyShop = flag("shop");
const onlyScreen = flag("screen");
const noBuild = args.includes("--no-build");

const ALL = ["home", "menu", "catalog", "product", "cart", "pickup", "payment", "confirmation", "adminOrders", "adminSales"];
const PALETTES = {
  demoTeal: { brand: "#1f6f6b", brandInk: "#16524f", blush: "#dcefec", cream: "#f5fbfa", ink: "#10282a", muted: "#4f6f6e", line: "#d3e6e3" },
  demoPlum: { brand: "#6b2d5c", brandInk: "#4f1f43", blush: "#f1e1ed", cream: "#fbf6fa", ink: "#2a1426", muted: "#735a6c", line: "#e8d8e3" },
  demoNavy: { brand: "#23395b", brandInk: "#182a45", blush: "#dfe7f2", cream: "#f5f8fc", ink: "#121d30", muted: "#5a6a82", line: "#d9e1ee" },
};
const KEYS = { demo: ALL, demoTeal: ["home", "catalog"], demoPlum: ["home", "catalog"], demoNavy: ["home", "catalog"] };
const PRODUCT = "Torta mousse de chocolate";

// ---------------------------------------------------------------- temp shop folders
let cleaned = false;
function cleanup() {
  if (cleaned) return;
  cleaned = true;
  fs.rmSync(TMP_SHOP, { recursive: true, force: true });
  fs.rmSync(TMP_PUBLIC, { recursive: true, force: true });
  // Point the generated files back at the default shop (they are not tracked).
  spawnSync("node", ["scripts/select-shop.mjs"], { cwd: ROOT, env: { ...process.env, SHOP: "" }, stdio: "ignore" });
}
let server = null;
function stopServer() { if (server && !server.killed) server.kill("SIGTERM"); }
process.on("exit", () => { stopServer(); cleanup(); });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(130));

function installShop(palette) {
  fs.rmSync(TMP_SHOP, { recursive: true, force: true });
  fs.rmSync(TMP_PUBLIC, { recursive: true, force: true });
  fs.mkdirSync(TMP_SHOP, { recursive: true });
  let shopTs = fs.readFileSync(path.join(DEMO, "shop.ts"), "utf8").replace("../../shops/types", "../types");
  if (palette) {
    const theme = `theme: {\n${Object.entries(palette).map(([k, v]) => `    ${k}: "${v}",`).join("\n")}\n  },`;
    shopTs = shopTs.replace(/theme: \{[^}]*\},/, theme);
  }
  fs.writeFileSync(path.join(TMP_SHOP, "shop.ts"), shopTs);
  fs.copyFileSync(path.join(DEMO, "menu.json"), path.join(TMP_SHOP, "menu.json"));
  fs.cpSync(path.join(DEMO, "assets"), TMP_PUBLIC, { recursive: true });
  return shopTs;
}

const readTheme = (ts) => {
  const g = (k) => ts.match(new RegExp(`${k}:\\s*"(#[0-9a-fA-F]{6})"`))?.[1];
  return { bg: g("cream"), fg: g("ink"), accent: g("brand") };
};

// ---------------------------------------------------------------- build and serve
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });

function build() {
  const t = Date.now();
  const r = spawnSync("npm", ["run", "build"], { cwd: ROOT, env: { ...process.env, SHOP: SLUG, MP_ACCESS_TOKEN: "", NEXT_TELEMETRY_DISABLED: "1" }, encoding: "utf8" });
  fs.writeFileSync("/tmp/horno-lento-build.log", (r.stdout ?? "") + (r.stderr ?? ""));
  if (r.status !== 0) throw new Error("next build failed, see /tmp/horno-lento-build.log");
  console.log(`build ok ${((Date.now() - t) / 1000).toFixed(0)}s`);
}

async function start() {
  const port = await freePort();
  server = spawn("node", [path.join(ROOT, "node_modules/next/dist/bin/next"), "start", "-p", String(port)], {
    cwd: ROOT, env: { ...process.env, MP_ACCESS_TOKEN: "", NEXT_TELEMETRY_DISABLED: "1" }, stdio: "ignore",
  });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(base + "/")).ok) return base; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not answer");
}
async function stop() {
  if (!server) return;
  const s = server; server = null;
  await new Promise((res) => { s.once("exit", res); s.kill("SIGTERM"); setTimeout(res, 5000); });
}

// ---------------------------------------------------------------- page helpers
const settle = async (page, extra = 700) => {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) =>
      i.complete && i.naturalWidth ? i.decode().catch(() => {}) : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 8000); })));
  });
  await page.waitForTimeout(extra);
};

// Scroll down in steps so lazy images load and whileInView animations play, then come back.
async function prescroll(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page, 500);
}

const r1 = (n) => Math.round(n * 10) / 10;
async function boxOf(loc, drawer) {
  const l = loc.first();
  if (!(await l.count())) return null;
  return l.evaluate((el, d) => {
    const r = el.getBoundingClientRect();
    const x = Math.max(0, r.x), y = Math.max(0, r.y);
    // Overlays (drawers) are clamped to the viewport: their panels overhang it on purpose.
    const w = Math.min(r.right, innerWidth) - x, h = d ? Math.min(r.bottom, innerHeight) - y : r.height;
    return { x: x + (d ? 0 : scrollX), y: y + (d ? 0 : scrollY), w, h };
  }, drawer).then((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, r1(v)])));
}

async function fullShot(page, file, fullHeight) {
  await fullShotRaw(page, file, fullHeight);
  // A 1 px sideways overflow makes the shot wider than 1170: cut it back.
  const w = Number(spawnSync("magick", ["identify", "-format", "%w", file + "[0]"]).stdout.toString());
  if (w !== W * SCALE) spawnSync("magick", [file, "-crop", `${W * SCALE}x+0+0`, "+repage", file]);
}
async function fullShotRaw(page, file, fullHeight) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  if (fullHeight * SCALE <= 15000) { await page.screenshot({ path: file, fullPage: true }); return; }
  // Chrome caps a texture at 16384 px: shoot in slices and join them.
  const step = 4000, parts = [];
  for (let y = 0, i = 0; y < fullHeight; y += step, i++) {
    const p = `${file}.part${i}.png`;
    await page.screenshot({ path: p, fullPage: true, clip: { x: 0, y, width: W, height: Math.min(step, fullHeight - y) } });
    parts.push(p);
  }
  const r = spawnSync("magick", [...parts, "-append", "+repage", file]);
  parts.forEach((p) => fs.rmSync(p, { force: true }));
  if (r.status !== 0) throw new Error("magick append failed");
}

// ---------------------------------------------------------------- one shop key
async function captureKey(key, base, manifestShop) {
  const wanted = (s) => KEYS[key].includes(s) && (!onlyScreen || onlyScreen === s);
  const dir = path.join(OUT, key);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: SCALE, isMobile: true, hasTouch: true,
    locale: "es-AR", timezoneId: "America/Argentina/Buenos_Aires", reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    const css = "*::-webkit-scrollbar{display:none!important}html{scrollbar-width:none}nextjs-portal,[data-nextjs-toast]{display:none!important}";
    document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = css; document.head.append(s); });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`  page error: ${e.message}`));

  async function shot(name, { scrollY = 0, drawer = false, elements = {}, extraSettle } = {}) {
    if (!wanted(name)) return;
    const t = Date.now();
    await settle(page, extraSettle ?? 700);
    let y = 0;
    if (!drawer) {
      await prescroll(page);
      y = typeof scrollY === "function" ? await scrollY() : scrollY;
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(500);
      y = await page.evaluate(() => window.scrollY);
    }
    const boxes = {};
    for (const [n, loc] of Object.entries(elements)) {
      const b = await boxOf(loc, drawer);
      if (b) boxes[n] = b; else console.log(`  (skip element ${name}.${n}: not found)`);
    }
    const file = path.join(dir, `${name}.png`);
    const fullFile = path.join(dir, `${name}-full.png`);
    await page.screenshot({ path: file });
    let fullHeight = H;
    if (drawer) fs.copyFileSync(file, fullFile);
    else {
      fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      await fullShot(page, fullFile, fullHeight);
      await page.evaluate((v) => window.scrollTo(0, v), y);
    }
    manifestShop.screens[name] = {
      file: `captures/${key}/${name}.png`, fullFile: `captures/${key}/${name}-full.png`,
      fullHeight, scrollY: y, elements: boxes,
    };
    console.log(`${key}/${name} ok ${((Date.now() - t) / 1000).toFixed(1)}s scrollY=${y} fullHeight=${fullHeight} elements=${Object.keys(boxes).join(",") || "-"}`);
  }

  const go = async (p) => { await page.goto(base + p, { waitUntil: "load" }); await settle(page, 300); };
  const dialog = () => page.getByRole("dialog");
  const card = page.locator(`li:has(button[aria-label="Agregar ${PRODUCT} al pedido"])`);

  // home
  await go("/");
  await shot("home", {
    elements: { hero: page.locator("main section").first(), logo: page.locator('header a[aria-label$=", inicio"]') },
  });
  if (!KEYS[key].some((s) => s !== "home" && s !== "catalog")) {
    // colour variants: only home and catalog
  }

  // dine-in menu
  if (key === "demo") {
    await go("/salon");
    await shot("menu", { elements: { title: page.locator("h1").first(), firstCategory: page.locator("section[id]").first() } });
  }

  // take-away catalog
  await go("/take-away");
  await page.getByRole("button", { name: /Entendido/ }).click();
  await page.getByRole("button", { name: /Entendido/ }).waitFor({ state: "detached" }).catch(() => {});
  await page.waitForTimeout(600);
  await shot("catalog", {
    scrollY: async () => Math.max(0, Math.round((await boxOf(card, false)).y - 190)),
    elements: {
      productCard: card,
      addButton: card.locator(`button[aria-label="Agregar ${PRODUCT} al pedido"]`),
      cartIcon: page.locator("[data-cart-target]"),
    },
  });
  if (key !== "demo") { await context.close(); await browser.close(); return; }

  // product detail
  await card.locator("button.block").click();
  await dialog().getByRole("button", { name: "Agregar", exact: true }).waitFor();
  await page.waitForTimeout(900);
  await shot("product", {
    drawer: true,
    elements: { sheet: dialog(), sheetPhoto: dialog().locator("img").first(), addButton: dialog().getByRole("button", { name: "Agregar", exact: true }) },
  });
  await dialog().getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByRole("button", { name: /Ver pedido/ }).first().waitFor();
  await page.waitForTimeout(1200);

  // cart
  await page.locator("[data-cart-target]").click();
  await dialog().getByText("Tu pedido").first().waitFor();
  await page.waitForTimeout(1000);
  await shot("cart", {
    drawer: true,
    elements: { cartRow: dialog().locator("li").first(), cartTotal: dialog().locator("span.font-display").last(), closeButton: dialog().getByRole("button", { name: "Cerrar pedido" }) },
  });

  // pickup: branch, day, time, who picks up
  const d = dialog();
  await d.getByRole("radio", { name: /Centro/ }).tap();
  await page.waitForTimeout(300);
  await d.locator('[aria-label="Día de retiro"] [role=radio]').nth(1).tap();
  await page.waitForTimeout(300);
  await d.locator('[aria-label="Horario de retiro"] [role=radio]').nth(2).tap();
  await d.locator("input[name=name]").fill("Lucía Fernández");
  await d.locator("input[name=phone]").fill("341 555-0147");
  await d.locator("textarea[name=notes]").fill("Escribir “Feliz cumple, Sofi”");
  await d.getByText("¿Dónde lo retirás?").first().evaluate((el) => {
    const c = el.closest(".overflow-y-auto");
    c.scrollTop = el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - 14;
  });
  await page.waitForTimeout(900);
  await shot("pickup", {
    drawer: true,
    elements: {
      branchChip: d.getByRole("radio", { name: /Centro/ }),
      dayChip: d.locator('[aria-label="Día de retiro"] [role=radio][data-checked]'),
      timeChip: d.locator('[aria-label="Horario de retiro"] [role=radio][data-checked]'),
      payButton: d.getByRole("button", { name: /Pagar con Mercado Pago/ }),
    },
  });

  // payment (simulated Mercado Pago)
  await d.getByRole("button", { name: /Pagar con Mercado Pago/ }).click();
  await page.waitForURL(/\/checkout/);
  const pay = page.getByRole("button", { name: /^Pagar/ });
  await pay.waitFor();
  await shot("payment", { elements: { payButton: pay, summary: page.locator("main section").first() } });
  await pay.click();
  await page.waitForURL(/\/pedido/, { timeout: 15000 });
  const ref = new URL(page.url()).searchParams.get("ref");
  await page.locator("#result-title").waitFor();
  await page.waitForTimeout(1500);
  await shot("confirmation", {
    extraSettle: 1200,
    elements: {
      checkBadge: page.locator('section[aria-labelledby="result-title"] > span').first(),
      title: page.locator("#result-title"),
      summary: page.locator('section[aria-labelledby="result-title"] dl'),
    },
  });

  // more orders for the panel, written to the same storage the app uses
  const orders = demoOrders(Date.now());
  await page.evaluate(([k, list]) => {
    const cur = JSON.parse(localStorage.getItem(k) || "[]");
    localStorage.setItem(k, JSON.stringify([...list, ...cur]));
  }, [`${SLUG}-orders:v2`, orders]);

  await go(`/admin?nuevo=${ref}`);
  await page.locator('section[aria-labelledby="fresh-title"] article').waitFor();
  await shot("adminOrders", {
    elements: {
      newOrderCard: page.locator('section[aria-labelledby="fresh-title"] article'),
      freshBadge: page.locator("#fresh-title"),
      stats: page.locator("dl").first(),
    },
  });

  await go("/admin/ventas");
  await page.locator("p.text-5xl").filter({ hasNotText: "–" }).waitFor();
  await page.waitForTimeout(1500);
  await shot("adminSales", {
    extraSettle: 1500,
    scrollY: async () => Math.max(0, Math.round((await boxOf(page.locator('[aria-label="Período"]'), false)).y - 72)),
    elements: {
      revenueCard: page.locator('section[aria-label="Resumen del período"] > div').first(),
      revenueNumber: page.locator("p.text-5xl"),
      chartArea: page.locator('section[aria-labelledby="by-day"]'),
    },
  });

  await context.close();
  await browser.close();
}

// ---------------------------------------------------------------- demo orders
function demoOrders(now) {
  const menu = JSON.parse(fs.readFileSync(path.join(DEMO, "menu.json"), "utf8"));
  const prods = menu.takeaway.flatMap((c) => c.products);
  const by = (n) => prods.find((p) => p.name === n);
  const label = (p, s) => (s.id === "unica" ? p.name : `${p.name} (${s.label})`);
  const AR = -3 * 3600e3;
  const ar = (t) => new Date(t + AR);
  const at = (offset, hour) => { const d = ar(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset, hour) - AR; };
  const open = (t) => ar(t).getUTCDay() !== 1; // closed on Mondays
  const rows = [
    ["Martín Gómez", "Fisherton", [["Lemon pie", 1, 1]], 1, 11, 18],
    ["Sofía Benítez", "Centro", [["Cheesecake de frutos rojos", 1, 1], ["Brownies de chocolate (caja x9)", 0, 1]], 1, 15, 52],
    ["Valentina Ruiz", "Fisherton", [["Pavlova de frutillas", 1, 1]], 2, 12, 95],
    ["Tomás Acosta", "Centro", [["Carrot cake", 0, 1]], 2, 17, 140],
    ["Carolina Medina", "Fisherton", [["Torta de dulce de leche y caramelo", 1, 1], ["Budín de banana", 0, 1]], 3, 10, 210],
    ["Joaquín Álvarez", "Centro", [["Torta mousse de chocolate", 0, 1]], 4, 16, 320],
    ["Julieta Romero", "Fisherton", [["Tarta de frutos rojos", 1, 1]], 5, 13, 400],
  ];
  const nowHour = ar(now).getUTCHours();
  if (open(now) && nowHour < 17) rows.unshift(["Federico Torres", "Fisherton", [["Brownies de chocolate (caja x9)", 0, 2]], 0, Math.min(19, nowHour + 2), 11]);
  const out = [];
  rows.forEach(([name, location, lines, day, hour, ageMin], i) => {
    let off = day;
    while (!open(at(off, 12))) off++;
    const items = lines.map(([n, si, q]) => { const p = by(n), s = p.sizes[Math.min(si, p.sizes.length - 1)]; return { productId: p.id, sizeId: s.id, label: label(p, s), quantity: q, unitPrice: s.price }; });
    out.push({
      ref: `HL-${(0x3a91c200 + i * 7919).toString(16).toUpperCase().padStart(8, "0")}`,
      createdAt: now - ageMin * 60e3, pickup: at(off, hour),
      name, phone: `341 555-0${100 + i * 13}`, notes: i === 1 ? "Con velitas, por favor" : "",
      location, items, total: items.reduce((a, b) => a + b.unitPrice * b.quantity, 0),
      payment: "pagado", status: "pendiente", sample: false,
    });
  });
  return out;
}

// ---------------------------------------------------------------- main
const manifestPath = path.join(OUT, "manifest.json");
fs.mkdirSync(OUT, { recursive: true });
let manifest = { scale: SCALE, viewport: { w: W, h: H }, shops: {} };
try { manifest = { ...manifest, ...JSON.parse(fs.readFileSync(manifestPath, "utf8")), scale: SCALE, viewport: { w: W, h: H } }; } catch {}

const t0 = Date.now();
try {
  for (const key of Object.keys(KEYS)) {
    if (onlyShop && onlyShop !== key) continue;
    const ts = installShop(PALETTES[key]);
    if (!noBuild) build();
    const base = await start();
    const entry = manifest.shops[key] ?? { theme: readTheme(ts), screens: {} };
    entry.theme = readTheme(ts);
    manifest.shops[key] = entry;
    try { await captureKey(key, base, entry); } finally { await stop(); }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
} finally {
  cleanup();
}
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
