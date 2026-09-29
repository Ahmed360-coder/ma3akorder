// Turns a spoken or typed request ("pizza under 150", "عايز شاورما لـ 3") into a dish search.

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Words for the same food in English and Egyptian Arabic, so either language finds either menu.
const SYNONYMS: string[][] = [
  ["pizza", "بيتزا"],
  ["burger", "برجر", "برغر", "همبرجر"],
  ["chicken", "فراخ", "دجاج", "فرخه", "تشيكن"],
  ["shawarma", "شاورما", "شاورمه"],
  ["koshary", "koshari", "كشري"],
  ["falafel", "taameya", "طعميه", "فلافل"],
  ["foul", "fool", "فول"],
  ["coffee", "قهوه", "كافيه", "كوفي"],
  ["tea", "شاي"],
  ["juice", "عصير"],
  ["cake", "كيك", "تورته", "جاتوه"],
  ["sweet", "dessert", "حلو", "حلويات", "حلوه", "sweets"],
  ["bread", "عيش", "خبز"],
  ["croissant", "كرواسون"],
  ["feteer", "فطير", "فطيره"],
  ["pasta", "مكرونه", "باستا"],
  ["rice", "رز", "ارز"],
  ["fish", "سمك"],
  ["meat", "beef", "لحمه", "لحم"],
  ["sandwich", "ساندوتش", "سندوتش", "ساندويتش"],
  ["salad", "سلطه"],
  ["fries", "بطاطس"],
  ["milk", "لبن", "حليب"],
  ["water", "مياه", "ميه"],
  ["pepsi", "cola", "بيبسي", "كولا", "soda"],
  ["breakfast", "فطار"],
  ["medicine", "دوا", "دواء", "pharmacy", "صيدليه"],
].map((g) => g.map(normalize));

// Words that carry no dish meaning.
const STOP = new Set(
  ["i", "want", "a", "an", "the", "some", "please", "for", "me", "get", "order", "something", "give", "with", "and", "under", "below", "less", "than", "max", "egp", "pounds", "pound", "people", "persons", "of",
   "عايز", "عاوز", "عايزه", "عاوزه", "اريد", "ابغي", "لو", "سمحت", "من", "فضلك", "حاجه", "هات", "اطلب", "اقل", "تحت", "بأقل", "باقل", "باقصي", "جنيه", "ج", "افراد", "اشخاص", "نفر", "في", "و", "لي", "ليا", "بس", "واحد", "واحده"].map(normalize),
);

export type VoiceQuery = { terms: string[][]; maxPrice: number | null; people: number | null };

export function parseRequest(raw: string): VoiceQuery {
  const text = normalize(raw);
  let maxPrice: number | null = null;
  let people: number | null = null;

  const priceMatch = text.match(/(?:under|below|less than|max|اقل من|باقل من|بأقل من|تحت|في حدود|حدود)\s*(\d{2,5})/);
  if (priceMatch) maxPrice = Number(priceMatch[1]);
  const peopleMatch = text.match(/(?:for|ل|لـ)\s*(\d{1,2})\s*(?:people|persons|افراد|اشخاص|نفر)?/) ?? text.match(/(\d{1,2})\s*(?:people|persons|افراد|اشخاص|نفر)/);
  if (peopleMatch && Number(peopleMatch[1]) <= 20 && Number(peopleMatch[1]) >= 2) people = Number(peopleMatch[1]);
  // A lone number that isn't people is a price ("pizza 150").
  if (maxPrice === null) {
    const n = text.match(/\b(\d{2,5})\b/);
    if (n && Number(n[1]) !== people) maxPrice = Number(n[1]);
  }

  const words = text
    .replace(/\d+/g, " ")
    .split(" ")
    .map((w) => w.replace(/^(وال|ال)(?=\S{3,})/, ""))
    .filter((w) => w.length > 1 && !STOP.has(w));
  // Each word becomes its group of synonyms, so "فراخ" also matches "Chicken".
  const terms = words.map((w) => SYNONYMS.find((g) => g.some((s) => s === w || (s.length > 3 && (w.startsWith(s) || s.startsWith(w))))) ?? [w]);
  return { terms, maxPrice, people };
}

// A dish matches when every requested term hits its name or store name.
export function matches(q: VoiceQuery, haystack: string) {
  const h = normalize(haystack);
  return q.terms.every((group) => group.some((s) => h.includes(s)));
}
