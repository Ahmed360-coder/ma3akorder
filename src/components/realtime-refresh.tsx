"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  channel: string;
  tables: { table: string; filter?: string }[];
  // Play a short chime when a new row is inserted into the first table (new order alert).
  chimeOnInsert?: boolean;
};

function chime() {
  try {
    const ctx = new AudioContext();
    [0, 0.18].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = i ? 1175 : 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.4);
    });
  } catch {}
}

// Re-renders the current page whenever matching database rows change, via Supabase Realtime.
export function RealtimeRefresh({ channel, tables, chimeOnInsert }: Props) {
  const router = useRouter();
  const key = JSON.stringify(tables);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel(channel);
    const specs: { table: string; filter?: string }[] = JSON.parse(key);
    specs.forEach(({ table, filter }, index) => {
      ch.on("postgres_changes", { event: "*", schema: "public", table, ...(filter ? { filter } : {}) }, (payload) => {
        if (chimeOnInsert && index === 0 && payload.eventType === "INSERT") chime();
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => router.refresh(), 250);
      });
    });
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [channel, key, chimeOnInsert, router]);

  return null;
}
