import { shop } from "@/shops/current";
import type { DayHours } from "@/shops/types";

export { shop };

// Days use Date#getUTCDay() numbering on Argentina wall-clock time (0 = domingo).
const DAYS = [
  { key: "domingo", label: "Domingo", plural: "domingos" },
  { key: "lunes", label: "Lunes", plural: "lunes" },
  { key: "martes", label: "Martes", plural: "martes" },
  { key: "miercoles", label: "Miércoles", plural: "miércoles" },
  { key: "jueves", label: "Jueves", plural: "jueves" },
  { key: "viernes", label: "Viernes", plural: "viernes" },
  { key: "sabado", label: "Sábado", plural: "sábados" },
] as const;

/** Opening hours for a weekday (0 = domingo), or null when closed. */
export const hoursOn = (weekday: number): DayHours => shop.hours[DAYS[weekday].key];

export const isClosedDay = (weekday: number) => hoursOn(weekday) === null;

const formatHours = (h: NonNullable<DayHours>) => `${h[0]} a ${h[1]} hs`;

/** The week from Monday, as shown in schedules. */
export const weekSchedule = [1, 2, 3, 4, 5, 6, 0].map((weekday) => {
  const hours = hoursOn(weekday);
  return { weekday, day: DAYS[weekday].label, short: DAYS[weekday].label.slice(0, 3), hours: hours && formatHours(hours) };
});

const closedDays = weekSchedule.filter((d) => d.hours === null);

/** "Lunes cerrado", "Sábados y domingos cerrados", or null when it never closes. */
export const closedLabel =
  closedDays.length === 0
    ? null
    : closedDays.length === 1
      ? `${closedDays[0].day} cerrado`
      : capitalize(`${joinList(closedDays.map((d) => DAYS[d.weekday].plural))} cerrados`);

/** "Los lunes estamos cerrados", for the order notice. */
export const closedSentence = closedDays.length
  ? `Los ${joinList(closedDays.map((d) => DAYS[d.weekday].plural))} estamos cerrados`
  : null;

/**
 * Compact schedule: runs of consecutive days with the same hours.
 * "Martes a domingo, 9 a 20 hs" or "Lunes a viernes, 8 a 19 hs · Sábado, 9 a 13 hs".
 */
export const scheduleSummary = (() => {
  const runs: { from: string; to: string; hours: string }[] = [];
  for (const d of weekSchedule) {
    if (!d.hours) continue;
    const last = runs.at(-1);
    const previous = weekSchedule[weekSchedule.indexOf(d) - 1];
    if (last && previous?.hours === d.hours) last.to = d.day;
    else runs.push({ from: d.day, to: d.day, hours: d.hours });
  }
  if (runs.length === 1 && runs[0].from === "Lunes" && runs[0].to === "Domingo") return `Todos los días, ${runs[0].hours}`;
  return runs
    .map((r) => `${r.from === r.to ? r.from : `${r.from} a ${r.to.toLowerCase()}`}, ${r.hours}`)
    .join(" · ");
})();

function joinList(items: string[], conjunction = "y") {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${conjunction} ${items.at(-1)}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The ordered item, in the right gender: "una torta", "un budín". */
const { item } = shop.orders;
export const noun = {
  one: item.one,
  other: item.other,
  count: (n: number) => `${n} ${n === 1 ? item.one : item.other}`,
  /** Picks the feminine or masculine form: g("agregada", "agregado"). */
  g: (feminine: string, masculine: string) => (item.feminine ? feminine : masculine),
};

/** "Rogel" from "Torta Rogel", for compact lists. */
export const shortName = (name: string) =>
  shop.orders.namePrefix && name.startsWith(shop.orders.namePrefix) ? name.slice(shop.orders.namePrefix.length) : name;

/** Label for a product and size, as stored with each order: "Torta Rogel (28 cm)". */
export const lineLabel = (name: string, size: { id: string; label: string }) =>
  size.id === "unica" ? name : `${name} (${size.label})`;

export const leadTimeLabel = shop.orders.leadTimeHours > 0 ? `${shop.orders.leadTimeHours} hs hábiles` : null;

export const paysOnline = shop.orders.payment === "mercadopago";

/** Order numbers: PREFIX-1A2B3C4D. */
export const REFERENCE = new RegExp(`^${shop.orders.referencePrefix}-[0-9A-F]{8}$`);

export const addressWithArea = shop.neighborhood ? `${shop.address}, ${shop.neighborhood}` : shop.address;

export type Location = { name: string; address: string; mapsUrl: string };

/** Pickup points. A shop with one place gets a single entry built from its address. */
export const locations: Location[] = shop.locations?.length
  ? shop.locations
  : [{ name: "", address: addressWithArea, mapsUrl: shop.mapsUrl }];

/** Customers only choose where to pick up when there is more than one place. */
export const hasBranches = locations.length > 1;

/** "Cuffia 1386, Armstrong", or just the address for a single place. */
export const locationLabel = (location: Location) =>
  location.name ? `${location.address}, ${location.name}` : location.address;

/** "Armstrong o Cañada de Gómez", or the address for a single place. */
export const pickupPlaces = hasBranches
  ? joinList(locations.map((l) => l.name), "o")
  : shop.address;

export function whatsappLink(text: string) {
  return `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(text)}`;
}

/** Wording for the browse-only menu: a dine-in "Salón", or a plain "Menú" when it has a name. */
const menuName = shop.salon?.name;
export const salonLabels = menuName
  ? { nav: menuName, card: menuName, title: menuName, cta: `Ver ${menuName.toLowerCase()}`, eyebrow: "Todo lo que hacemos" }
  : { nav: "Salón", card: "En el salón", title: "Menú del salón", cta: "Ver menú del salón", eyebrow: "Para disfrutar acá" };

export const greeting = `¡Hola ${shop.shortName}!`;
