"use client";

import { useState } from "react";
import { Sheet } from "@/components/sheet";
import { CheckIcon } from "@/components/icons";
import { business } from "@/lib/business";
import { earliestPickup, formatPickup } from "@/lib/pickup";
import { useNow } from "@/lib/use-now";

/** Earliest pickup for an order placed right now, e.g. "jueves, 29 de octubre, 10:00 hs". */
export function EarliestPickup() {
  const now = useNow();
  if (now === null) return <span className="inline-block h-4 w-48 animate-pulse rounded bg-current/15 align-middle" />;
  return <>{formatPickup(earliestPickup(now))}</>;
}

/** Shown every time someone enters the take-away section. */
export function TakeawayNotice() {
  const [open, setOpen] = useState(true);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onClose={close} labelledBy="notice-title" variant="center">
      <div className="p-6">
        <p className="text-xs font-semibold tracking-wide text-brand uppercase">Antes de encargar</p>
        <h2 id="notice-title" className="mt-1 font-display text-2xl leading-tight font-semibold text-balance">
          Pedidos con 48 hs hábiles de anticipación
        </h2>
        <p className="mt-3 rounded-2xl bg-warn-bg px-4 py-3 text-sm text-warn-ink">
          Si encargás ahora, retirás desde el <strong className="font-semibold"><EarliestPickup /></strong>.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm">
          {[
            "Los lunes estamos cerrados y no cuentan.",
            "Pagás online con Mercado Pago.",
            `Retirás en ${business.address}.`,
            "Consumir dentro de las 12 hs de retirada.",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <CheckIcon width={18} height={18} className="mt-px shrink-0 text-brand" />
              {item}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={close}
          autoFocus
          className="mt-5 w-full rounded-full bg-ink px-5 py-3.5 font-semibold text-cream transition-[background-color,transform] hover:bg-brand-ink active:scale-[0.98]"
        >
          Entendido, ver tortas
        </button>
      </div>
    </Sheet>
  );
}
