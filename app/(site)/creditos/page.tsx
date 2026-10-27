import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { salonMenu, stockPhotos, takeawayMenu } from "@/lib/menu";

export const metadata: Metadata = { title: "Créditos de fotos" };

const productNames = new Map(
  [...salonMenu, ...takeawayMenu].flatMap((c) => c.products).map((p) => [String(p.id), p.name]),
);

// CC BY and CC BY-SA photos require crediting the author, the license and the source.
const credits = Object.entries(stockPhotos)
  .map(([id, photo]) => ({ ...photo, id, product: productNames.get(id) ?? photo.title }))
  .sort((a, b) => a.product.localeCompare(b.product, "es"));

export default function CreditsPage() {
  if (credits.length === 0) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Créditos de fotos</h1>
      <p className="mt-3 text-muted">
        Los productos marcados como “Foto ilustrativa” usan imágenes de Wikimedia Commons con licencia abierta,
        no fotos propias del local.
      </p>
      <ul className="mt-8 divide-y divide-line rounded-3xl bg-paper px-5 ring-1 ring-line">
        {credits.map((c) => (
          <li key={c.id} className="py-3 text-sm">
            <p className="font-semibold">{c.product}</p>
            <p className="text-muted">
              <a href={c.source} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                {c.title}
              </a>{" "}
              · {c.author} · {c.license}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
