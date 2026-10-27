import { hoursOn, isClosedDay, shop } from "@/lib/shop";

// Argentina has no daylight saving time, so a fixed UTC-3 offset is exact.
const AR_OFFSET_MS = -3 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const LEAD_TIME_HOURS = shop.orders.leadTimeHours;
const BOOKING_WINDOW_DAYS = 21;

export type ArParts = { year: number; month: number; date: number; hour: number; weekday: number };

export function toAr(time: number): ArParts {
  const d = new Date(time + AR_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    date: d.getUTCDate(),
    hour: d.getUTCHours(),
    weekday: d.getUTCDay(),
  };
}

export function fromAr(year: number, month: number, date: number, hour: number) {
  return Date.UTC(year, month, date, hour) - AR_OFFSET_MS;
}

export { isClosedDay };

/**
 * Pickup slots on a weekday: whole hours from the first hour after opening to the
 * last one before closing, or null when the shop is closed that day.
 */
export function slotRange(weekday: number): { first: number; last: number } | null {
  const hours = hoursOn(weekday);
  if (!hours || hours[1] - hours[0] < 2) return null;
  return { first: hours[0] + 1, last: hours[1] - 1 };
}

/**
 * Earliest pickup time for an order placed at `now`: the lead time in business hours later,
 * where hours on closed days don't count, rounded up to the next open slot.
 */
export function earliestPickup(now: number): number {
  let cursor = now;
  let remaining = LEAD_TIME_HOURS;
  while (remaining > 0) {
    cursor += HOUR_MS;
    if (!isClosedDay(toAr(cursor).weekday)) remaining -= 1;
  }
  // Round up to the next whole hour.
  cursor = Math.ceil(cursor / HOUR_MS) * HOUR_MS;

  for (let day = 0; day < 8; day++) {
    const p = toAr(cursor);
    const range = slotRange(p.weekday);
    if (range && p.hour >= range.first && p.hour <= range.last) return cursor;
    if (range && p.hour < range.first) return fromAr(p.year, p.month, p.date, range.first);
    // After the last slot or on a closed day: start of the next day.
    cursor = fromAr(p.year, p.month, p.date + 1, 0);
  }
  throw new Error("The shop has no pickup slots on any day of the week.");
}

export type PickupDay = { key: string; label: string; slots: { value: string; label: string }[] };

const dayLabel = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Argentina/Buenos_Aires",
});

const fullLabel = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires",
});

export function formatPickup(time: number) {
  return `${fullLabel.format(time)} hs`;
}

/** Bookable pickup slots, grouped by day, starting at the earliest allowed one. */
export function pickupDays(now: number): PickupDay[] {
  const first = earliestPickup(now);
  const start = toAr(first);
  const days: PickupDay[] = [];

  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const dayStart = fromAr(start.year, start.month, start.date + offset, 0);
    const p = toAr(dayStart);
    const range = slotRange(p.weekday);
    if (!range) continue;

    const slots = [];
    for (let hour = range.first; hour <= range.last; hour++) {
      const t = fromAr(p.year, p.month, p.date, hour);
      if (t >= first) slots.push({ value: new Date(t).toISOString(), label: `${hour}:00` });
    }
    if (slots.length) {
      days.push({ key: `${p.year}-${p.month + 1}-${p.date}`, label: dayLabel.format(dayStart + 12 * HOUR_MS), slots });
    }
  }
  return days;
}

/** Server-side check: is this ISO string one of the slots we would offer right now? */
export function isValidPickup(iso: string, now: number): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  // Allow a few minutes of grace for the time the customer spent filling the form.
  const offered = pickupDays(now - 15 * 60 * 1000).flatMap((d) => d.slots.map((s) => s.value));
  return offered.includes(new Date(t).toISOString());
}
