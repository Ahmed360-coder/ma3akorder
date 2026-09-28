import { formatEGP, formatTime } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Order, OrderItem } from "@/lib/types";

const TONE: Record<string, string> = {
  placed: "bg-accent/15 text-accent",
  accepted: "bg-warning/15 text-warning",
  preparing: "bg-warning/15 text-warning",
  ready: "bg-positive/15 text-positive",
  picked_up: "bg-positive/15 text-positive",
  delivered: "bg-surface-2 text-muted",
  rejected: "bg-danger/15 text-danger",
  cancelled: "bg-danger/15 text-danger",
};

export function StatusPill({ status, t }: { status: Order["status"]; t: Dictionary }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${TONE[status]}`}>{t.statuses[status]}</span>;
}

// Order summary used by the store, the driver and the admin.
export function OrderCard({
  order,
  items,
  t,
  locale,
  children,
  showAddress = true,
}: {
  order: Order;
  items?: OrderItem[];
  t: Dictionary;
  locale: string;
  children?: React.ReactNode;
  showAddress?: boolean;
}) {
  const a = order.delivery_address;
  return (
    <article className="card flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm text-muted">#{order.code}</span>
        <StatusPill status={order.status} t={t} />
      </div>
      {items && items.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span>
                <b>{i.quantity}×</b> {i.name}
              </span>
              <span className="text-muted">{formatEGP(i.line_total, locale)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-between border-t border-line pt-2 font-bold">
        <span>{t.cart.total}</span>
        <span>{formatEGP(order.total, locale)}</span>
      </div>
      {showAddress && (
        <div className="text-sm text-muted">
          <div>
            {order.customer_name} · <a href={`tel:${order.customer_phone}`} dir="ltr" className="text-foreground underline">{order.customer_phone}</a>
          </div>
          <div>
            {t.orders.deliverTo}: {[a.area, a.street, a.floor_apt, a.landmark].filter(Boolean).join("، ")}
          </div>
          {order.cash_change_for && (
            <div>
              {t.orders.payWith}: {formatEGP(order.cash_change_for, locale)}
            </div>
          )}
          {order.notes && (
            <div>
              {t.orders.notes}: {order.notes}
            </div>
          )}
        </div>
      )}
      <div className="text-xs text-muted">{formatTime(order.created_at, locale)}</div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </article>
  );
}
