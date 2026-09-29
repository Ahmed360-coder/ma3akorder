"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { X } from "lucide-react";
import { Art } from "./category-icon";

const SEEN_KEY = "m3akorder.last-seen";
const AWAY_MS = 30 * 60 * 1000;

// "Welcome back, name" when a signed-in customer returns after being away (a new visit, or 30+ minutes idle).
export function WelcomeBack({ title, body, close }: { title: string; body: string; close: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        return Number(localStorage.getItem(SEEN_KEY) ?? 0);
      } catch {
        return 0;
      }
    };
    const touch = () => {
      try {
        localStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {}
    };
    let greeted = false;
    try {
      greeted = sessionStorage.getItem("m3akorder.welcomed") === "1";
      sessionStorage.setItem("m3akorder.welcomed", "1");
    } catch {}
    const last = read();
    // First ever visit on this phone gets no "back"; a fresh visit after leaving does.
    if (last && (!greeted || Date.now() - last > AWAY_MS)) setShow(true);
    touch();

    const onVisible = () => {
      if (document.visibilityState === "hidden") return touch();
      if (Date.now() - read() > AWAY_MS) setShow(true);
      touch();
    };
    document.addEventListener("visibilitychange", onVisible);
    const tick = setInterval(touch, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 4500);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <m.div
          role="status"
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="fixed inset-x-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface p-3 pe-2 text-foreground shadow-xl shadow-black/10"
        >
          <m.span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
            style={{ background: "color-mix(in oklab, var(--accent) 12%, white)" }}
            animate={{ rotate: [0, 18, -8, 18, 0] }}
            transition={{ duration: 1.1, delay: 0.25 }}
          >
            <Art src="/art/waving_hand.webp" className="h-7 w-7" />
          </m.span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-extrabold">{title}</span>
            <span className="block text-sm text-muted">{body}</span>
          </span>
          <button type="button" onClick={() => setShow(false)} title={close} aria-label={close} className="hit grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
