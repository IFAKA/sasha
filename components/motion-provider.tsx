"use client";

import { LazyMotion, MotionConfig } from "motion/react";

const loadFeatures = () => import("@/lib/motion-features").then((m) => m.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
