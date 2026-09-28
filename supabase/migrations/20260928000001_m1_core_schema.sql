-- M3akOrder milestone 1: accounts, roles and core marketplace tables.
-- Every table has Row Level Security. Order placement and status changes
-- get dedicated functions in milestone 3; this migration sets up the data model.

-- ---------- Types ----------
create type public.user_role as enum ('customer', 'business_owner', 'business_staff', 'driver', 'admin');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.order_status as enum (
  'placed', 'accepted', 'rejected', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'
);
create type public.payment_method as enum ('cash', 'card', 'wallet', 'meeza', 'reference_code');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.unit_type as enum ('piece', 'g', 'ml');
create type public.rating_target as enum ('business', 'driver');

-- ---------- Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  approval_status public.approval_status not null default 'approved',
  onboarded boolean not null default false,
  full_name text,
  phone text,
  email text,
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  monthly_budget numeric(10, 2) check (monthly_budget >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper functions. SECURITY DEFINER so policies can read profiles without recursion.
create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false) $$;

create or replace function public.is_approved_driver()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select role = 'driver' and approval_status = 'approved'
                   from public.profiles where id = auth.uid()), false)
$$;

-- Create a profile row whenever someone signs up (email, phone or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, phone, full_name)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users pick their role once, after their first sign-in. Businesses and drivers wait for admin approval.
create or replace function public.complete_onboarding(p_role public.user_role, p_full_name text, p_locale text default 'ar')
returns public.profiles
language plpgsql security definer set search_path = ''
as $$
declare
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_role not in ('customer', 'business_owner', 'driver') then
    raise exception 'Role % cannot be chosen at sign-up', p_role;
  end if;
  update public.profiles
     set role = p_role,
         approval_status = case when p_role = 'customer' then 'approved'::public.approval_status
                                else 'pending'::public.approval_status end,
         full_name = nullif(trim(p_full_name), ''),
         locale = case when p_locale in ('ar', 'en') then p_locale else 'ar' end,
         onboarded = true,
         updated_at = now()
   where id = auth.uid() and onboarded = false
  returning * into result;
  if result.id is null then
    raise exception 'Onboarding already completed';
  end if;
  return result;
end;
$$;

-- Only admins may change role, approval or onboarding flags directly.
-- SECURITY INVOKER on purpose: a signed-in user's update runs as "authenticated",
-- while complete_onboarding (SECURITY DEFINER) and the service role run as other roles.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user = 'authenticated' and not public.is_admin()
     and (new.role is distinct from old.role
          or new.approval_status is distinct from old.approval_status
          or new.onboarded is distinct from old.onboarded) then
    raise exception 'Only an admin can change role or approval status';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- ---------- Businesses ----------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name_ar text not null,
  name_en text,
  description text,
  category text not null default 'restaurant'
    check (category in ('restaurant', 'bakery', 'grocery', 'pharmacy', 'cafe', 'other')),
  logo_url text,
  cover_url text,
  phone text,
  area text not null,
  address text,
  lat double precision,
  lng double precision,
  delivery_radius_km numeric(5, 2) not null default 3,
  opening_hours jsonb not null default '{}'::jsonb,
  is_open boolean not null default false,
  min_order numeric(10, 2) not null default 0 check (min_order >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  prep_minutes integer not null default 20 check (prep_minutes > 0),
  commission_rate numeric(5, 2) not null default 0 check (commission_rate between 0 and 100),
  status public.approval_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index businesses_owner_idx on public.businesses (owner_id);
create index businesses_area_idx on public.businesses (area) where status = 'approved';

create or replace function public.owns_business(p_business_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()) $$;

-- Owners cannot approve themselves or set their own commission (SECURITY INVOKER, see guard_profile_update).
create or replace function public.guard_business_write()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not public.is_admin() and current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.status = 'pending';
      new.commission_rate = 0;
    else
      new.status = old.status;
      new.commission_rate = old.commission_rate;
      new.owner_id = old.owner_id;
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_guard before insert or update on public.businesses
  for each row execute function public.guard_business_write();

alter table public.businesses enable row level security;

create policy "businesses: public reads approved" on public.businesses
  for select to anon, authenticated
  using (status = 'approved' or owner_id = (select auth.uid()) or (select public.is_admin()));
create policy "businesses: owners create" on public.businesses
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select public.my_role()) = 'business_owner');
create policy "businesses: owners update" on public.businesses
  for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()))
  with check (owner_id = (select auth.uid()) or (select public.is_admin()));

-- ---------- Menu ----------
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name_ar text not null,
  name_en text,
  sort_order integer not null default 0
);
create index menu_categories_business_idx on public.menu_categories (business_id);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  category_id uuid references public.menu_categories (id) on delete set null,
  name_ar text not null,
  name_en text,
  description text,
  photo_url text,
  price numeric(10, 2) not null check (price >= 0),
  -- Unit size powers the worth-it check (price per 100 g, per 100 ml or per piece).
  unit_type public.unit_type not null default 'piece',
  unit_amount numeric(10, 2) not null default 1 check (unit_amount > 0),
  options jsonb not null default '[]'::jsonb,
  is_available boolean not null default true,
  -- Optional stock count. Null means "not tracked"; 0 means sold out.
  stock_count integer check (stock_count >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_business_idx on public.items (business_id);
create index items_category_idx on public.items (category_id);

alter table public.menu_categories enable row level security;
alter table public.items enable row level security;

create policy "menu_categories: public reads approved stores" on public.menu_categories
  for select to anon, authenticated
  using (exists (select 1 from public.businesses b where b.id = business_id
                 and (b.status = 'approved' or b.owner_id = (select auth.uid()) or (select public.is_admin()))));
create policy "menu_categories: owners manage" on public.menu_categories
  for all to authenticated
  using ((select public.owns_business(business_id)) or (select public.is_admin()))
  with check ((select public.owns_business(business_id)) or (select public.is_admin()));

create policy "items: public reads approved stores" on public.items
  for select to anon, authenticated
  using (exists (select 1 from public.businesses b where b.id = business_id
                 and (b.status = 'approved' or b.owner_id = (select auth.uid()) or (select public.is_admin()))));
create policy "items: owners manage" on public.items
  for all to authenticated
  using ((select public.owns_business(business_id)) or (select public.is_admin()))
  with check ((select public.owns_business(business_id)) or (select public.is_admin()));

-- ---------- Addresses ----------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Home',
  area text not null,
  street text,
  building text,
  floor text,
  apartment text,
  landmark text,
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);

alter table public.addresses enable row level security;
create policy "addresses: owner manages" on public.addresses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "addresses: admin reads" on public.addresses
  for select to authenticated using ((select public.is_admin()));

-- ---------- Drivers ----------
create table public.drivers (
  id uuid primary key references public.profiles (id) on delete cascade,
  vehicle_type text not null default 'motorcycle'
    check (vehicle_type in ('motorcycle', 'bicycle', 'car', 'walking')),
  national_id_last4 text,
  is_online boolean not null default false,
  last_lat double precision,
  last_lng double precision,
  last_seen_at timestamptz
);

alter table public.drivers enable row level security;
create policy "drivers: self manages" on public.drivers
  for all to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check ((id = (select auth.uid()) and (select public.my_role()) = 'driver') or (select public.is_admin()));

-- ---------- Orders ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  business_id uuid not null references public.businesses (id) on delete restrict,
  driver_id uuid references public.profiles (id) on delete set null,
  -- Snapshot of the address and contact at order time, so drivers and stores
  -- never need to read the customer's profile or saved addresses.
  delivery_address jsonb not null,
  customer_name text,
  customer_phone text,
  status public.order_status not null default 'placed',
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  total numeric(10, 2) not null check (total >= 0),
  payment_method public.payment_method not null default 'cash',
  cash_change_for numeric(10, 2) check (cash_change_for >= 0),
  cash_collected boolean not null default false,
  notes text,
  ready_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_idx on public.orders (customer_id, created_at desc);
create index orders_business_idx on public.orders (business_id, created_at desc);
create index orders_driver_idx on public.orders (driver_id, created_at desc);
create index orders_open_for_drivers_idx on public.orders (status) where driver_id is null;

create or replace function public.can_see_order(p_order_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order_id
      and (o.customer_id = auth.uid()
           or o.driver_id = auth.uid()
           or public.owns_business(o.business_id)
           or public.is_admin())
  )
$$;

alter table public.orders enable row level security;

create policy "orders: parties read" on public.orders
  for select to authenticated
  using (
    customer_id = (select auth.uid())
    or driver_id = (select auth.uid())
    or (select public.owns_business(business_id))
    or (select public.is_admin())
    -- Approved drivers can see orders waiting for a driver.
    or (driver_id is null and status in ('accepted', 'preparing', 'ready') and (select public.is_approved_driver()))
  );
create policy "orders: customers place" on public.orders
  for insert to authenticated
  with check (customer_id = (select auth.uid()) and status = 'placed' and driver_id is null);
create policy "orders: store, driver and admin update" on public.orders
  for update to authenticated
  using ((select public.owns_business(business_id)) or driver_id = (select auth.uid()) or (select public.is_admin()))
  with check ((select public.owns_business(business_id)) or driver_id = (select auth.uid()) or (select public.is_admin()));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  item_id uuid references public.items (id) on delete set null,
  name text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  options jsonb not null default '[]'::jsonb,
  line_total numeric(10, 2) not null check (line_total >= 0)
);
create index order_items_order_idx on public.order_items (order_id);

alter table public.order_items enable row level security;
create policy "order_items: parties read" on public.order_items
  for select to authenticated using ((select public.can_see_order(order_id)));
create policy "order_items: customer adds to own new order" on public.order_items
  for insert to authenticated
  with check (exists (select 1 from public.orders o where o.id = order_id
                      and o.customer_id = (select auth.uid()) and o.status = 'placed'));

-- Every status change is logged, so disputes can be traced.
create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  actor_id uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

alter table public.order_events enable row level security;
create policy "order_events: parties read" on public.order_events
  for select to authenticated using ((select public.can_see_order(order_id)));

-- AFTER trigger for inserts (row must exist for the FK); BEFORE for updates.
create or replace function public.log_order_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.order_events (order_id, status, actor_id) values (new.id, new.status, auth.uid());
  return null;
end;
$$;

create or replace function public.log_order_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_events (order_id, status, actor_id) values (new.id, new.status, auth.uid());
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_log_insert after insert on public.orders
  for each row execute function public.log_order_insert();
create trigger orders_log_update before update on public.orders
  for each row execute function public.log_order_update();

-- ---------- Payments ----------
-- Written only by the server (Edge Functions with the service role) and admins.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  method public.payment_method not null,
  amount numeric(10, 2) not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  provider text,
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);

alter table public.payments enable row level security;
create policy "payments: parties read" on public.payments
  for select to authenticated using ((select public.can_see_order(order_id)));
create policy "payments: admin manages" on public.payments
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Ratings ----------
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  rater_id uuid not null references public.profiles (id) on delete cascade,
  target public.rating_target not null,
  business_id uuid references public.businesses (id) on delete cascade,
  driver_id uuid references public.profiles (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (order_id, target)
);
create index ratings_business_idx on public.ratings (business_id);
create index ratings_driver_idx on public.ratings (driver_id);

alter table public.ratings enable row level security;
create policy "ratings: public reads" on public.ratings
  for select to anon, authenticated using (true);
create policy "ratings: customer rates own delivered order" on public.ratings
  for insert to authenticated
  with check (
    rater_id = (select auth.uid())
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = (select auth.uid()) and o.status = 'delivered'
        and ((target = 'business' and ratings.business_id = o.business_id and ratings.driver_id is null)
             or (target = 'driver' and ratings.driver_id = o.driver_id and ratings.business_id is null))
    )
  );

-- ---------- Realtime ----------
-- Live order status for customers, live incoming orders for stores, live sold-out flags.
alter publication supabase_realtime add table public.orders, public.order_events, public.items;

-- ---------- Function permissions ----------
-- Trigger functions are never called directly; onboarding is for signed-in users only.
revoke execute on function public.handle_new_user(), public.guard_profile_update(), public.guard_business_write(),
  public.log_order_insert(), public.log_order_update() from public, anon, authenticated;
revoke execute on function public.complete_onboarding(public.user_role, text, text) from public, anon;
grant execute on function public.complete_onboarding(public.user_role, text, text) to authenticated;
