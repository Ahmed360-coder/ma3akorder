import Link from "next/link";
import { Art } from "@/components/category-icon";
import type { Extras } from "@/lib/i18n/extras";

const TILES = [
  { key: "group", href: "/group", art: "/art/real/pizza.webp", bg: "linear-gradient(135deg, #e8474f, #9c1520)" },
  { key: "voice", href: "/voice", art: "/art/real/coffee.webp", bg: "linear-gradient(135deg, #3b82f6, #1e3a8a)" },
  { key: "crave", href: "/crave", art: "/art/real/burger.webp", bg: "linear-gradient(135deg, #fb7185, #9f1239)" },
  { key: "trending", href: "/trending", art: "/art/real/chicken.webp", bg: "linear-gradient(135deg, #f59e0b, #b45309)" },
  { key: "spin", href: "/spin", art: "/art/slot_machine.webp", bg: "linear-gradient(135deg, #ff8a2b, #e8590c)" },
  { key: "feed", href: "/feed", art: "/art/money_bag.webp", bg: "linear-gradient(135deg, #3cc878, #0a7a3c)" },
  { key: "rewards", href: "/rewards", art: "/art/trophy.webp", bg: "linear-gradient(135deg, #f7b733, #c97a12)" },
  { key: "favorites", href: "/favorites", art: "/art/red_heart.webp", bg: "linear-gradient(135deg, #f472b6, #be123c)" },
  { key: "guide", href: "/nearby", art: "/art/pizza.webp", bg: "linear-gradient(135deg, #6b3fd4, #3b1f8f)" },
] as const;

// Home page row linking to every standout feature (same list as the side menu Discover group).
export function DiscoverRow({ x }: { x: Extras["discover"] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-extrabold">{x.title}</h2>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {TILES.map((tile, i) => {
          const text = x[tile.key];
          return (
            <Link
              key={tile.key}
              href={tile.href}
              className="stagger group relative isolate flex h-28 w-40 shrink-0 snap-start flex-col justify-end overflow-hidden rounded-2xl p-3 text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 active:scale-[0.97] sm:w-44"
              style={{ background: tile.bg, "--i": i } as React.CSSProperties}
            >
              <Art src={tile.art} className="absolute -end-2 -top-2 -z-10 h-20 w-20 drop-shadow-lg transition duration-300 group-hover:rotate-12 group-hover:scale-110" />
              <span className="text-base font-extrabold leading-tight">{text.title}</span>
              <span className="text-xs opacity-90">{text.body}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
