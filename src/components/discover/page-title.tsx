import { Art } from "@/components/category-icon";

// Heading for the Discover pages: a picture, the title and one line under it.
// No Back link: the Menu button in the header opens the side menu on every page.
export function PageTitle({ title, subtitle, art }: { title: string; subtitle: string; art: string; back?: string }) {
  return (
    <div className="glass rounded-3xl border border-line/70 p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-tile shadow-[inset_0_0_0_1px_var(--line)]">
          <Art src={art} className="h-11 w-11" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-0.5 text-sm leading-snug text-muted">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
