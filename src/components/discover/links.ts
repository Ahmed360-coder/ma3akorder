import type { Extras } from "@/lib/i18n/extras";

// Every standout feature, in menu order. Add a new feature here and it shows in the side menu's Discover group.
export const DISCOVER_LINKS = [
  { key: "group", href: "/group", icon: "users" },
  { key: "voice", href: "/voice", icon: "mic" },
  { key: "crave", href: "/crave", icon: "flame" },
  { key: "trending", href: "/trending", icon: "trending" },
  { key: "spin", href: "/spin", icon: "dices" },
  { key: "feed", href: "/feed", icon: "piggy" },
  { key: "rewards", href: "/rewards", icon: "trophy" },
  { key: "favorites", href: "/favorites", icon: "heart" },
  { key: "guide", href: "/nearby", icon: "utensils" },
] as const;

export type DiscoverIcon = (typeof DISCOVER_LINKS)[number]["icon"];
export type DiscoverMenu = { title: string; items: { href: string; label: string; icon: DiscoverIcon }[] };

export function discoverMenu(x: Extras["discover"]): DiscoverMenu {
  return { title: x.title, items: DISCOVER_LINKS.map((l) => ({ href: l.href, label: x[l.key].title, icon: l.icon })) };
}
