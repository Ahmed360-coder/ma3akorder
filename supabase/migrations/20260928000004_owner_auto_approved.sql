-- Business owners are gated by their store's approval, so their account itself
-- doesn't need a second approval. Only drivers wait for account approval.
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
         approval_status = case when p_role = 'driver' then 'pending'::public.approval_status
                                else 'approved'::public.approval_status end,
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
