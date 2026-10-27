"use client";

import { createContext, use, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { findTakeawayProduct, type Product, type Size } from "@/lib/menu";
import { slug } from "@/shops/current";

export type CartLine = { productId: number; sizeId: string; quantity: number };
export type ResolvedLine = CartLine & { key: string; product: Product; size: Size; subtotal: number };

type CartContextValue = {
  state: { lines: ResolvedLine[]; isOpen: boolean };
  actions: {
    add: (productId: number, sizeId: string, quantity: number) => void;
    setQuantity: (key: string, quantity: number) => void;
    clear: () => void;
    open: () => void;
    close: () => void;
  };
  meta: { count: number; total: number };
};

const CartContext = createContext<CartContextValue | null>(null);

export const MAX_QUANTITY = 10;
const STORAGE_KEY = `${slug}-cart:v1`;
const EMPTY: CartLine[] = [];

const lineKey = (l: Pick<CartLine, "productId" | "sizeId">) => `${l.productId}:${l.sizeId}`;

function isCartLine(v: unknown): v is CartLine {
  if (typeof v !== "object" || v === null) return false;
  const l = v as Record<string, unknown>;
  return typeof l.productId === "number" && typeof l.sizeId === "string" && typeof l.quantity === "number";
}

// The cart lives in localStorage, exposed as an external store so the server
// render (empty cart) and the client's saved cart never cause a hydration mismatch.
let cached: CartLine[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isCartLine) : EMPTY;
  } catch {
    return EMPTY;
  }
}

const cartStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      cached = readStorage();
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: () => (cached ??= readStorage()),
  getServerSnapshot: () => EMPTY,
  update(updater: (lines: CartLine[]) => CartLine[]) {
    cached = updater(cartStore.getSnapshot());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch {}
    listeners.forEach((l) => l());
  },
};

function resolve(lines: CartLine[]): ResolvedLine[] {
  return lines.flatMap((line) => {
    const product = findTakeawayProduct(line.productId);
    const size = product?.sizes.find((s) => s.id === line.sizeId);
    if (!product || !size) return [];
    return [{ ...line, key: lineKey(line), product, size, subtotal: size.price * line.quantity }];
  });
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback((productId: number, sizeId: string, quantity: number) => {
    cartStore.update((prev) => {
      const key = lineKey({ productId, sizeId });
      if (!prev.some((l) => lineKey(l) === key)) {
        return [...prev, { productId, sizeId, quantity: Math.min(quantity, MAX_QUANTITY) }];
      }
      return prev.map((l) =>
        lineKey(l) === key ? { ...l, quantity: Math.min(l.quantity + quantity, MAX_QUANTITY) } : l,
      );
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    cartStore.update((prev) =>
      quantity < 1
        ? prev.filter((l) => lineKey(l) !== key)
        : prev.map((l) => (lineKey(l) === key ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY) } : l)),
    );
  }, []);

  const clear = useCallback(() => cartStore.update(() => EMPTY), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const resolved = resolve(lines);
    return {
      state: { lines: resolved, isOpen },
      actions: { add, setQuantity, clear, open, close },
      meta: {
        count: resolved.reduce((n, l) => n + l.quantity, 0),
        total: resolved.reduce((n, l) => n + l.subtotal, 0),
      },
    };
  }, [lines, isOpen, add, setQuantity, clear, open, close]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = use(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
