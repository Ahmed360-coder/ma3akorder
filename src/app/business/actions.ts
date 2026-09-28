"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyBusiness } from "@/lib/business";

const CATEGORIES = ["restaurant", "bakery", "grocery", "pharmacy", "cafe", "other"];

function text(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  return v || null;
}
function num(form: FormData, key: string, fallback = 0) {
  const v = Number(form.get(key));
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

function storeFields(form: FormData) {
  const category = String(form.get("category"));
  return {
    name_ar: text(form, "name_ar") ?? "",
    name_en: text(form, "name_en"),
    description: text(form, "description"),
    category: CATEGORIES.includes(category) ? category : "other",
    phone: text(form, "phone"),
    area: text(form, "area") ?? "",
    address: text(form, "address"),
    min_order: num(form, "min_order"),
    delivery_fee: num(form, "delivery_fee"),
    prep_minutes: Math.max(1, Math.round(num(form, "prep_minutes", 20))),
  };
}

export async function createBusiness(form: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("businesses").insert({ owner_id: user.id, ...storeFields(form) });
  if (error) throw new Error(error.message);
  revalidatePath("/business", "layout");
  redirect("/business/menu");
}

export async function updateBusiness(_: unknown, form: FormData) {
  const business = await getMyBusiness();
  if (!business) return { error: "No store", ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("businesses").update(storeFields(form)).eq("id", business.id);
  revalidatePath("/business", "layout");
  return { error: error?.message ?? null, ok: !error };
}

export async function setStoreOpen(open: boolean) {
  const business = await getMyBusiness();
  if (!business) return { error: "No store" };
  const supabase = await createClient();
  const { error } = await supabase.from("businesses").update({ is_open: open }).eq("id", business.id);
  revalidatePath("/business", "layout");
  return { error: error?.message ?? null };
}

export async function saveItem(_: unknown, form: FormData) {
  const business = await getMyBusiness();
  if (!business) return { error: "No store", ok: false };
  const supabase = await createClient();

  const id = text(form, "id");
  const unit = String(form.get("unit_type"));
  const stockRaw = String(form.get("stock_count") ?? "").trim();
  const fields: Record<string, unknown> = {
    name_ar: text(form, "name_ar") ?? "",
    name_en: text(form, "name_en"),
    description: text(form, "description"),
    price: num(form, "price"),
    unit_type: ["piece", "g", "ml"].includes(unit) ? unit : "piece",
    unit_amount: Math.max(0.01, num(form, "unit_amount", 1)),
    stock_count: stockRaw === "" ? null : Math.max(0, Math.round(Number(stockRaw))),
  };
  if (fields.stock_count !== null) fields.is_available = (fields.stock_count as number) > 0;

  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const path = `${business.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("item-photos").upload(path, photo, { contentType: photo.type });
    if (error) return { error: error.message, ok: false };
    fields.photo_url = supabase.storage.from("item-photos").getPublicUrl(path).data.publicUrl;
  }

  const { error } = id
    ? await supabase.from("items").update(fields).eq("id", id).eq("business_id", business.id)
    : await supabase.from("items").insert({ ...fields, business_id: business.id });
  revalidatePath("/business/menu");
  return { error: error?.message ?? null, ok: !error };
}

export async function setItemAvailable(id: string, available: boolean) {
  const supabase = await createClient();
  const patch: Record<string, unknown> = { is_available: available };
  // Turning a counted item back on with zero stock would sell nothing; stop counting instead.
  if (available) {
    const { data } = await supabase.from("items").select("stock_count").eq("id", id).single();
    if (data?.stock_count === 0) patch.stock_count = null;
  }
  const { error } = await supabase.from("items").update(patch).eq("id", id);
  revalidatePath("/business/menu");
  return { error: error?.message ?? null };
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", id);
  revalidatePath("/business/menu");
  return { error: error?.message ?? null };
}
