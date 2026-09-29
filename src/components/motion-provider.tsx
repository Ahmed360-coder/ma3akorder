"use client";

import { LazyMotion, MotionConfig } from "motion/react";

const loadFeatures = () => import("@/lib/motion-features").then((r) => r.default);

// One small Motion runtime for the whole app. Respects the phone's "reduce motion" setting.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 420, damping: 34 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
