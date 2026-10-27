"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { AlertIcon, CheckIcon, WhatsappIcon } from "@/components/icons";
import { capitalize, dayLabel, formatTime, startOfArDay } from "@/lib/admin-dates";
import { formatPrice } from "@/lib/menu";
import { orderActions, useOrders, type Order } from "@/lib/orders";
import { useNow } from "@/lib/use-now";

const FILTERS = [
  { id: "pendiente", label: "Por entregar" },
  { id: "completado", label: "Entregados" },
  { id: "todos", label: "Todos" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

const MAX_DELIVERED = 40;
const REFERENCE = /^SASHA-[0-9A-F]{8}$/;

/** Reads ?nuevo=REF (the order just placed in the store) and pins it at the top. */
export function OrdersBoardFromUrl() {
  const ref = useSearchParams().get("nuevo");
  return <OrdersBoard highlight={ref && REFERENCE.test(ref) ? ref : null} />;
}

export function OrdersBoard({ highlight }: { highlight: string | null }) {
  const orders = useOrders();
  const now = useNow();
  const [filter, setFilter] = useState<Filter>("pendiente");
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.trim().toLowerCase());

  const view = useMemo(() => {
    if (!orders || now === null) return null;
    const today = startOfArDay(now);
    const fresh = highlight ? orders.find((o) => o.ref === highlight) ?? null : null;

    const matches = (o: Order) =>
      !search ||
      o.name.toLowerCase().includes(search) ||
      o.ref.toLowerCase().includes(search) ||
      o.items.some((i) => i.label.toLowerCase().includes(search));

    const list = orders
      .filter((o) => o !== fresh && (filter === "todos" || o.status === filter) && matches(o))
      .sort((a, b) => (filter === "pendiente" ? a.pickup - b.pickup : b.pickup - a.pickup))
      .slice(0, filter === "pendiente" ? undefined : MAX_DELIVERED);

    const groups = new Map<number, Order[]>();
    for (const o of list) {
      const day = startOfArDay(o.pickup);
      groups.set(day, [...(groups.get(day) ?? []), o]);
    }

    const pending = orders.filter((o) => o.status === "pendiente");
    return {
      fresh,
      groups: [...groups.entries()],
      stats: {
        today: pending.filter((o) => startOfArDay(o.pickup) === today).length,
        pending: pending.length,
        unpaid: pending.filter((o) => o.payment === "pendiente").length,
      },
    };
  }, [orders, now, filter, search, highlight]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted">Tortas por encargo para retirar en el local.</p>
        </div>
        <dl className="flex gap-2 text-sm">
          <Stat label="Para hoy" value={view?.stats.today} />
          <Stat label="Por entregar" value={view?.stats.pending} />
          <Stat label="Pago pendiente" value={view?.stats.unpaid} warn />
        </dl>
      </div>

      {view?.fresh ? (
        <section aria-labelledby="fresh-title" className="mt-6">
          <h2 id="fresh-title" className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-ink">
            <span className="relative flex size-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand/60 motion-reduce:animate-none" />
              <span className="relative size-2.5 rounded-full bg-brand" />
            </span>
            Recién llegado de la tienda
          </h2>
          <div className="rounded-3xl ring-2 ring-brand">
            <OrderCard order={view.fresh} now={now!} />
          </div>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Mostrar" className="flex gap-1 rounded-full bg-paper p-1 ring-1 ring-line">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === f.id ? "bg-ink text-cream" : "text-muted hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="min-w-48 flex-1 sm:max-w-xs">
          <span className="sr-only">Buscar pedidos</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, torta o número…"
            className="w-full rounded-full bg-paper px-4 py-2 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-brand sm:text-sm"
          />
        </label>
      </div>

      {view === null ? (
        <div className="mt-6 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-paper" />
          ))}
        </div>
      ) : view.groups.length === 0 ? (
        <p className="mt-10 text-center text-muted">
          {search ? "No hay pedidos que coincidan con la búsqueda." : "No hay pedidos en esta lista."}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {view.groups.map(([day, list]) => (
            <section key={day} aria-label={dayLabel(day, now!)}>
              <h2 className="mb-2 text-sm font-semibold text-muted">
                {dayLabel(day, now!)} · {list.length} {list.length === 1 ? "pedido" : "pedidos"}
              </h2>
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {list.map((order) => (
                    <m.li
                      key={order.ref}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                    >
                      <OrderCard order={order} now={now!} />
                    </m.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value?: number; warn?: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-2 ring-1 ${warn && value ? "bg-warn-bg ring-warn-ink/20" : "bg-paper ring-line"}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-semibold">{value ?? "–"}</dd>
    </div>
  );
}

function OrderCard({ order, now }: { order: Order; now: number }) {
  const done = order.status === "completado";
  const isNew = !order.sample || now - order.createdAt < 24 * 60 * 60 * 1000;
  const firstName = order.name.split(" ")[0];
  const whatsapp = `https://wa.me/549${order.phone.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(
    `¡Hola ${firstName}! Te escribimos de Sasha Pasteles por tu pedido ${order.ref}.`,
  )}`;

  return (
    <article
      className={`rounded-3xl bg-paper p-4 ring-1 ring-line transition-opacity sm:p-5 ${done ? "opacity-60" : ""}`}
      aria-label={`Pedido de ${order.name}, retiro ${formatTime(order.pickup)} hs`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-2xl bg-cream px-3 py-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{formatTime(order.pickup)}</p>
          <p className="text-[11px] text-muted">retiro</p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-semibold">{order.name}</h3>
            {isNew && !done ? (
              <span className="rounded-full bg-blush px-2 py-0.5 text-[11px] font-semibold text-brand-ink">Nuevo</span>
            ) : null}
          </div>
          <p className="text-xs text-muted tabular-nums">{order.ref}</p>
          <ul className="mt-2 text-sm">
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.sizeId}`}>
                <span className="font-semibold tabular-nums">{item.quantity} ×</span> {item.label}
              </li>
            ))}
          </ul>
          {order.notes ? <p className="mt-1 text-sm text-muted italic">“{order.notes}”</p> : null}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-semibold tabular-nums">{formatPrice(order.total)}</p>
          {order.payment === "pagado" ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
              <CheckIcon width={14} height={14} /> Pagado
            </p>
          ) : (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-warn-ink">
              <AlertIcon width={14} height={14} /> Pago pendiente
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
        {order.phone ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
          >
            <WhatsappIcon width={18} height={18} /> {order.phone}
          </a>
        ) : (
          <span />
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full py-1 pr-1 pl-3 text-sm font-semibold select-none">
          {done ? "Entregado" : "Marcar entregado"}
          <input
            type="checkbox"
            checked={done}
            onChange={(e) => orderActions.setStatus(order.ref, e.target.checked ? "completado" : "pendiente")}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={`grid size-7 place-items-center rounded-full ring-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${
              done ? "bg-emerald-600 text-white ring-emerald-600" : "bg-paper text-transparent ring-line"
            }`}
          >
            <CheckIcon width={16} height={16} />
          </span>
        </label>
      </div>
      <p className="sr-only">{capitalize(dayLabel(order.pickup, now))}</p>
    </article>
  );
}
