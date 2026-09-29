export type OrderStatus = "placed" | "accepted" | "rejected" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled";
export type BusinessCategory = "restaurant" | "bakery" | "grocery" | "pharmacy" | "cafe" | "other";
export type UnitType = "piece" | "g" | "ml";

export type Business = {
  id: string;
  owner_id: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  category: BusinessCategory;
  logo_url: string | null;
  phone: string | null;
  area: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  delivery_radius_km: number;
  is_demo: boolean;
  is_open: boolean;
  min_order: number;
  delivery_fee: number;
  prep_minutes: number;
  status: "pending" | "approved" | "rejected" | "suspended";
  created_at: string;
};

export type Item = {
  id: string;
  business_id: string;
  category_id: string | null;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  photo_url: string | null;
  price: number;
  unit_type: UnitType;
  unit_amount: number;
  is_available: boolean;
  stock_count: number | null;
  sort_order: number;
};

export type DeliveryAddress = { area: string; street?: string; floor_apt?: string; landmark?: string; lat?: number; lng?: number };

export type Order = {
  id: string;
  code: string;
  customer_id: string;
  business_id: string;
  driver_id: string | null;
  delivery_address: DeliveryAddress;
  customer_name: string | null;
  customer_phone: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  cash_change_for: number | null;
  cash_collected: boolean;
  notes: string | null;
  created_at: string;
};

export type OrderItem = { id: string; order_id: string; item_id: string | null; name: string; unit_price: number; quantity: number; line_total: number };
export type OrderEvent = { id: number; order_id: string; status: OrderStatus; note: string | null; created_at: string };

export const ACTIVE_STATUSES: OrderStatus[] = ["placed", "accepted", "preparing", "ready", "picked_up"];
