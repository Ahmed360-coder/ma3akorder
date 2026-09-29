import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Art } from "@/components/category-icon";

// Heading for the Discover pages: a back link, a 3D picture, the title and one line under it.
export function PageTitle({ title, subtitle, art, back }: { title: string; subtitle: string; art: string; back: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Link href="/" className="inline-flex w-fit items-center gap-1.5 rounded-xl px-2 py-1 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        {back}
      </Link>
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
