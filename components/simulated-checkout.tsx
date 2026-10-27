"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { business } from "@/lib/business";
import { useLastOrder } from "@/lib/last-order";
import { formatPrice } from "@/lib/menu";
import { formatPickup } from "@/lib/pickup";

const METHODS = [
  { id: "account", title: "Dinero disponible", detail: "Saldo en tu cuenta", result: "demo" },
  { id: "card", title: "Visa terminada en 3704", detail: "Crédito · 1 cuota sin interés", result: "demo" },
  { id: "cash", title: "Efectivo", detail: "Rapipago o Pago Fácil · se acredita más tarde", result: "pendiente" },
] as const;

type MethodId = (typeof METHODS)[number]["id"];

/**
 * Stand-in for Mercado Pago Checkout Pro while no access token is configured.
 * Nothing is charged and no card data is collected: the methods are fixed test options.
 */
export function SimulatedCheckout({
  reference,
  pickup,
  total,
}: {
  reference: string | null;
  pickup: string | null;
  total: number | null;
}) {
  const router = useRouter();
  const order = useLastOrder();
  const [method, setMethod] = useState<MethodId>("account");
  const [processing, setProcessing] = useState(false);
  const amount = total ?? order?.total ?? 0;

  const finish = (estado: string) => {
    setProcessing(true);
    const params = new URLSearchParams({ estado });
    if (reference) params.set("ref", reference);
    if (pickup) params.set("retiro", pickup);
    // A short wait so the payment feels processed rather than instant.
    setTimeout(() => router.replace(`/pedido?${params}`), 1600);
  };

  if (!reference) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#ededed] p-6 text-center">
        <div>
          <p className="font-semibold">Este pago ya no está disponible.</p>
          <Link href="/take-away" className="mt-3 inline-block font-semibold text-[#009ee3]">
            Volver a la tienda
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-[#ededed] text-[#333]">
      <header className="bg-[#ffe600] px-4 py-3">
        <div className="mx-auto max-w-lg">
          <span className="text-lg font-bold tracking-tight text-[#2d3277]">Checkout</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 px-4 py-4">
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-[#666]">Pagás a {business.name}</p>
          <p className="mt-1 text-3xl font-light tabular-nums">{formatPrice(amount)}</p>
          {order?.items.length ? (
            <p className="mt-1 truncate text-sm text-[#666]">
              {order.items.map((i) => `${i.quantity} × ${i.label}`).join(", ")}
            </p>
          ) : null}
          {pickup ? <p className="mt-2 text-xs text-[#666]">Retiro: {formatPickup(Date.parse(pickup))}</p> : null}
        </section>

        <fieldset className="rounded-lg bg-white shadow-sm">
          <legend className="sr-only">Medio de pago</legend>
          <p className="px-4 pt-4 pb-2 font-semibold">¿Cómo querés pagar?</p>
          {METHODS.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-3 border-t border-[#eee] px-4 py-3 has-[:focus-visible]:bg-[#f5f9ff]"
            >
              <input
                type="radio"
                name="method"
                value={option.id}
                checked={method === option.id}
                onChange={() => setMethod(option.id)}
                className="size-4 accent-[#009ee3]"
              />
              <span>
                <span className="block text-sm font-semibold">{option.title}</span>
                <span className="block text-xs text-[#666]">{option.detail}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="mt-auto space-y-2 pb-[env(safe-area-inset-bottom)]">
          <button
            type="button"
            disabled={processing}
            onClick={() => finish(METHODS.find((x) => x.id === method)!.result)}
            className="relative w-full overflow-hidden rounded-md bg-[#009ee3] py-3.5 font-semibold text-white transition-colors hover:bg-[#0089c7] disabled:opacity-90"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <m.span
                key={processing ? "processing" : "idle"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
                    Procesando pago…
                  </>
                ) : (
                  <>Pagar {formatPrice(amount)}</>
                )}
              </m.span>
            </AnimatePresence>
          </button>
          <div className="text-center text-sm">
            <Link href="/take-away" className="inline-block py-2 font-semibold text-[#009ee3]">
              Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
