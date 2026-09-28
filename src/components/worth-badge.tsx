import { fill } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { BusinessCategory, UnitType } from "@/lib/types";

export type ValueScore = { item_id: string; diff_pct: number; sample: number };

// Rule-based worth-it label: within ±10% of the usual unit price is "fair".
export function WorthBadge({ score, unit, category, t }: { score?: ValueScore; unit: UnitType; category: BusinessCategory; t: Dictionary }) {
  if (!score) return null;
  const pct = Number(score.diff_pct);
  const vars = { n: Math.abs(pct), unit: t.worth.per[unit], category: t.categories[category] };
  const [label, tone, reason] =
    pct <= -10
      ? [t.worth.great, "bg-positive/15 text-positive", fill(t.worth.cheaper, vars)]
      : pct >= 15
        ? [t.worth.pricey, "bg-warning/15 text-warning", fill(t.worth.dearer, vars)]
        : [t.worth.fair, "bg-surface-2 text-muted", fill(t.worth.same, vars)];
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
      <span className={`rounded-full px-2 py-0.5 font-bold ${tone}`}>{label}</span>
      <span className="text-muted">{reason}</span>
    </div>
  );
}
