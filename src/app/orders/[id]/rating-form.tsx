"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { rateOrder } from "./actions";

export function RatingForm({
  orderId,
  target,
  title,
  labels,
}: {
  orderId: string;
  target: "business" | "driver";
  title: string;
  labels: { comment: string; send: string; thanks: string; stars: string };
}) {
  const [stars, setStars] = useState(0);
  const [state, action, pending] = useActionState(rateOrder, null);
  if (state?.ok) return <p className="card text-positive">{labels.thanks}</p>;
  return (
    <form action={action} className="card flex flex-col gap-3">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="stars" value={stars} />
      <span className="font-bold">{title}</span>
      <div className="flex gap-1" dir="ltr" role="radiogroup" aria-label={labels.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} ${labels.stars}`}
            onClick={() => setStars(n)}
            className={`transition active:scale-90 ${n <= stars ? "text-warning" : "text-line"}`}
          >
            <Star className="h-8 w-8" fill="currentColor" strokeWidth={1.5} />
          </button>
        ))}
      </div>
      {stars > 0 && (
        <>
          <input name="comment" className="input" placeholder={labels.comment} maxLength={300} />
          <button className="btn-primary" disabled={pending}>{pending ? "…" : labels.send}</button>
        </>
      )}
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
