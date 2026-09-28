-- Account deletion (Egypt's Personal Data Protection Law, No. 151 of 2020).
-- Past orders are kept for the store's records, with the customer's personal data removed.
alter table public.orders alter column customer_id drop not null;
alter table public.orders drop constraint orders_customer_id_fkey;
alter table public.orders add constraint orders_customer_id_fkey
  foreign key (customer_id) references public.profiles (id) on delete set null;

create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if exists (select 1 from public.businesses where owner_id = v_uid) then
    raise exception 'Store owners: please contact support to close your store first';
  end if;
  if exists (select 1 from public.orders
             where (customer_id = v_uid or driver_id = v_uid)
               and status in ('placed', 'accepted', 'preparing', 'ready', 'picked_up')) then
    raise exception 'You have an order in progress. Try again after it is finished';
  end if;
  update public.orders
     set customer_name = null, customer_phone = null,
         delivery_address = jsonb_build_object('area', delivery_address ->> 'area'), notes = null
   where customer_id = v_uid;
  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
