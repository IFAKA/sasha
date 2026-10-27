"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "motion/react";

/** Distance from the viewport top, just below the header and the chip bar. */
const ACTIVE_LINE = 150;

/** Sticky category chips that follow the section currently in view. */
export function CategoryNav({ categories }: { categories: { slug: string; name: string }[] }) {
  const [active, setActive] = useState(categories[0]?.slug);
  const listRef = useRef<HTMLUListElement>(null);

  // The section being read is the last one whose top has passed the sticky bars.
  // Checked once per frame while scrolling.
  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(c.slug))
      .filter((el): el is HTMLElement => el !== null);
    let frame = 0;

    const update = () => {
      let current = sections[0]?.id;
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= ACTIVE_LINE) current = el.id;
      }
      if (current) setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [categories]);

  // Keep the active chip centred in the horizontal chip list. This scrolls only the
  // list: scrollIntoView would also move the page and fight Next's scroll-to-top.
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>(`[data-slug="${active}"]`);
    if (!list || !chip) return;
    list.scrollTo({
      left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  return (
    <nav aria-label="Categorías" className="sticky top-16 z-30 border-b border-line/70 bg-cream/90 backdrop-blur-md">
      <ul ref={listRef} className="no-scrollbar relative mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6">
        {categories.map((c) => {
          const isActive = c.slug === active;
          return (
            <li key={c.slug} data-slug={c.slug} className="shrink-0">
              <a
                href={`#${c.slug}`}
                aria-current={isActive ? "true" : undefined}
                className={`relative block rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? "text-white" : "text-muted hover:text-ink"
                }`}
              >
                {isActive ? (
                  <m.span layoutId="category-pill" className="absolute inset-0 rounded-full bg-brand" />
                ) : null}
                <span className="relative">{c.name}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
