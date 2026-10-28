"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { CheckIcon } from "@/components/icons";
import { closedSentence, leadTimeLabel, noun, paysOnline, pickupPlaces, shop } from "@/lib/shop";
import { earliestPickup, formatPickup } from "@/lib/pickup";
import { useNow } from "@/lib/use-now";

/** Earliest pickup for an order placed right now, e.g. "jueves, 29 de octubre, 10:00 hs". */
export function EarliestPickup() {
  const now = useNow();
  if (now === null) return <span className="inline-block h-4 w-48 animate-pulse rounded bg-current/15 align-middle" />;
  return <>{formatPickup(earliestPickup(now))}</>;
}

const rules = [
  closedSentence && `${closedSentence} y no cuentan.`,
  paysOnline ? "Pagás online con Mercado Pago." : "Nos enviás el pedido por WhatsApp y pagás al retirar.",
  `Retirás en ${pickupPlaces}.`,
  ...(shop.orders.rules ?? []),
].filter((rule) => rule !== null);

/** Shown every time someone enters the take-away section (only when orders need notice). */
export function TakeawayNotice() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center p-4">
          <Dialog.Popup className="w-full max-w-md rounded-3xl bg-cream p-6 text-ink shadow-2xl outline-none transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-starting-style:translate-y-3 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0">
            <p className="text-xs font-semibold tracking-wide text-brand uppercase">Antes de encargar</p>
            <Dialog.Title className="mt-1 font-display text-2xl leading-tight font-semibold text-balance">
              Pedidos con {leadTimeLabel} de anticipación
            </Dialog.Title>
            <Dialog.Description className="mt-3 rounded-2xl bg-warn-bg px-4 py-3 text-sm text-warn-ink">
              Si encargás ahora, retirás desde el <strong className="font-semibold"><EarliestPickup /></strong>.
            </Dialog.Description>
            <ul className="mt-4 space-y-1.5 text-sm">
              {rules.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckIcon width={18} height={18} className="mt-px shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
            <Dialog.Close className="mt-5 w-full rounded-full bg-ink px-5 py-3.5 font-semibold text-cream transition-[background-color,transform] hover:bg-brand-ink active:scale-[0.98]">
              Entendido, ver {noun.other}
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
