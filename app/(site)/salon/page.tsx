import type { Metadata } from "next";
import Link from "next/link";
import { CategoryNav } from "@/components/category-nav";
import { MenuItem } from "@/components/menu-item";
import { Reveal } from "@/components/reveal";
import { ArrowIcon, ClockIcon } from "@/components/icons";
import { business } from "@/lib/business";
import { categorySlug, salonMenu } from "@/lib/menu";

export const metadata: Metadata = {
  title: "Menú del salón",
  description: "Desayunos, almuerzos, café y mesa dulce para disfrutar en Sasha Pasteles.",
};

const categories = salonMenu.map((c) => ({ ...c, slug: categorySlug(c.name) }));
const navItems = categories.map(({ slug, name }) => ({ slug, name }));

export default function SalonPage() {
  return (
    <>
      <header className="mx-auto max-w-6xl px-4 pt-10 pb-6 sm:px-6">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">Para disfrutar acá</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Menú del salón</h1>
        <p className="mt-3 flex items-center gap-2 text-muted">
          <ClockIcon className="shrink-0 text-brand" />
          Martes a domingo de 9 a 20 hs · Permanencia en el salón: {business.salonStayLimit}
        </p>
      </header>

      <CategoryNav categories={navItems} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {categories.map((category) => (
          <section key={category.slug} id={category.slug} aria-labelledby={`${category.slug}-title`} className="pt-10">
            <Reveal>
              <h2 id={`${category.slug}-title`} className="font-display text-2xl font-semibold sm:text-3xl">
                {category.name}
              </h2>
            </Reveal>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {category.products.map((product) => (
                <li key={product.id}>
                  <MenuItem product={product} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        <Reveal className="mt-16 flex flex-col items-start gap-4 rounded-[2rem] bg-ink p-8 text-cream sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl font-semibold">¿Querés la torta entera?</p>
            <p className="mt-1 text-cream/75">Encargala online con 48 hs hábiles de anticipación.</p>
          </div>
          <Link
            href="/take-away"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-ink"
          >
            Ir a take away <ArrowIcon />
          </Link>
        </Reveal>
      </div>
    </>
  );
}
