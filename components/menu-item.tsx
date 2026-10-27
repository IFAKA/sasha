import Image from "next/image";
import { formatPrice, type Product } from "@/lib/menu";

/** Read-only menu row used in the salón menu. */
export function MenuItem({ product }: { product: Product }) {
  return (
    <article className="flex gap-4 rounded-3xl bg-paper p-3 ring-1 ring-line transition-shadow hover:shadow-lg hover:shadow-ink/5">
      <div className="min-w-0 flex-1 py-1 pl-1">
        <h3 className="font-semibold text-balance">{product.name}</h3>
        {product.description ? (
          <p className="mt-1 line-clamp-3 text-sm text-muted text-pretty">{product.description}</p>
        ) : null}
        <p className="mt-2 font-semibold text-brand-ink tabular-nums">
          {product.sizes.length > 1 ? "Desde " : ""}
          {formatPrice(product.price)}
        </p>
      </div>
      {product.image ? (
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-blush sm:size-28">
          <Image src={product.image} alt={product.name} fill sizes="112px" className="object-cover" />
          {product.isStockImage ? (
            <span className="absolute inset-x-1 bottom-1 rounded-full bg-ink/70 px-1.5 py-0.5 text-center text-[10px] leading-tight text-cream backdrop-blur-sm">
              Foto ilustrativa
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
