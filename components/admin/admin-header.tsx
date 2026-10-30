"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlidingPill, useSlidingPill } from "@/components/ui/sliding-pill";
import { ShopBrand } from "@/components/shop-logo";
import { shop } from "@/lib/shop";

const tabs = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/ventas", label: "Ventas" },
] as const;

export function AdminHeader() {
  const pathname = usePathname();
  const activeIndex = tabs.findIndex((t) => t.href === pathname);
  const { listRef, box } = useSlidingPill<HTMLUListElement>(tabs[activeIndex]?.href);

  return (
    // Named so it stays fixed while page content slides (see globals.css).
    <header style={{ viewTransitionName: "admin-header" }} className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Link href="/admin" className="flex items-center gap-2" aria-label={`Panel de ${shop.shortName}, pedidos`}>
          <ShopBrand size={30} name={null} />
          <span className="hidden font-display font-semibold sm:inline">Panel</span>
        </Link>

        <nav aria-label="Panel">
          <ul ref={listRef} className="relative flex items-center gap-1 rounded-full bg-paper/70 p-1 ring-1 ring-line">
            <SlidingPill box={box} className="rounded-full bg-ink" />
            {tabs.map((tab, i) => {
              const active = i === activeIndex;
              return (
                <li key={tab.href} data-pill-active={active ? "" : undefined}>
                  <Link
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    // Tabs to the right slide in from the right, and vice versa.
                    transitionTypes={[i > activeIndex ? "nav-forward" : "nav-back"]}
                    className={`relative block rounded-full px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 ${
                      active ? "text-cream" : "text-muted hover:text-ink"
                    } ${active && !box ? "bg-ink" : ""}`}
                  >
                    <span className="relative">{tab.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link href="/" className="ml-auto text-sm font-semibold text-brand-ink hover:underline">
          Ver tienda
        </Link>
      </div>
    </header>
  );
}
