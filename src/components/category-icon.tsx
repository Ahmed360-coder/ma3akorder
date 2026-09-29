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

// A category icon on a soft tinted tile: the one visual style used for stores and categories everywhere.
export function CategoryBadge({ category, className = "h-14 w-14 rounded-2xl", iconClass = "h-7 w-7" }: { category: BusinessCategory; className?: string; iconClass?: string }) {
  const tint = CATEGORY_TINT[category];
  return (
    <span className={`grid shrink-0 place-items-center ${className}`} style={{ color: tint, background: `color-mix(in oklab, ${tint} 12%, white)` }}>
      <CategoryIcon category={category} className={iconClass} strokeWidth={1.75} />
    </span>
  );
}
