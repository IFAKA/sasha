"use server";

import { redirect } from "next/navigation";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { findTakeawayProduct } from "@/lib/menu";
import { describeSelection, extraLeadHours, optionsPrice, validateSelection } from "@/lib/options";
import { isValidPickup } from "@/lib/pickup";
import { hasBranches, leadTimeFor, lineLabel, locations, paysOnline, shop } from "@/lib/shop";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "phone" | "pickup" | "location" | "items", string>>;
  values?: { name: string; phone: string; notes: string };
} | null;

const MAX_LINES = 20;
const MAX_ITEMS_JSON = 20_000;
const MAX_QUANTITY = 10;
const PHONE = /^\+?[\d\s()-]{8,20}$/;

// `options` is whatever the browser sent: it is only trusted after validateSelection.
type Item = { productId: number; sizeId: string; quantity: number; options: unknown };

function parseItems(raw: FormDataEntryValue | null): Item[] | null {
  if (typeof raw !== "string" || raw.length > MAX_ITEMS_JSON) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_LINES) return null;
  const items: Item[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) return null;
    const { productId, sizeId, quantity, options } = entry as Record<string, unknown>;
    if (
      !Number.isInteger(productId) ||
      typeof sizeId !== "string" ||
      !Number.isInteger(quantity) ||
      (quantity as number) < 1 ||
      (quantity as number) > MAX_QUANTITY
    ) {
      return null;
    }
    items.push({ productId: productId as number, sizeId, quantity: quantity as number, options });
  }
  return items;
}

/** Catalog and options checked line by line. Prices come from here, never from the browser. */
function resolveLines(items: Item[]) {
  const lines = [];
  for (const item of items) {
    const product = findTakeawayProduct(item.productId);
    const size = product?.sizes.find((s) => s.id === item.sizeId);
    if (!product || !size) return { error: "Uno de los productos ya no está disponible. Revisá tu pedido." };
    const checked = validateSelection(product.id, size.id, item.options);
    const { selection } = checked;
    if (!selection) return { error: `${product.name}: ${checked.error}` };
    lines.push({
      product,
      size,
      quantity: item.quantity,
      selection,
      details: describeSelection(product.id, size.id, selection),
      unitPrice: size.price + optionsPrice(product.id, size.id, selection),
      extraLeadHours: extraLeadHours(product.id, size.id, selection),
    });
  }
  return { lines, extraLeadHours: Math.max(0, ...lines.map((l) => l.extraLeadHours)) };
}

const text = (v: FormDataEntryValue | null, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const name = text(formData.get("name"), 80);
  const phone = text(formData.get("phone"), 20);
  const notes = text(formData.get("notes"), 300);
  const pickup = text(formData.get("pickup"), 40);
  const location = text(formData.get("location"), 80);
  const items = parseItems(formData.get("items"));
  const values = { name, phone, notes };

  const fieldErrors: NonNullable<CheckoutState>["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Contanos quién retira el pedido.";
  if (!PHONE.test(phone)) fieldErrors.phone = "Ingresá un teléfono válido, por ejemplo 11 2345-6789.";
  const resolved = items ? resolveLines(items) : null;
  const extraHours = resolved?.extraLeadHours ?? 0;
  if (!isValidPickup(pickup, Date.now(), extraHours)) {
    const lead = leadTimeFor(extraHours);
    fieldErrors.pickup = lead
      ? `Elegí un horario de retiro con al menos ${lead} de anticipación.`
      : "Elegí un horario de retiro disponible.";
  }
  if (hasBranches && !locations.some((l) => l.name === location)) fieldErrors.location = "Elegí en qué local lo retirás.";
  if (!items) fieldErrors.items = "Tu pedido está vacío.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };
  if (!resolved?.lines) return { error: resolved?.error, values };
  const { lines } = resolved;

  const reference = `${shop.orders.referencePrefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const resultUrl = (status: string) =>
    `${siteUrl}/pedido?estado=${status}&ref=${reference}&retiro=${encodeURIComponent(pickup)}`;

  if (!paysOnline) {
    // WhatsApp orders: the result page builds the message for the customer to send.
    redirect(`/pedido?estado=whatsapp&ref=${reference}&retiro=${encodeURIComponent(pickup)}`);
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    // No Mercado Pago credentials: go to the simulated checkout so the demo still flows end to end.
    const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    redirect(`/checkout?ref=${reference}&retiro=${encodeURIComponent(pickup)}&total=${total}`);
  }

  let checkoutUrl: string | undefined;
  try {
    const preference = await new Preference(new MercadoPagoConfig({ accessToken })).create({
      body: {
        items: lines.map(({ product, size, quantity, details, unitPrice }) => ({
          id: `${product.id}-${size.id}`,
          title: lineLabel(product.name, size),
          description: details || undefined,
          quantity,
          unit_price: unitPrice,
          currency_id: "ARS",
          picture_url: product.image ?? undefined,
        })),
        payer: { name },
        external_reference: reference,
        statement_descriptor: shop.name.toUpperCase().slice(0, 22),
        back_urls: {
          success: resultUrl("aprobado"),
          pending: resultUrl("pendiente"),
          failure: resultUrl("rechazado"),
        },
        // Mercado Pago only redirects back automatically to https URLs.
        auto_return: siteUrl.startsWith("https://") ? "approved" : undefined,
        expires: true,
        expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        metadata: {
          pickup,
          location,
          customer_name: name,
          customer_phone: phone,
          notes,
          store: shop.name,
          options: lines.map((l) => ({ product: l.product.id, size: l.size.id, options: l.selection })),
        },
      },
    });
    checkoutUrl = preference.init_point;
  } catch (error) {
    console.error("Mercado Pago preference failed", error);
  }

  if (!checkoutUrl) {
    return { error: "No pudimos conectar con Mercado Pago. Probá de nuevo en unos minutos.", values };
  }
  redirect(checkoutUrl);
}
