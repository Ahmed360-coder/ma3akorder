import { Coffee, Croissant, Hamburger, Pill, ShoppingBasket, Store, type LucideProps } from "lucide-react";
import type { BusinessCategory } from "@/lib/types";

const ICONS = { restaurant: Hamburger, bakery: Croissant, grocery: ShoppingBasket, pharmacy: Pill, cafe: Coffee, other: Store };

// Each category gets its own tint so store cards are easy to tell apart at a glance.
export const CATEGORY_TINT: Record<BusinessCategory, string> = {
  restaurant: "#e8590c",
  bakery: "#c97a12",
  grocery: "#12a150",
  pharmacy: "#2f6fdf",
  cafe: "#8a5a3c",
  other: "#7c4dde",
};

export function CategoryIcon({ category, ...props }: { category: BusinessCategory } & LucideProps) {
  const Icon = ICONS[category] ?? Store;
  return <Icon aria-hidden="true" {...props} />;
}

// 3D illustrations (Microsoft Fluent Emoji, MIT licence), self-hosted as ~5 KB WebP files in /public/art.
export const CATEGORY_ART: Record<BusinessCategory, string> = {
  restaurant: "/art/hamburger.webp",
  bakery: "/art/croissant.webp",
  grocery: "/art/shopping_cart.webp",
  pharmacy: "/art/pill.webp",
  cafe: "/art/hot_beverage.webp",
  other: "/art/shopping_bags.webp",
};

export function Art({ src, className = "h-10 w-10" }: { src: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={80} height={80} loading="lazy" decoding="async" draggable={false} className={`select-none object-contain ${className}`} />;
}

// A category picture on a soft tinted tile: the one visual style used for stores and categories everywhere.
export function CategoryBadge({ category, className = "h-14 w-14 rounded-2xl", iconClass = "h-9 w-9" }: { category: BusinessCategory; className?: string; iconClass?: string }) {
  const tint = CATEGORY_TINT[category];
  return (
    <span className={`grid shrink-0 place-items-center ${className}`} style={{ background: `color-mix(in oklab, ${tint} 10%, white)` }}>
      <Art src={CATEGORY_ART[category]} className={iconClass} />
    </span>
  );
}
