"use client";

import { m } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const COLORS = ["#12a150", "#f26a0f", "#ffc53d", "#2f6fdf", "#e8590c", "#7c4dde"];

// A short burst of confetti from the middle of the screen. Re-mount with a new key to fire again.
// Drawn in a fixed, clipped layer on <body> so it never widens the page.
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        x: (Math.random() - 0.5) * 520,
        y: -(160 + Math.random() * 260),
        r: Math.random() * 720 - 360,
        c: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 6,
        round: Math.random() > 0.6,
        d: 0.9 + Math.random() * 0.6,
      })),
    [pieces],
  );
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bits.map((b, i) => (
        <m.span
          key={i}
          className="absolute left-1/2 top-1/2 block"
          style={{ width: b.w, height: b.round ? b.w : b.w * 1.8, background: b.c, borderRadius: b.round ? 999 : 2 }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 420], rotate: b.r, opacity: [1, 1, 0] }}
          transition={{ duration: b.d * 1.6, ease: "easeOut", times: [0, 0.35, 1] }}
        />
      ))}
    </div>,
    document.body,
  );
}
