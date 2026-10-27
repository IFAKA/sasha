"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { MAX_QUANTITY, useCart, type ResolvedLine } from "@/components/cart/cart-provider";
import { Sheet } from "@/components/sheet";
import { BagIcon, CalendarIcon, CloseIcon, MinusIcon, PinIcon, PlusIcon, WhatsappIcon } from "@/components/icons";
import { startCheckout } from "@/lib/checkout-actions";
import { saveLastOrder } from "@/lib/last-order";
import { formatPrice } from "@/lib/menu";
import { pickupDays } from "@/lib/pickup";
import { useNow } from "@/lib/use-now";
import { closedLabel, hasBranches, leadTimeLabel, lineLabel, locations, noun, paysOnline, shop } from "@/lib/shop";

const one = noun.g("una", "uno");

export function CartDrawer() {
  const { state, actions, meta } = useCart();

  return (
    <Sheet open={state.isOpen} onClose={actions.close} labelledBy="cart-title">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="cart-title" className="font-display text-2xl font-semibold">
          Tu pedido
        </h2>
        <button
          type="button"
          onClick={actions.close}
          className="grid size-10 place-items-center rounded-full hover:bg-blush"
          aria-label="Cerrar pedido"
        >
          <CloseIcon />
        </button>
      </div>

      {meta.count === 0 ? <EmptyCart onBrowse={actions.close} /> : <CartContents />}
    </Sheet>
  );
}

function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-blush text-brand">
        <BagIcon width={28} height={28} />
      </span>
      <p className="font-display text-xl font-semibold">
        Todavía no elegiste {noun.g("ninguna", "ningún")} {noun.one}
      </p>
      <p className="text-sm text-muted">
        Encargá tu {noun.one} {noun.g("favorita", "favorito")} y {noun.g("retirala", "retiralo")} en el local.
      </p>
      <Link
        href="/take-away"
        onClick={onBrowse}
        className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream hover:bg-brand-ink"
      >
        Ver {noun.other} por encargo
      </Link>
    </div>
  );
}

function CartContents() {
  const { state, meta } = useCart();
  const [formState, formAction, pending] = useActionState(startCheckout, null);
  const items = JSON.stringify(
    state.lines.map(({ productId, sizeId, quantity }) => ({ productId, sizeId, quantity })),
  );
  const errors = formState?.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const form = new FormData(e.currentTarget);
        const field = (key: string) => {
          const value = form.get(key);
          return typeof value === "string" ? value.trim() : "";
        };
        saveLastOrder({
          name: field("name"),
          phone: field("phone"),
          notes: field("notes"),
          location: field("location"),
          total: meta.total,
          items: state.lines.map((l) => ({
            productId: l.productId,
            sizeId: l.sizeId,
            label: lineLabel(l.product.name, l.size),
            quantity: l.quantity,
            unitPrice: l.size.price,
          })),
        });
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        <ul className="divide-y divide-line">
          <AnimatePresence initial={false}>
            {state.lines.map((line) => (
              <CartRow key={line.key} line={line} />
            ))}
          </AnimatePresence>
        </ul>

        {hasBranches ? <LocationPicker error={errors.location} /> : null}
        <PickupPicker error={errors.pickup} />

        <fieldset className="mt-6 min-w-0 space-y-3">
          <legend className="mb-2 font-semibold">¿Quién retira?</legend>
          <Field label="Nombre y apellido" error={errors.name}>
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={80}
              defaultValue={formState?.values?.name}
              placeholder="Ej: Lucía Fernández…"
            />
          </Field>
          <Field label="Teléfono / WhatsApp" error={errors.phone}>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={20}
              defaultValue={formState?.values?.phone}
              placeholder="Ej: 11 2345-6789…"
            />
          </Field>
          <Field label="Comentarios (opcional)">
            <textarea
              name="notes"
              rows={2}
              maxLength={300}
              defaultValue={formState?.values?.notes}
              placeholder={shop.orders.notesPlaceholder ?? "Ej: retira mi hermana…"}
            />
          </Field>
        </fieldset>
      </div>

      <div className="border-t border-line bg-paper px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <input type="hidden" name="items" value={items} />
        <div aria-live="polite">
          {formState?.error || errors.items ? (
            <p className="mb-3 rounded-xl bg-blush px-3 py-2 text-sm text-brand-ink">{formState?.error ?? errors.items}</p>
          ) : null}
        </div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-muted">Total</span>
          <span className="font-display text-2xl font-semibold tabular-nums">{formatPrice(meta.total)}</span>
        </div>
        {paysOnline ? (
          <>
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#009ee3] px-5 py-3.5 font-semibold text-white transition-[background-color,transform] hover:bg-[#0089c7] active:scale-[0.98] disabled:opacity-70"
            >
              {pending ? "Conectando con Mercado Pago…" : "Pagar con Mercado Pago"}
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              Pago seguro en Mercado Pago. Tu pedido se confirma al acreditarse el pago.
            </p>
          </>
        ) : (
          <>
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a7f4b] px-5 py-3.5 font-semibold text-white transition-[background-color,transform] hover:bg-[#156b3f] active:scale-[0.98] disabled:opacity-70"
            >
              <WhatsappIcon /> {pending ? "Preparando tu pedido…" : "Pedir por WhatsApp"}
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              Te armamos el mensaje con todo el pedido. Pagás al retirar.
            </p>
          </>
        )}
      </div>
    </form>
  );
}

function CartRow({ line }: { line: ResolvedLine }) {
  const { actions } = useCart();
  const sizeLabel = line.size.id === "unica" ? null : line.size.label;

  return (
    <m.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", duration: 0.35, bounce: 0 }}
      className="overflow-hidden"
    >
      <div className="flex gap-3 py-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-blush">
          {line.product.image ? <Image src={line.product.image} alt="" fill sizes="64px" className="object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{line.product.name}</p>
          {sizeLabel ? (
            <p className="text-sm text-muted">{shop.orders.sizePrefix ? `${shop.orders.sizePrefix} ${sizeLabel}` : sizeLabel}</p>
          ) : null}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center rounded-full ring-1 ring-line">
              <button
                type="button"
                onClick={() => actions.setQuantity(line.key, line.quantity - 1)}
                className="grid size-8 place-items-center rounded-full hover:bg-blush"
                aria-label={line.quantity === 1 ? `Quitar ${line.product.name}` : `Restar ${one} ${line.product.name}`}
              >
                <MinusIcon width={16} height={16} />
              </button>
              <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                {line.quantity}
              </span>
              <button
                type="button"
                onClick={() => actions.setQuantity(line.key, line.quantity + 1)}
                disabled={line.quantity >= MAX_QUANTITY}
                className="grid size-8 place-items-center rounded-full hover:bg-blush disabled:opacity-40"
                aria-label={`Sumar ${one} ${line.product.name}`}
              >
                <PlusIcon width={16} height={16} />
              </button>
            </div>
            <span className="font-semibold tabular-nums">{formatPrice(line.subtotal)}</span>
          </div>
        </div>
      </div>
    </m.li>
  );
}

/** Branch choice, only for shops with more than one pickup point. */
function LocationPicker({ error }: { error?: string }) {
  return (
    <fieldset className="mt-6 min-w-0">
      <legend className="mb-3 flex items-center gap-2 font-semibold">
        <PinIcon /> ¿Dónde lo retirás?
      </legend>
      <div className="grid gap-2">
        {locations.map((location, i) => (
          <label
            key={location.name}
            className="flex cursor-pointer items-center gap-3 rounded-2xl bg-paper px-4 py-2.5 ring-1 ring-line transition-colors has-[:checked]:bg-blush has-[:checked]:ring-brand has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand"
          >
            <input type="radio" name="location" value={location.name} defaultChecked={i === 0} className="accent-brand" />
            <span>
              <span className="block font-semibold">{location.name}</span>
              <span className="block text-sm text-muted">{location.address}</span>
            </span>
          </label>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-brand-ink">{error}</p> : null}
    </fieldset>
  );
}

const pickupHint = [leadTimeLabel && `Mínimo ${leadTimeLabel} de anticipación`, closedLabel].filter(Boolean).join(" · ");

function PickupPicker({ error }: { error?: string }) {
  const now = useNow();
  const days = useMemo(() => (now ? pickupDays(now) : []), [now]);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);

  // Default to the earliest available slot so the form is valid without changes.
  const day = days.find((d) => d.key === dayKey) ?? days[0];
  const selected = day?.slots.find((s) => s.value === slot) ?? day?.slots[0];

  return (
    <fieldset className="mt-6 min-w-0">
      <legend className="mb-1 flex items-center gap-2 font-semibold">
        <CalendarIcon /> ¿Cuándo lo retirás?
      </legend>
      {pickupHint ? <p className="mb-3 text-sm text-muted">{pickupHint}.</p> : null}

      {day ? (
        <>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="radiogroup" aria-label="Día de retiro">
            {days.map((d) => {
              const active = d.key === day.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setDayKey(d.key);
                    setSlot(null);
                  }}
                  className={`shrink-0 rounded-2xl px-3 py-2 text-left text-sm ring-1 transition-colors first-letter:uppercase ${
                    active ? "bg-ink text-cream ring-ink" : "bg-paper ring-line hover:ring-ink/40"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Horario de retiro">
            {day.slots.map((s) => {
              const active = s.value === selected?.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSlot(s.value)}
                  className={`rounded-xl py-2 text-sm font-medium tabular-nums ring-1 transition-colors ${
                    active ? "bg-brand text-white ring-brand" : "bg-paper ring-line hover:ring-brand/50"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="pickup" value={selected?.value ?? ""} />
        </>
      ) : (
        <p className="text-sm text-muted">Calculando horarios disponibles…</p>
      )}
      {error ? <p className="mt-2 text-sm text-brand-ink">{error}</p> : null}
    </fieldset>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactElement }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <span className="block [&>input]:w-full [&>input]:rounded-xl [&>input]:bg-paper [&>input]:px-3.5 [&>input]:py-2.5 [&>input]:text-base [&>input]:ring-1 [&>input]:ring-line [&>input]:outline-none [&>input:focus]:ring-2 [&>input:focus]:ring-brand [&>textarea]:w-full [&>textarea]:rounded-xl [&>textarea]:bg-paper [&>textarea]:px-3.5 [&>textarea]:py-2.5 [&>textarea]:text-base [&>textarea]:ring-1 [&>textarea]:ring-line [&>textarea]:outline-none [&>textarea:focus]:ring-2 [&>textarea:focus]:ring-brand">
        {children}
      </span>
      {error ? <span className="mt-1 block text-sm text-brand-ink">{error}</span> : null}
    </label>
  );
}
