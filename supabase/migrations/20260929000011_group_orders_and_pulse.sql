-- Order together (shared group baskets) and the neighbourhood pulse (what's trending nearby).
-- Both are reached only through the functions below; the tables have RLS on and no policies.

-- ---------- Neighbourhood pulse ----------
-- Aggregate counts only: no customer ids, names or addresses ever leave this function.
create or replace function public.neighbourhood_pulse(p_limit int default 10)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'orders_today', (
      select count(*) from public.orders o
      where o.created_at > now() - interval '24 hours' and o.status not in ('rejected', 'cancelled')
    ),
    'orders_week', (
      select count(*) from public.orders o
      where o.created_at > now() - interval '7 days' and o.status not in ('rejected', 'cancelled')
    ),
    'top', coalesce((
      select jsonb_agg(t order by t.orders desc, t.qty desc)
      from (
        select i.id as item_id, i.business_id, i.name_ar, i.name_en, i.price, i.photo_url, i.stock_count,
               count(distinct o.id) as orders, sum(oi.quantity) as qty,
               max(o.created_at) as last_at
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        join public.items i on i.id = oi.item_id
        join public.businesses b on b.id = i.business_id
        where o.created_at > now() - interval '7 days'
          and o.status not in ('rejected', 'cancelled')
          and b.status = 'approved'
          and i.is_available
        group by i.id
        order by orders desc, qty desc
        limit least(greatest(p_limit, 1), 20)
      ) t
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.neighbourhood_pulse(int) from public;
grant execute on function public.neighbourhood_pulse(int) to anon, authenticated;

-- ---------- Order together ----------
create table public.group_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);
create index group_orders_host_idx on public.group_orders (host_id);
create index group_orders_business_idx on public.group_orders (business_id);

create table public.group_order_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.group_orders (id) on delete cascade,
  member_key text not null check (char_length(member_key) between 8 and 64),
  member_name text not null check (char_length(member_name) between 1 and 30),
  item_id uuid not null references public.items (id) on delete cascade,
  qty integer not null check (qty between 1 and 20),
  created_at timestamptz not null default now()
);
create index group_order_items_group_idx on public.group_order_items (group_id);
create index group_order_items_item_idx on public.group_order_items (item_id);

alter table public.group_orders enable row level security;
alter table public.group_order_items enable row level security;

-- An open group basket lasts one day.
create or replace function private.group_by_code(p_code text)
returns public.group_orders
language sql
stable
security definer
set search_path = ''
as $$
  select g.* from public.group_orders g
  where g.code = upper(btrim(p_code)) and g.created_at > now() - interval '1 day';
$$;
revoke all on function private.group_by_code(text) from public;

create or replace function public.create_group_order(p_business_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if not exists (select 1 from public.businesses b where b.id = p_business_id and b.status = 'approved') then
    raise exception 'Store not found';
  end if;
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.group_orders where code = v_code);
  end loop;
  insert into public.group_orders (code, host_id, business_id) values (v_code, auth.uid(), p_business_id);
  return v_code;
end;
$$;

-- p_member_key marks the caller's own lines; other members' keys are never returned.
create or replace function public.get_group_order(p_code text, p_member_key text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  g public.group_orders;
begin
  g := private.group_by_code(p_code);
  if g.id is null then
    return null;
  end if;
  return jsonb_build_object(
    'code', g.code,
    'status', g.status,
    'is_host', g.host_id = auth.uid(),
    'host_name', (select split_part(coalesce(p.full_name, ''), ' ', 1) from public.profiles p where p.id = g.host_id),
    'business', (
      select jsonb_build_object('id', b.id, 'name_ar', b.name_ar, 'name_en', b.name_en, 'category', b.category,
                                'logo_url', b.logo_url, 'delivery_fee', b.delivery_fee, 'min_order', b.min_order, 'is_open', b.is_open)
      from public.businesses b where b.id = g.business_id
    ),
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', l.id, 'mine', l.member_key = coalesce(p_member_key, ''), 'member_name', l.member_name, 'item_id', l.item_id,
               'name_ar', i.name_ar, 'name_en', i.name_en, 'price', i.price, 'qty', l.qty,
               'stock_count', i.stock_count, 'available', i.is_available)
             order by l.created_at)
      from public.group_order_items l join public.items i on i.id = l.item_id
      where l.group_id = g.id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.add_group_item(p_code text, p_member_key text, p_member_name text, p_item_id uuid, p_qty int default 1)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.group_orders;
  v_name text := btrim(coalesce(p_member_name, ''));
begin
  g := private.group_by_code(p_code);
  if g.id is null or g.status <> 'open' then
    raise exception 'This group order is closed';
  end if;
  if char_length(v_name) not between 1 and 30 or char_length(coalesce(p_member_key, '')) not between 8 and 64 then
    raise exception 'Invalid name';
  end if;
  if not exists (select 1 from public.items i where i.id = p_item_id and i.business_id = g.business_id and i.is_available) then
    raise exception 'Item not available';
  end if;
  if (select count(*) from public.group_order_items where group_id = g.id) >= 100 then
    raise exception 'This group order is full';
  end if;
  update public.group_order_items
     set qty = least(qty + greatest(p_qty, 1), 20), member_name = v_name
   where group_id = g.id and member_key = p_member_key and item_id = p_item_id;
  if not found then
    insert into public.group_order_items (group_id, member_key, member_name, item_id, qty)
    values (g.id, p_member_key, v_name, p_item_id, least(greatest(p_qty, 1), 20));
  end if;
end;
$$;

-- Change or remove a line: its owner (by member key) or the host.
create or replace function public.set_group_item_qty(p_code text, p_line_id uuid, p_member_key text, p_qty int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.group_orders;
begin
  g := private.group_by_code(p_code);
  if g.id is null or g.status <> 'open' then
    raise exception 'This group order is closed';
  end if;
  if p_qty <= 0 then
    delete from public.group_order_items
     where id = p_line_id and group_id = g.id and (member_key = p_member_key or g.host_id = auth.uid());
  else
    update public.group_order_items set qty = least(p_qty, 20)
     where id = p_line_id and group_id = g.id and (member_key = p_member_key or g.host_id = auth.uid());
  end if;
end;
$$;

create or replace function public.close_group_order(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.group_orders set status = 'closed'
   where code = upper(btrim(p_code)) and host_id = auth.uid();
  if not found then
    raise exception 'Only the host can close this group order';
  end if;
end;
$$;

revoke all on function public.create_group_order(uuid) from public;
revoke all on function public.get_group_order(text, text) from public;
revoke all on function public.add_group_item(text, text, text, uuid, int) from public;
revoke all on function public.set_group_item_qty(text, uuid, text, int) from public;
revoke all on function public.close_group_order(text) from public;
grant execute on function public.create_group_order(uuid) to authenticated;
grant execute on function public.get_group_order(text, text) to anon, authenticated;
grant execute on function public.add_group_item(text, text, text, uuid, int) to anon, authenticated;
grant execute on function public.set_group_item_qty(text, uuid, text, int) to anon, authenticated;
grant execute on function public.close_group_order(text) to authenticated;
-- Supabase grants anon execute on new functions by default; starting and closing need an account.
revoke execute on function public.create_group_order(uuid) from anon;
revoke execute on function public.close_group_order(text) from anon;
