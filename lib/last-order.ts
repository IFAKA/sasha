"use client";

import { useMemo, useSyncExternalStore } from "react";

// A summary of the order being paid, kept in sessionStorage so the result page
// can show it (and prefill the WhatsApp message) after the Mercado Pago redirect.
export type LastOrderItem = {
  productId: number;
  sizeId: string;
  label: string;
  quantity: number;
  unitPrice: number;
};

export type LastOrder = { name: string; phone: string; notes: string; total: number; items: LastOrderItem[] };

const KEY = "sasha-last-order:v1";

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
