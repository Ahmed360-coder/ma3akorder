-- Move policy helper functions out of the public API schema so they cannot be
-- called as /rest/v1/rpc endpoints. Policies reference functions by id, so they keep working.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.my_role() set schema private;
alter function public.is_admin() set schema private;
alter function public.is_approved_driver() set schema private;
alter function public.owns_business(uuid) set schema private;
alter function public.can_see_order(uuid) set schema private;

-- Functions that call the helpers by name need the new location.
create or replace function private.can_see_order(p_order_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order_id
      and (o.customer_id = auth.uid()
           or o.driver_id = auth.uid()
           or private.owns_business(o.business_id)
           or private.is_admin())
  )
$$;

create or replace function public.guard_profile_update()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user = 'authenticated' and not private.is_admin()
     and (new.role is distinct from old.role
          or new.approval_status is distinct from old.approval_status
          or new.onboarded is distinct from old.onboarded) then
    raise exception 'Only an admin can change role or approval status';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.guard_business_write()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.is_admin() and current_user = 'authenticated' then
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

revoke execute on function public.guard_profile_update(), public.guard_business_write() from public, anon, authenticated;
