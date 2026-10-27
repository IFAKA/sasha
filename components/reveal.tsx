"use client";

import { m } from "motion/react";

/** Fades content up once when it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    // Same as HeroIntro: a sliding element must not be the browser's scroll anchor.
    <m.div
      className={`[overflow-anchor:none] ${className ?? ""}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ type: "spring", duration: 0.7, bounce: 0, delay }}
    >
      {children}
    </m.div>
  );
}
