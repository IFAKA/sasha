"use client";

import { m } from "motion/react";

/** Entrance animation for above-the-fold hero content (plays on load, not on scroll). */
export function HeroIntro({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    // overflow-anchor: none stops Chrome from using this moving element as its scroll
    // anchor; otherwise every reload "compensates" for the slide and scrolls the page 20px.
    <m.div
      className={`[overflow-anchor:none] ${className ?? ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.8, bounce: 0, delay }}
    >
      {children}
    </m.div>
  );
}
