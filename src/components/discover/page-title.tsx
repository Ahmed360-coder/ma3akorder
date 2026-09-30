import { Art } from "@/components/category-icon";

// Heading for the Discover pages: a picture, the title and one line under it.
// No Back link: the Menu button in the header opens the side menu on every page.
export function PageTitle({ title, subtitle, art }: { title: string; subtitle: string; art: string; back?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <span className="float-slow grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-warm/10">
          <Art src={art} className="h-11 w-11" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
