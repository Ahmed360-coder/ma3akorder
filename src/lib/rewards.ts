// Points, levels and badges, worked out from a customer's own delivered orders.
// Nothing is stored: the numbers always match the order history.

export type RewardOrder = { total: number; created_at: string; business_id: string };

export const LEVELS = [0, 100, 300, 700, 1500];

export const BADGES = [
  { id: "first", art: "/art/party_popper.webp" },
  { id: "five", art: "/art/sports_medal.webp" },
  { id: "twenty", art: "/art/trophy.webp" },
  { id: "explorer", art: "/art/rocket.webp" },
  { id: "local", art: "/art/crown.webp" },
  { id: "budget", art: "/art/money_bag.webp" },
  { id: "night", art: "/art/owl.webp" },
  { id: "early", art: "/art/sunrise.webp" },
  { id: "reviewer", art: "/art/pencil.webp" },
  { id: "weekend", art: "/art/sparkles.webp" },
] as const;

export type BadgeId = (typeof BADGES)[number]["id"];

// Hour and weekday in Cairo, whatever time zone the server runs in.
function cairo(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "numeric", hourCycle: "h23", weekday: "short", year: "numeric", month: "numeric" }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { hour: Number(get("hour")), weekday: get("weekday"), month: `${get("year")}-${get("month")}` };
}

function weekIndex(d: Date) {
  // Weeks counted from a fixed Saturday, the start of the week in Egypt.
  return Math.floor((d.getTime() - Date.UTC(2024, 0, 6)) / (7 * 86400000));
}

export function computeRewards(orders: RewardOrder[], ratingsGiven: number, monthlyBudget: number | null, now = new Date()) {
  const stores = new Set(orders.map((o) => o.business_id));
  const byMonth = new Map<string, number>();
  for (const o of orders) {
    const k = cairo(o.created_at).month;
    byMonth.set(k, (byMonth.get(k) ?? 0) + Number(o.total));
  }
  const thisMonth = cairo(now.toISOString()).month;
  const underBudgetMonths = monthlyBudget ? [...byMonth].filter(([k, total]) => k !== thisMonth && total <= monthlyBudget).length : 0;

  const spendPoints = orders.reduce((n, o) => n + Math.floor(Number(o.total) / 10), 0);
  const points = spendPoints + stores.size * 25 + underBudgetMonths * 50;

  const level = LEVELS.filter((min) => points >= min).length - 1;
  const nextAt = LEVELS[level + 1] ?? null;
  const floor = LEVELS[level];
  const progress = nextAt === null ? 1 : (points - floor) / (nextAt - floor);

  // Weeks in a row (ending this week or last week) with at least one order.
  const weeks = new Set(orders.map((o) => weekIndex(new Date(o.created_at))));
  let w = weekIndex(now);
  if (!weeks.has(w)) w -= 1;
  let streak = 0;
  while (weeks.has(w)) {
    streak++;
    w--;
  }

  const times = orders.map((o) => cairo(o.created_at));
  const unlocked: Record<BadgeId, boolean> = {
    first: orders.length >= 1,
    five: orders.length >= 5,
    twenty: orders.length >= 20,
    explorer: stores.size >= 3,
    local: stores.size >= 5,
    budget: underBudgetMonths >= 1,
    night: times.some((t) => t.hour >= 23 || t.hour < 4),
    early: times.some((t) => t.hour >= 4 && t.hour < 9),
    reviewer: ratingsGiven >= 3,
    weekend: times.some((t) => t.weekday === "Fri"),
  };

  return { points, level, nextAt, progress, streak, unlocked, orders: orders.length, stores: stores.size };
}
