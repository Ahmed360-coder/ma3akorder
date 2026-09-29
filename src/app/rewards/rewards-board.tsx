"use client";

import { useEffect, useState } from "react";
import { m } from "motion/react";
import { Flame, Lock } from "lucide-react";
import type { Extras } from "@/lib/i18n/extras";
import { BADGES, LEVELS, type BadgeId, type computeRewards } from "@/lib/rewards";
import { Art } from "@/components/category-icon";
import { Confetti } from "@/components/discover/confetti";
import { fill } from "@/lib/format";

type Rewards = ReturnType<typeof computeRewards>;

// Counts a number up from zero.
function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!to) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1100);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n.toLocaleString()}</>;
}

export function RewardsBoard({ r, x, userKey }: { r: Rewards; x: Extras["rewards"]; userKey: string }) {
  const [fresh, setFresh] = useState<BadgeId[]>([]);

  // Celebrate badges unlocked since the last visit on this device.
  useEffect(() => {
    const key = `m3akorder.badges.${userKey}`;
    const now = BADGES.filter((b) => r.unlocked[b.id]).map((b) => b.id);
    try {
      const seen: string[] = JSON.parse(localStorage.getItem(key) ?? "[]");
      setFresh(now.filter((id) => !seen.includes(id)));
      localStorage.setItem(key, JSON.stringify(now));
    } catch {}
  }, [r, userKey]);

  const R = 54;
  const C = 2 * Math.PI * R;
  const nextName = r.nextAt !== null ? x.levels[r.level + 1] : null;

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex items-center gap-5">
        {fresh.length > 0 && <Confetti />}
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle cx="64" cy="64" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
            <m.circle
              cx="64" cy="64" r={R} fill="none" stroke="url(#rw)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - r.progress) }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="rw" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--accent)" />
                <stop offset="1" stopColor="var(--warm)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <div className="text-2xl font-extrabold"><CountUp to={r.points} /></div>
            <div className="text-xs text-muted">{x.points}</div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">{x.level} {r.level + 1}/{LEVELS.length}</div>
          <div className="text-gradient text-2xl font-extrabold">{x.levels[r.level]}</div>
          <p className="mt-1 text-sm text-muted">{nextName ? fill(x.next, { n: (r.nextAt ?? 0) - r.points, level: nextName }) : x.maxLevel}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-warm/10 px-3 py-1 text-sm font-bold text-warm-deep">
            <Flame className={`h-4 w-4 ${r.streak ? "animate-pulse" : ""}`} aria-hidden="true" /> {r.streak} {x.streakBody}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{x.badges} · {BADGES.filter((b) => r.unlocked[b.id]).length}/{BADGES.length}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b, i) => {
            const on = r.unlocked[b.id];
            const isNew = fresh.includes(b.id);
            const text = x.badgeList[b.id];
            return (
              <m.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={on ? { y: -4, rotate: -1 } : undefined}
                className={`card relative flex flex-col items-center gap-1.5 p-4 text-center ${on ? "" : "opacity-60"} ${isNew ? "ring-2 ring-warm" : ""}`}
              >
                <m.span
                  className={`relative grid h-16 w-16 place-items-center rounded-2xl ${on ? "bg-warm/10" : "bg-surface-2 grayscale"}`}
                  animate={isNew ? { rotate: [0, -12, 12, -6, 0], scale: [1, 1.2, 1] } : undefined}
                  transition={{ duration: 0.9, delay: 0.4 + i * 0.05 }}
                >
                  <Art src={b.art} className="h-11 w-11" />
                  {!on && <Lock className="absolute -bottom-1 -end-1 h-5 w-5 rounded-full bg-surface p-0.5 text-muted" aria-label={x.locked} />}
                </m.span>
                <div className="text-sm font-bold">{text.title}</div>
                <div className="text-xs text-muted">{text.body}</div>
              </m.div>
            );
          })}
        </div>
      </section>

      <section className="card flex flex-col gap-2">
        <h2 className="font-bold">{x.howTitle}</h2>
        <ul className="flex flex-col gap-1.5 text-sm text-muted">
          {x.how.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> {line}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
