"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "./logo";

// Six real food pictures that pop in around the logo, like a plate being laid out.
const FOODS = ["burger", "pizza", "shawarma", "coffee", "croissant", "fries"];

// Opening animation, about 2 seconds, once per browser session.
// It is drawn by the server and animated with CSS only, so it shows on the first paint
// and the page keeps loading underneath. A script in <head> hides it for repeat visits
// and for people who turned motion off. A tap skips it.
export function Splash({ name, tagline, byline }: { name: string; tagline: string; byline: string }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 2500);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="splash" aria-hidden="true" onClick={() => setGone(true)}>
      {/* Moving navy backdrop: slow light rays, three drifting glows and a fine dot grid. */}
      <span className="splash-bg">
        <span className="splash-rays" />
        <span className="splash-glow splash-glow-1" />
        <span className="splash-glow splash-glow-2" />
        <span className="splash-glow splash-glow-3" />
        <span className="splash-dots" />
      </span>
      <div className="splash-stage">
        <span className="splash-ring" />
        <span className="splash-ring splash-ring-2" />
        {FOODS.map((f, i) => (
          <span key={f} className="splash-food" style={{ "--a": `${i * 60 - 90}deg`, "--i": i } as React.CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/art/real/${f}.webp`} alt="" width={160} height={160} />
          </span>
        ))}
        <span className="splash-logo">
          <LogoMark className="h-full w-full" />
        </span>
      </div>
      <p className="splash-name">{name}</p>
      <p className="splash-tagline">{tagline}</p>
      <span className="splash-bar" />
      <p className="splash-byline">{byline}</p>
    </div>
  );
}

// Runs before the page paints: skip the animation on repeat visits in the same session,
// and for people who asked their phone for less motion.
export const SPLASH_SCRIPT = `try{var d=document.documentElement;if(sessionStorage.getItem("m3akorder.splash")||matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-splash","off")}else{sessionStorage.setItem("m3akorder.splash","1")}}catch(e){}`;
