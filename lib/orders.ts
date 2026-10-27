"use client";

import { useSyncExternalStore } from "react";
import { takeawayMenu } from "@/lib/menu";
import { FIRST_SLOT, LAST_SLOT, fromAr, isClosedDay, toAr } from "@/lib/pickup";

export type OrderItem = { productId: number; sizeId: string; label: string; quantity: number; unitPrice: number };

export type Order = {
  ref: string;
  createdAt: number;
  pickup: number;
  name: string;
  phone: string;
  notes: string;
  items: OrderItem[];
  total: number;
  payment: "pagado" | "pendiente";
  status: "pendiente" | "completado";
  /** Sample data generated for the demo, as opposed to an order placed in the store. */
  sample: boolean;
};

// Demo only: orders live in this browser's localStorage. A real deployment would
// keep them in a database behind an authenticated admin.
const KEY = "sasha-orders:v2";
const DAY_MS = 24 * 60 * 60 * 1000;

let cached: Order[] | null = null;
const listeners = new Set<() => void>();

function read(): Order[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Order[];
    }
  } catch {}
  const seeded = sampleOrders(Date.now());
  write(seeded);
  return seeded;
}

function write(orders: Order[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(orders));
  } catch {}
}

const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      cached = null;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: () => (cached ??= read()),
  update(updater: (orders: Order[]) => Order[]) {
    cached = updater(store.getSnapshot());
    write(cached);
    listeners.forEach((l) => l());
  },
};

/** All orders, or null while rendering on the server (localStorage is client-only). */
export function useOrders(): Order[] | null {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => null);
}

export const orderActions = {
  /** Records an order placed in the store. Safe to call twice with the same ref. */
  add(order: Order) {
    store.update((orders) => (orders.some((o) => o.ref === order.ref) ? orders : [order, ...orders]));
  },
  setStatus(ref: string, status: Order["status"]) {
    store.update((orders) => orders.map((o) => (o.ref === ref ? { ...o, status } : o)));
  },
};

// ---------------------------------------------------------------------------
// Sample data: realistic orders built from the real take-away menu and prices.

function random(seed: number) {
  // mulberry32: small, deterministic PRNG so the sample data is stable per day.
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = ["Lucía", "Martina", "Sofía", "Valentina", "Camila", "Julieta", "Paula", "Florencia", "Mateo", "Santiago", "Tomás", "Joaquín", "Facundo", "Nicolás", "Agustina", "Carolina", "Gonzalo", "Mariana"];
const LAST_NAMES = ["González", "Rodríguez", "Fernández", "López", "Martínez", "Pérez", "Gómez", "Díaz", "Sánchez", "Romero", "Álvarez", "Torres", "Ruiz", "Benítez", "Acosta", "Medina"];
const NOTES = ["", "", "", "", "Escribir “Feliz cumple, Sofi”", "Con velitas, por favor", "Retira su hermano", "Sin frutos secos si se puede", "Escribir “Felicidades”"];
// The house favourites sell more often.
const POPULAR = ["Torta Banana Split", "Torta Rogel", "Torta Red Velvet", "Torta Franui", "Torta Bombón", "Torta Lemon Pie"];

function sampleOrders(now: number): Order[] {
  const today = toAr(now);
  const rand = random(today.year * 10000 + today.month * 100 + today.date);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];

  const cakes = takeawayMenu.flatMap((c) => c.products);
  const popular = cakes.filter((c) => POPULAR.includes(c.name));
  const orders: Order[] = [];

  // Pickup days from 60 days ago (so 30-day comparisons have a full previous period) to 6 days ahead, Tuesday to Sunday only.
  for (let offset = -60; offset <= 6; offset++) {
    const dayStart = fromAr(today.year, today.month, today.date + offset, 0);
    const day = toAr(dayStart);
    if (isClosedDay(day.weekday)) continue;

    const weekend = day.weekday === 0 || day.weekday === 6;
    const future = offset > 0;
    // Fewer orders exist yet for days further ahead.
    const base = weekend ? 4 : 2;
    const count = Math.max(0, Math.round(base + rand() * 2 - (future ? offset * 0.5 : 0)));

    for (let i = 0; i < count; i++) {
      const hour = FIRST_SLOT + Math.floor(rand() * (LAST_SLOT - FIRST_SLOT + 1));
      const pickup = fromAr(day.year, day.month, day.date, hour);
      // Ordered 2 to 6 days before pickup, never in the future.
      const createdAt = Math.min(now - 60 * 60 * 1000, pickup - (2 + rand() * 4) * DAY_MS);

      const lines = 1 + (rand() < 0.2 ? 1 : 0);
      const items: OrderItem[] = [];
      for (let l = 0; l < lines; l++) {
        const cake = rand() < 0.6 ? pick(popular) : pick(cakes);
        const size = cake.sizes.length > 1 ? (rand() < 0.65 ? cake.sizes.at(-1)! : pick(cake.sizes)) : cake.sizes[0];
        if (items.some((it) => it.productId === cake.id && it.sizeId === size.id)) continue;
        items.push({
          productId: cake.id,
          sizeId: size.id,
          label: size.id === "unica" ? cake.name : `${cake.name} (${size.label})`,
          quantity: rand() < 0.15 ? 2 : 1,
          unitPrice: size.price,
        });
      }

      const isPast = pickup < now;
      orders.push({
        ref: `SASHA-${Math.floor(rand() * 0xffffffff).toString(16).toUpperCase().padStart(8, "0")}`,
        createdAt,
        pickup,
        name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        phone: `11 ${String(2000 + Math.floor(rand() * 7999))}-${String(1000 + Math.floor(rand() * 8999))}`,
        notes: pick(NOTES),
        items,
        total: items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
        payment: !isPast && rand() < 0.12 ? "pendiente" : "pagado",
        status: isPast ? "completado" : "pendiente",
        sample: true,
      });
    }
  }
  return orders.sort((a, b) => b.createdAt - a.createdAt);
}
