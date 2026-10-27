"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { MAX_QUANTITY, useCart } from "@/components/cart/cart-provider";
import { Sheet } from "@/components/sheet";
import { BagIcon, CheckIcon, CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { formatPrice, type Product } from "@/lib/menu";
import { noun, shop, shortName } from "@/lib/shop";

const sizeNotes = shop.orders.sizeNotes ?? {};
const one = noun.g("una", "uno");

type Section = { slug: string; name: string; products: Product[] };

/** The order catalog: one grid, or a titled grid per category when there are several. */
export function CakeCatalog({ sections }: { sections: Section[] }) {
  const titled = sections.length > 1;
  // `detail` outlives `open` so the sheet keeps its content during the exit animation.
  const [detail, setDetail] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { actions, meta } = useCart();

  const select = (cake: Product) => {
    setDetail(cake);
    setOpen(true);
  };

  const confirmAdded = (name: string) => {
    setAdded(name);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(null), 2500);
  };

  return (
    <>
      {sections.map((section, sectionIndex) => (
        <section
          key={section.slug}
          id={titled ? section.slug : undefined}
          aria-labelledby={titled ? `${section.slug}-title` : undefined}
          className={titled ? "pt-10" : undefined}
        >
          {titled ? (
            <h2 id={`${section.slug}-title`} className="mb-5 font-display text-2xl font-semibold sm:text-3xl">
              {section.name}
            </h2>
          ) : null}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
            {section.products.map((cake, i) => (
              <m.li
                key={cake.id}
                className="[overflow-anchor:none]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{
                  type: "spring",
                  duration: 0.6,
                  bounce: 0,
                  delay: (i % 4) * 0.05,
                }}
              >
                <button type="button" onClick={() => select(cake)} className="group block w-full text-left">
                  <div className="relative aspect-square overflow-hidden rounded-3xl bg-blush">
                    {cake.image ? (
                      <Image
                        src={cake.image}
                        alt={cake.name}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                        // The first row is on screen right away: don't wait for the lazy-load check.
                        loading={sectionIndex === 0 && i < 4 ? "eager" : "lazy"}
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : null}
                    <span className="absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-paper/95 text-ink shadow-md transition-[transform,background-color] group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
                      <PlusIcon />
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold text-balance">{shortName(cake.name)}</h3>
                  <p className="text-sm text-muted tabular-nums">
                    {cake.sizes.length > 1 ? "Desde " : ""}
                    {formatPrice(cake.price)}
                  </p>
                </button>
              </m.li>
            ))}
          </ul>
        </section>
      ))}

      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="cake-title" variant="center">
        {detail ? (
          <CakeDetail
            key={detail.id}
            cake={detail}
            onClose={() => setOpen(false)}
            onAdd={(sizeId, quantity) => {
              actions.add(detail.id, sizeId, quantity);
              setOpen(false);
              confirmAdded(detail.name);
            }}
          />
        ) : null}
      </Sheet>

      <AnimatePresence>
        {meta.count > 0 ? (
          <m.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-md"
          >
            <button
              type="button"
              onClick={actions.open}
              className="flex w-full items-center justify-between gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-cream shadow-2xl shadow-ink/30"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm" aria-live="polite">
                <AnimatePresence mode="popLayout" initial={false}>
                  <m.span
                    key={added ?? "cart"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex min-w-0 items-center gap-2"
                  >
                    {added ? (
                      <CheckIcon width={18} height={18} className="shrink-0 text-emerald-400" />
                    ) : (
                      <BagIcon width={18} height={18} />
                    )}
                    <span className="truncate">
                      {added ? `${added} ${noun.g("agregada", "agregado")}` : `${noun.count(meta.count)} en tu pedido`}
                    </span>
                  </m.span>
                </AnimatePresence>
              </span>
              <span className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white tabular-nums">
                Ver pedido · {formatPrice(meta.total)}
              </span>
            </button>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function CakeDetail({
  cake,
  onClose,
  onAdd,
}: {
  cake: Product;
  onClose: () => void;
  onAdd: (sizeId: string, quantity: number) => void;
}) {
  // Default to the most popular size (the largest) so one tap is enough.
  const [sizeId, setSizeId] = useState(cake.sizes.at(-1)!.id);
  const [quantity, setQuantity] = useState(1);
  const size = cake.sizes.find((s) => s.id === sizeId)!;

  return (
    <>
      <div className="relative h-40 shrink-0 bg-blush sm:h-48">
        {cake.image ? <Image src={cake.image} alt={cake.name} fill sizes="448px" className="object-cover" /> : null}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-paper/95 shadow"
          aria-label="Cerrar"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="px-5 pt-4 pb-5">
        <h2 id="cake-title" className="font-display text-2xl leading-tight font-semibold">
          {cake.name}
        </h2>
        {cake.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted text-pretty">{cake.description}</p>
        ) : null}

        {cake.sizes.length > 1 ? (
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold">{shop.orders.sizeLegend ?? "Tamaño"}</legend>
            <div className="grid gap-2">
              {cake.sizes.map((s) => (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl px-4 py-2.5 ring-1 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                    s.id === sizeId ? "bg-blush ring-brand" : "bg-paper ring-line hover:ring-ink/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="size"
                    value={s.id}
                    checked={s.id === sizeId}
                    onChange={() => setSizeId(s.id)}
                    className="sr-only"
                  />
                  <span>
                    <span className="font-semibold">{s.label}</span>
                    {sizeNotes[s.id] ? <span className="ml-2 text-sm text-muted">{sizeNotes[s.id]}</span> : null}
                  </span>
                  <span className="font-semibold tabular-nums">{formatPrice(s.price)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center rounded-full ring-1 ring-line">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="grid size-11 place-items-center rounded-full hover:bg-blush disabled:opacity-40"
              aria-label={`Restar ${one}`}
            >
              <MinusIcon />
            </button>
            <span className="w-7 text-center font-semibold tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
              disabled={quantity >= MAX_QUANTITY}
              className="grid size-11 place-items-center rounded-full hover:bg-blush disabled:opacity-40"
              aria-label={`Sumar ${one}`}
            >
              <PlusIcon />
            </button>
          </div>
          <p className="text-right">
            <span className="block text-xs text-muted">Total</span>
            <span className="font-display text-2xl font-semibold tabular-nums">
              {formatPrice(size.price * quantity)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(sizeId, quantity)}
          className="mt-4 w-full rounded-full bg-brand px-5 py-3.5 font-semibold text-white transition-[background-color,transform] hover:bg-brand-ink active:scale-[0.98]"
        >
          Agregar
        </button>
      </div>
    </>
  );
}
