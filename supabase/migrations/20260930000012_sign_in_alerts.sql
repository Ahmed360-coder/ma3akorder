-- Email the owner after every sign-in (first sign-in of a new account is marked new).
-- The database posts to the site's /api/alerts/sign-in, which sends the email via Resend.
-- The shared secret is kept in Vault as 'signin_alert_secret' (never in this repo).
create extension if not exists pg_net with schema extensions;

create or replace function private.notify_sign_in()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  secret text;
  prof public.profiles;
begin
  if new.last_sign_in_at is null
     or (tg_op = 'UPDATE' and new.last_sign_in_at is not distinct from old.last_sign_in_at) then
    return new;
  end if;
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'signin_alert_secret';
  if secret is null then
    return new;
  end if;
  select * into prof from public.profiles where id = new.id;
  perform net.http_post(
    url := 'https://ma3akorder.vercel.app/api/alerts/sign-in',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-alert-secret', secret),
    body := jsonb_build_object(
      'is_new', tg_op = 'INSERT' or old.last_sign_in_at is null,
      'name', coalesce(prof.full_name, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
      'email', new.email,
      'phone', new.phone,
      'role', case when prof.onboarded then prof.role::text else 'none' end,
      'provider', new.raw_app_meta_data ->> 'provider',
      'at', new.last_sign_in_at
    ),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  -- Never block a sign-in because the alert failed.
  return new;
end;
$$;

revoke execute on function private.notify_sign_in() from public, anon, authenticated;

create trigger on_auth_user_signed_in
  after insert or update of last_sign_in_at on auth.users
  for each row execute function private.notify_sign_in();
