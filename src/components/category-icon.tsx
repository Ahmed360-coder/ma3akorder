import { Coffee, Croissant, Pill, ShoppingBasket, Store, UtensilsCrossed, type LucideProps } from "lucide-react";
import type { BusinessCategory } from "@/lib/types";

const ICONS = { restaurant: UtensilsCrossed, bakery: Croissant, grocery: ShoppingBasket, pharmacy: Pill, cafe: Coffee, other: Store };

// Each category gets its own warm tint so store cards are easy to tell apart at a glance.
export const CATEGORY_TINT: Record<BusinessCategory, string> = {
  restaurant: "#ff7a45",
  bakery: "#f5b35b",
  grocery: "#4fd1a5",
  pharmacy: "#6aa8ff",
  cafe: "#c48a5a",
  other: "#b58cff",
};

export function CategoryIcon({ category, ...props }: { category: BusinessCategory } & LucideProps) {
  const Icon = ICONS[category] ?? Store;
  return <Icon aria-hidden="true" {...props} />;
}
