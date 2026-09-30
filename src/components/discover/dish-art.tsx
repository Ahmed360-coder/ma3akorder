import { NameArt } from "@/components/category-icon";
import type { BusinessCategory } from "@/lib/types";

// The dish photo when the store uploaded one, otherwise the picture that fits the dish name.
export function DishArt({ photo, name, category, className = "h-16 w-16 rounded-2xl" }: { photo: string | null; name?: string; category: BusinessCategory; className?: string }) {
  if (photo)
    return (
      <span className={`block shrink-0 overflow-hidden bg-white ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </span>
    );
  return (
    <span className={`grid shrink-0 place-items-center bg-warm/10 ${className}`}>
      <NameArt name={name} category={category} className="h-3/5 w-3/5" />
    </span>
  );
}
