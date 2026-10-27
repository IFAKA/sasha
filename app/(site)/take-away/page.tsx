import type { Metadata } from "next";
import { CakeCatalog } from "@/components/takeaway/cake-catalog";
import { EarliestPickup, TakeawayNotice } from "@/components/takeaway/takeaway-notice";
import { CalendarIcon } from "@/components/icons";
import { takeawayMenu } from "@/lib/menu";

export const metadata: Metadata = {
  title: "Tortas por encargo",
  description: "Encargá tu torta online con 48 hs hábiles de anticipación y retirala en Juncal 2110.",
};

const cakes = takeawayMenu.flatMap((c) => c.products);

export default function TakeawayPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-28 sm:px-6">
      <TakeawayNotice />

      <header>
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">Take away</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Tortas por encargo</h1>
        <p className="mt-3 max-w-xl text-muted">
          Elegí tu torta y el tamaño, pagá con Mercado Pago y retirala en el local el día que quieras.
        </p>
      </header>

      <div role="note" className="mt-6 flex items-start gap-3 rounded-2xl bg-warn-bg px-4 py-3 text-warn-ink">
        <CalendarIcon className="mt-0.5 shrink-0" />
        <p>
          <strong className="font-semibold">48 hs hábiles de anticipación.</strong> Si encargás ahora, retirás desde el{" "}
          <EarliestPickup />.
        </p>
      </div>

      <div className="mt-10">
        <CakeCatalog cakes={cakes} />
      </div>
    </div>
  );
}
