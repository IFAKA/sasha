"use client";

import { useMemo, useSyncExternalStore } from "react";
import { slug } from "@/shops/current";

// A summary of the order being paid, kept in sessionStorage so the result page
// can show it (and prefill the WhatsApp message) after the Mercado Pago redirect.
export type LastOrderItem = {
  productId: number;
  sizeId: string;
  label: string;
  quantity: number;
  unitPrice: number;
  /** The chosen options as text, when the cake was personalized. */
  details?: string;
};

export type LastOrder = {
  name: string;
  phone: string;
  notes: string;
  /** Branch name, for shops with several pickup points. */
  location?: string;
  total: number;
  items: LastOrderItem[];
};

const KEY = `${slug}-last-order:v1`;

export function saveLastOrder(order: LastOrder) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {}
}

const read = () => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const noopSubscribe = () => () => {};

export function useLastOrder(): LastOrder | null {
  const raw = useSyncExternalStore(noopSubscribe, read, () => null);
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LastOrder;
    } catch {
      return null;
    }
  }, [raw]);
}
