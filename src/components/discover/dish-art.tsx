import { Art, CATEGORY_ART } from "@/components/category-icon";
import type { BusinessCategory } from "@/lib/types";

// The dish photo when the store uploaded one, otherwise the store's category picture.
export function DishArt({ photo, category, className = "h-16 w-16 rounded-2xl" }: { photo: string | null; category: BusinessCategory; className?: string }) {
  if (photo)
    return (
      <span className={`block shrink-0 overflow-hidden bg-white ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </span>
    );
  return (
    <span className={`grid shrink-0 place-items-center bg-warm/10 ${className}`}>
      <Art src={CATEGORY_ART[category]} className="h-3/5 w-3/5" />
    </span>
  );
}
