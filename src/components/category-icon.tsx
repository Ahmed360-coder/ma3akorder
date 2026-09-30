import { Coffee, Croissant, CupSoda, Hamburger, Pill, ShoppingBasket, Store, UtensilsCrossed, type LucideProps } from "lucide-react";
import type { BusinessCategory } from "@/lib/types";

const ICONS = { restaurant: Hamburger, bakery: Croissant, grocery: ShoppingBasket, pharmacy: Pill, cafe: Coffee, other: Store };

// Each category gets its own tint so store cards are easy to tell apart at a glance.
export const CATEGORY_TINT: Record<BusinessCategory, string> = {
  restaurant: "#e8590c",
  bakery: "#c97a12",
  grocery: "#12a150",
  pharmacy: "#2f6fdf",
  cafe: "#8a5a3c",
  other: "#7c4dde",
};

export function CategoryIcon({ category, ...props }: { category: BusinessCategory } & LucideProps) {
  const Icon = ICONS[category] ?? Store;
  return <Icon aria-hidden="true" {...props} />;
}

// Realistic pictures (made in Higgsfield, cut out onto transparency), ~10 KB WebP files in /public/art/real.
export const CATEGORY_ART: Record<BusinessCategory, string> = {
  restaurant: "/art/real/burger.webp",
  bakery: "/art/real/bakery.webp",
  grocery: "/art/real/grocery.webp",
  pharmacy: "/art/real/pharmacy.webp",
  cafe: "/art/real/coffee.webp",
  other: "/art/real/shops.webp",
};

export function Art({ src, className = "h-10 w-10" }: { src: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={80} height={80} loading="lazy" decoding="async" draggable={false} className={`select-none object-contain ${className}`} />;
}

// A category picture on a soft beige tile: the one visual style used for stores and categories everywhere.
export function CategoryBadge({ category, name, className = "h-14 w-14 rounded-2xl", iconClass = "h-9 w-9" }: { category: BusinessCategory; name?: string; className?: string; iconClass?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center bg-tile ${className}`}>
      <NameArt name={name} category={category} className={iconClass} />
    </span>
  );
}

// The store's own logo when it uploaded one, otherwise the picture that fits its name.
export function StoreBadge({ category, logo, name, className = "h-14 w-14 rounded-2xl", iconClass = "h-9 w-9" }: { category: BusinessCategory; logo: string | null; name?: string; className?: string; iconClass?: string }) {
  if (!logo) return <CategoryBadge category={category} name={name} className={className} iconClass={iconClass} />;
  return (
    <span className={`block shrink-0 overflow-hidden bg-white ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
    </span>
  );
}

// Name keywords (English and Arabic) mapped to the closest realistic picture, first match wins.
// null marks foods we have no fitting picture for yet, so they get a plain icon instead of a wrong picture.
const NAME_ART: [RegExp, string | null][] = [
  [/fish|sea ?bass|tilapia|sea breeze|سمك|أسماك|قاروص|بلطي/i, "/art/real/fish.webp"],
  [/calamari|shrimp|seafood|كاليماري|جمبري|صيادية/i, "/art/real/calamari.webp"],
  [/shawarma|شاورما/i, "/art/real/shawarma.webp"],
  [/smoothie|strawberry|سموذي|فراولة/i, "/art/real/smoothie.webp"],
  [/lemon|mint lemonade|green juice|ليمون/i, "/art/real/green-juice.webp"],
  [/juice|عصير/i, "/art/real/juice.webp"],
  [/milkshake|shake|ميلك شيك/i, "/art/real/milkshake.webp"],
  [/fries|محمرة/i, "/art/real/fries.webp"],
  [/pasta|penne|macaroni|مكرونة/i, "/art/real/pasta.webp"],
  [/(?<!fruit )salad|fattoush|سلطة|فتوش/i, "/art/real/salad.webp"],
  [/kofta|meatball|كفتة/i, "/art/real/kofta.webp"],
  [/waffle|crepe|وافل|كريب/i, "/art/real/waffle.webp"],
  [/ice ?cream|gelato|آيس كريم|جيلاتو/i, "/art/real/ice-cream.webp"],
  [/\broses?\b|\bflowers?\b|bouquet|bloom|ورد|بوكيه/i, "/art/real/flowers.webp"],
  [/\bnuts\b|peanut|مكسرات|سوداني/i, "/art/real/nuts.webp"],
  [/koshary|كشري/i, "/art/real/koshary.webp"],
  [/pizza|بيتزا/i, "/art/real/pizza.webp"],
  [/burger|برجر/i, "/art/real/burger.webp"],
  [/croissant|كرواسون/i, "/art/real/bakery.webp"],
  [/feteer|pastry|فطير/i, "/art/real/croissant.webp"],
  [/bread|fino|عيش|فينو/i, "/art/real/bread.webp"],
  [/cake|velvet|brownie|petit four|patisserie|تورت|كيك|فيلفيت|براونيز|بيتي فور/i, "/art/real/cake.webp"],
  [/chicken|grill|فراخ|فرخة|جريل|مشويات/i, "/art/real/chicken.webp"],
  [/coffee|espresso|cappuccino|latte|mocha|\btea\b|hot chocolate|sahlab|karkade|قهوة|كوفي|إسبريسو|كابتشينو|لاتيه|موكا|شاي|هوت شوكليت|سحلب|كركديه/i, "/art/real/coffee.webp"],
  [/apple|تفاح/i, "/art/real/apple.webp"],
  [/tomato|potato|cucumber|banana|orange|mango|vegetable|fruit|green basket|طماطم|بطاطس|خيار|موز|برتقال|مانجو|خضار|فاكهة|فروت/i, "/art/real/grocery.webp"],
  [/\bcheese\b|جبن/i, "/art/real/cheese.webp"],
  [/\bmilk\b|حليب|لبن كامل/i, "/art/real/milk.webp"],
  [/\beggs?\b|بيض/i, "/art/real/eggs.webp"],
  [/molokhia|ملوخية/i, "/art/real/molokhia.webp"],
  [/\brice\b(?! pudding)|أرز(?! باللبن)/i, "/art/real/rice.webp"],
  [/chocolate box|chocolates\b|علبة شوكولاتة/i, "/art/real/chocolate.webp"],
  [/candy|gummy|jelly|حلوى|جيلي/i, "/art/real/candy.webp"],
  [/succulent|cactus|صبار/i, "/art/real/succulent.webp"],
  [/orchid|أوركيد/i, "/art/real/orchid.webp"],
  [/paracetamol|vitamin|tablet|capsule|قرص|فيتامين|كبسول/i, "/art/real/pills.webp"],
  [/lotion|sunscreen|toothpaste|sanitizer|shampoo|spray|لوشن|واقي|معجون|مطهر|شامبو|بخاخ/i, "/art/real/pharmacy.webp"],
];

// Categories whose own picture is generic enough to stand in for any of their products.
const GENERIC_ART = new Set<BusinessCategory>(["bakery", "grocery", "pharmacy"]);
const FALLBACK_ICONS = { restaurant: UtensilsCrossed, bakery: Croissant, grocery: ShoppingBasket, pharmacy: Pill, cafe: CupSoda, other: Store };

// The picture that fits a dish or store name, or null when none fits and a plain icon should show.
export function pickArt(name: string | null | undefined, category: BusinessCategory): string | null {
  if (!name) return CATEGORY_ART[category];
  for (const [re, src] of NAME_ART) if (re.test(name)) return src;
  return GENERIC_ART.has(category) ? CATEGORY_ART[category] : null;
}

// The picture matching the name, or a quiet category icon when we have no picture for it.
export function NameArt({ name, category, className = "h-10 w-10" }: { name: string | null | undefined; category: BusinessCategory; className?: string }) {
  const src = pickArt(name, category);
  if (src) return <Art src={src} className={className} />;
  const Icon = FALLBACK_ICONS[category] ?? Store;
  return <Icon aria-hidden="true" strokeWidth={1.5} className={`${className} scale-75 text-muted`} />;
}
