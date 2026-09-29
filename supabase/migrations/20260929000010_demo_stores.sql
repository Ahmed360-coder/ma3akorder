-- Demo stores: shown only until real stores are live, and an admin can hide them any time.
alter table public.businesses add column is_demo boolean not null default false;

update public.businesses set is_demo = true
 where id in ('d0090382-b0e8-4619-8433-af6c20649229', 'fa3f5125-7473-485b-a081-1342c86a4b9c');

-- Only an admin can mark or unmark a demo store.
create or replace function public.guard_business_write()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.is_admin() and current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.status = 'pending';
      new.commission_rate = 0;
      new.is_demo = false;
    else
      new.status = old.status;
      new.commission_rate = old.commission_rate;
      new.owner_id = old.owner_id;
      new.is_demo = old.is_demo;
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.guard_business_write() from public, anon, authenticated;

-- Site-wide switches. Everyone can read them; only admins can change them.
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "settings readable" on public.app_settings for select to anon, authenticated using (true);
create policy "admins change settings" on public.app_settings for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

insert into public.app_settings (key, value) values ('hide_demo_stores', 'false');
