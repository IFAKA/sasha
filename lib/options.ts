import { takeawayMenu } from "@/lib/menu";
import { options } from "@/shops/current";
import type { OptionChoice, OptionGroup } from "@/shops/types";

/**
 * Shared by the browser and the server: what each product lets the customer personalize, and what
 * a choice costs. The server runs `validateSelection`, so nothing from the browser is trusted.
 */

/** Group id -> choice id (kind "one"), choice ids (kind "many") or the written text (kind "text"). */
export type Selection = Record<string, string | string[]>;

const DEFAULT_MAX_LENGTH = 40;

const groups: OptionGroup[] = options;
const categoryOf = new Map(takeawayMenu.flatMap((c) => c.products.map((p) => [p.id, c.name] as const)));

/** The groups offered for a product at a size, in the owner's order. */
export function groupsFor(productId: number, sizeId: string): OptionGroup[] {
  const category = categoryOf.get(productId);
  return groups.filter(
    (g) =>
      (!g.sizes || g.sizes.includes(sizeId)) &&
      (g.appliesTo.products?.includes(productId) || (category !== undefined && g.appliesTo.categories?.includes(category))),
  );
}

export const maxLength = (group: OptionGroup) => group.maxLength ?? DEFAULT_MAX_LENGTH;

/** Written text without control characters (line breaks included) or edge spaces. */
export const cleanText = (value: string) => value.replace(/\p{Cc}/gu, "").trim();

const pickedChoices = (group: OptionGroup, value: string | string[] | undefined): OptionChoice[] => {
  const ids = typeof value === "string" ? [value] : (value ?? []);
  return group.choices?.filter((c) => ids.includes(c.id)) ?? [];
};

const isFilled = (group: OptionGroup, value: string | string[] | undefined) =>
  group.kind === "text" ? typeof value === "string" && value !== "" : pickedChoices(group, value).length > 0;

/** What the customer's picks add to the price and to the notice, for the groups offered. */
function extras(productId: number, sizeId: string, selection: Selection) {
  let price = 0;
  let leadHours = 0;
  for (const group of groupsFor(productId, sizeId)) {
    const value = selection[group.id];
    const parts: { price?: number; extraLeadHours?: number }[] =
      group.kind === "text" ? (isFilled(group, value) ? [group] : []) : pickedChoices(group, value);
    for (const part of parts) {
      price += part.price ?? 0;
      leadHours = Math.max(leadHours, part.extraLeadHours ?? 0);
    }
  }
  return { price, leadHours };
}

export const optionsPrice = (productId: number, sizeId: string, selection: Selection) =>
  extras(productId, sizeId, selection).price;

/** Hours of notice the picks add on top of the shop's lead time. */
export const extraLeadHours = (productId: number, sizeId: string, selection: Selection) =>
  extras(productId, sizeId, selection).leadHours;

/** Labels of the required groups still empty. */
export function missingRequired(productId: number, sizeId: string, selection: Selection): string[] {
  return groupsFor(productId, sizeId)
    .filter((g) => g.required && !isFilled(g, selection[g.id]))
    .map((g) => g.label);
}

/** Drops what no longer applies (after a size change, or a changed config); keeps the rest. */
export function pruneSelection(productId: number, sizeId: string, selection: Selection): Selection {
  const kept: Selection = {};
  for (const group of groupsFor(productId, sizeId)) {
    const value = selection[group.id];
    if (group.kind === "text") {
      if (typeof value === "string" && value) kept[group.id] = value.slice(0, maxLength(group));
    } else {
      const ids = pickedChoices(group, value).map((c) => c.id);
      if (ids.length) kept[group.id] = group.kind === "one" ? ids[0] : ids.slice(0, group.max);
    }
  }
  return kept;
}

type Checked = { selection: Selection; error?: undefined } | { error: string; selection?: undefined };

/** Strict check of a selection that came from the browser: either a clean selection or the first problem. */
export function validateSelection(productId: number, sizeId: string, raw: unknown): Checked {
  if (raw === undefined || raw === null) raw = {};
  if (typeof raw !== "object" || Array.isArray(raw)) return { error: "Revisá las opciones de tu pedido." };
  const input = raw as Record<string, unknown>;
  const offered = groupsFor(productId, sizeId);
  if (Object.keys(input).some((id) => !offered.some((g) => g.id === id))) {
    return { error: "Una de las opciones elegidas ya no está disponible. Revisá tu pedido." };
  }

  const selection: Selection = {};
  for (const group of offered) {
    const value = input[group.id];
    const empty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    if (empty) {
      if (group.required) return { error: `Falta completar “${group.label}”.` };
      continue;
    }
    if (group.kind === "text") {
      const written = typeof value === "string" ? cleanText(value) : null;
      if (written === null || written.length > maxLength(group)) {
        return { error: `“${group.label}” puede tener hasta ${maxLength(group)} letras.` };
      }
      if (written) selection[group.id] = written;
      else if (group.required) return { error: `Falta completar “${group.label}”.` };
      continue;
    }
    const ids: unknown = group.kind === "one" ? [value] : value;
    const known = (id: unknown) => typeof id === "string" && group.choices?.some((c) => c.id === id);
    if (
      !Array.isArray(ids) ||
      !ids.every(known) ||
      new Set(ids).size !== ids.length ||
      (group.kind === "many" && ids.length > (group.max ?? Infinity))
    ) {
      return { error: `Revisá “${group.label}”: alguna opción no está disponible.` };
    }
    selection[group.id] = group.kind === "one" ? ids[0] : ids;
  }
  return { selection };
}

/** Same selection always gives the same key, whatever the order of the picks. */
export const selectionKey = (selection: Selection | undefined) =>
  selection && Object.keys(selection).length
    ? JSON.stringify(
        Object.keys(selection)
          .sort()
          .map((id) => [id, Array.isArray(selection[id]) ? [...selection[id]].sort() : selection[id]]),
      )
    : "";

/** Short text for the cart, the message and the orders list: "Relleno: Chocolate · Mensaje en la torta: “Feliz cumple”". */
export function describeSelection(productId: number, sizeId: string, selection: Selection | undefined): string {
  if (!selection) return "";
  return groupsFor(productId, sizeId)
    .filter((g) => isFilled(g, selection[g.id]))
    .map((g) => {
      const value = selection[g.id];
      return `${g.label}: ${g.kind === "text" ? `“${value}”` : pickedChoices(g, value).map((c) => c.label).join(", ")}`;
    })
    .join(" · ");
}
