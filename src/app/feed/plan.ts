import type { Dish, DiscoverStore } from "@/lib/discover";

export type Meal = { store: DiscoverStore; lines: { dish: Dish; qty: number }[]; subtotal: number; total: number; left: number };

const stockLeft = (d: Dish) => d.stock ?? 50;

// The best meal one store can make for `people` within `budget` (delivery included), or null.
// Everyone gets a main dish (the priciest one that fits for all), then the leftover money buys
// different extras, priciest first, so the budget is used well and the meal has some variety.
export function planMeal(store: DiscoverStore, dishes: Dish[], people: number, budget: number): Meal | null {
  const money = budget - store.fee;
  if (money <= 0 || !dishes.length) return null;
  const byPrice = [...dishes].sort((a, b) => b.price - a.price);
  let best: Meal | null = null;

  for (const main of byPrice) {
    if (main.price * people > money || stockLeft(main) < people) continue;
    const lines = [{ dish: main, qty: people }];
    let rest = money - main.price * people;
    for (const extra of byPrice) {
      if (extra.itemId === main.itemId) continue;
      const qty = Math.min(people, stockLeft(extra), Math.floor(rest / extra.price));
      if (qty <= 0) continue;
      lines.push({ dish: extra, qty });
      rest -= qty * extra.price;
    }
    const subtotal = money - rest;
    if (subtotal < store.minOrder) continue;
    const meal = { store, lines, subtotal, total: subtotal + store.fee, left: rest };
    // Prefer the meal that uses more of the budget; on a tie, the one with more variety.
    if (!best || meal.subtotal > best.subtotal || (meal.subtotal === best.subtotal && meal.lines.length > best.lines.length)) best = meal;
  }
  return best;
}
