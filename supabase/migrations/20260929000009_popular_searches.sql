-- Popular searches: anonymous search terms (no user id stored), counted over the last 30 days.
create table public.search_log (
  id bigint generated always as identity primary key,
  term text not null check (char_length(term) between 2 and 40),
  created_at timestamptz not null default now()
);
create index search_log_recent_idx on public.search_log (created_at desc);
alter table public.search_log enable row level security;
-- No direct table access; everything goes through the two functions below.

create or replace function public.log_search(p_term text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t text := lower(btrim(regexp_replace(coalesce(p_term, ''), '\s+', ' ', 'g')));
begin
  if char_length(t) between 2 and 40 then
    insert into public.search_log (term) values (t);
  end if;
end;
$$;

create or replace function public.popular_searches(p_limit int default 8)
returns table (term text, uses bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select l.term, count(*) as uses
  from public.search_log l
  where l.created_at > now() - interval '30 days'
  group by l.term
  having count(*) >= 2
  order by uses desc, max(l.created_at) desc
  limit least(greatest(p_limit, 1), 20);
$$;

revoke all on function public.log_search(text) from public;
revoke all on function public.popular_searches(int) from public;
grant execute on function public.log_search(text) to anon, authenticated;
grant execute on function public.popular_searches(int) to anon, authenticated;
