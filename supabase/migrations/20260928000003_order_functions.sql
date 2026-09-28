-- Orders are created and moved through their statuses only through these functions,
-- so prices, totals, stock and who-may-do-what are enforced by the database.

drop policy "orders: customers place" on public.orders;
drop policy "orders: store, driver and admin update" on public.orders;
drop policy "order_items: customer adds to own new order" on public.order_items;

create policy "orders: admin updates" on public.orders
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- p_items: [{"item_id": "...", "quantity": 2}, ...]
create or replace function public.place_order(
  p_business_id uuid,
  p_items jsonb,
  p_address jsonb,
  p_phone text,
  p_cash_change_for numeric default null,
  p_notes text default null
)
returns public.orders
language plpgsql security definer set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_business public.businesses;
  v_order public.orders;
  v_line jsonb;
  v_item public.items;
  v_qty integer;
  v_subtotal numeric(10, 2) := 0;
begin
  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.id is null then raise exception 'Please sign in first'; end if;
  if v_profile.approval_status <> 'approved' then raise exception 'Your account is not active'; end if;

  select * into v_business from public.businesses where id = p_business_id;
  if v_business.id is null or v_business.status <> 'approved' then raise exception 'Store not found'; end if;
  if not v_business.is_open then raise exception 'This store is closed right now'; end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;
  if coalesce(trim(p_phone), '') = '' then raise exception 'Please add a phone number'; end if;
  if coalesce(trim(p_address ->> 'area'), '') = '' then raise exception 'Please add your address'; end if;

  insert into public.orders (customer_id, business_id, delivery_address, customer_name, customer_phone,
                             subtotal, delivery_fee, total, payment_method, cash_change_for, notes)
  values (auth.uid(), p_business_id, p_address, v_profile.full_name, trim(p_phone),
          0, v_business.delivery_fee, 0, 'cash', p_cash_change_for, nullif(trim(p_notes), ''))
  returning * into v_order;

  for v_line in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_line ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 50 then raise exception 'Invalid quantity'; end if;

    -- Lock the row so two customers can't buy the last piece at once.
    select * into v_item from public.items
     where id = (v_line ->> 'item_id')::uuid and business_id = p_business_id
     for update;
    if v_item.id is null then raise exception 'An item in your cart no longer exists'; end if;
    if not v_item.is_available then raise exception '% is sold out', v_item.name_ar; end if;
    if v_item.stock_count is not null then
      if v_item.stock_count < v_qty then raise exception 'Only % left of %', v_item.stock_count, v_item.name_ar; end if;
      update public.items
         set stock_count = stock_count - v_qty,
             is_available = (stock_count - v_qty) > 0,
             updated_at = now()
       where id = v_item.id;
    end if;

    insert into public.order_items (order_id, item_id, name, unit_price, quantity, line_total)
    values (v_order.id, v_item.id, coalesce(v_item.name_ar, v_item.name_en), v_item.price, v_qty, v_item.price * v_qty);
    v_subtotal := v_subtotal + v_item.price * v_qty;
  end loop;

  if v_subtotal < v_business.min_order then
    raise exception 'Minimum order for this store is % EGP', v_business.min_order;
  end if;
  if p_cash_change_for is not null and p_cash_change_for < v_subtotal + v_business.delivery_fee then
    raise exception 'The note you pay with is less than the total';
  end if;

  update public.orders
     set subtotal = v_subtotal, total = v_subtotal + delivery_fee
   where id = v_order.id
  returning * into v_order;
  return v_order;
end;
$$;

-- Moves an order to a new status if the caller is allowed to make that move.
create or replace function public.set_order_status(p_order_id uuid, p_status public.order_status)
returns public.orders
language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders;
  v_allowed boolean := false;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Order not found'; end if;

  if private.is_admin() then
    v_allowed := true;
  elsif private.owns_business(v_order.business_id) then
    v_allowed := (v_order.status, p_status) in (
      ('placed', 'accepted'), ('placed', 'rejected'),
      ('accepted', 'preparing'), ('accepted', 'ready'), ('preparing', 'ready'),
      ('accepted', 'cancelled'), ('preparing', 'cancelled'));
  elsif v_order.driver_id = auth.uid() then
    v_allowed := (v_order.status, p_status) in (('ready', 'picked_up'), ('picked_up', 'delivered'));
  elsif v_order.customer_id = auth.uid() then
    v_allowed := v_order.status = 'placed' and p_status = 'cancelled';
  end if;

  if not v_allowed then
    raise exception 'You cannot change this order from % to %', v_order.status, p_status;
  end if;

  -- Give tracked stock back when an order doesn't go ahead.
  if p_status in ('rejected', 'cancelled') then
    update public.items i
       set stock_count = i.stock_count + oi.quantity, is_available = true, updated_at = now()
      from public.order_items oi
     where oi.order_id = v_order.id and oi.item_id = i.id and i.stock_count is not null;
  end if;

  update public.orders
     set status = p_status,
         ready_at = case when p_status = 'ready' then now() else ready_at end,
         cash_collected = case when p_status = 'delivered' and payment_method = 'cash' then true else cash_collected end
   where id = v_order.id
  returning * into v_order;
  return v_order;
end;
$$;

-- An approved driver takes an order that has no driver yet.
create or replace function public.claim_delivery(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not private.is_approved_driver() then raise exception 'Only approved drivers can take orders'; end if;
  update public.orders
     set driver_id = auth.uid()
   where id = p_order_id and driver_id is null and status in ('accepted', 'preparing', 'ready')
  returning * into v_order;
  if v_order.id is null then raise exception 'Another driver already took this order'; end if;
  insert into public.order_events (order_id, status, actor_id, note) values (v_order.id, v_order.status, auth.uid(), 'driver assigned');
  return v_order;
end;
$$;

revoke execute on function public.place_order(uuid, jsonb, jsonb, text, numeric, text),
  public.set_order_status(uuid, public.order_status), public.claim_delivery(uuid) from public, anon;
grant execute on function public.place_order(uuid, jsonb, jsonb, text, numeric, text),
  public.set_order_status(uuid, public.order_status), public.claim_delivery(uuid) to authenticated;

-- Drivers can read the store they're collecting from even though stores are public anyway;
-- stores need to see which driver is coming, so expose a driver's name to the store and customer of their orders.
create policy "profiles: order parties read driver and customer names" on public.profiles
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where (o.driver_id = profiles.id or o.customer_id = profiles.id)
      and (o.customer_id = (select auth.uid()) or o.driver_id = (select auth.uid()) or (select private.owns_business(o.business_id)))
  ));

-- ---------- Item photos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', true, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Files go in a folder named after the business id: <business_id>/<file>.
create policy "item-photos: owners upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'item-photos' and (select private.owns_business(((storage.foldername(name))[1])::uuid)));
create policy "item-photos: owners change" on storage.objects
  for update to authenticated
  using (bucket_id = 'item-photos' and (select private.owns_business(((storage.foldername(name))[1])::uuid)));
create policy "item-photos: owners delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'item-photos' and (select private.owns_business(((storage.foldername(name))[1])::uuid)));
