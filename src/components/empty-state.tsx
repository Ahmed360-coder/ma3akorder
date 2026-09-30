import { Art } from "./category-icon";

// One look for "nothing here yet" moments: a real picture on a cream tile, then the message.
export function EmptyState({ text, art = "/art/real/shops.webp", children }: { text: string; art?: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-8 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl bg-tile">
        <Art src={art} className="h-14 w-14" />
      </span>
      <p className="max-w-xs text-muted">{text}</p>
      {children}
    </div>
  );
}
