-- Worth-it check v2: compare each item only with similarly named items (same unit type)
-- at other approved stores, so bread is compared with bread, not with croissants.
create extension if not exists pg_trgm with schema extensions;

create or replace function public.item_value_scores(p_business_id uuid)
returns table (item_id uuid, unit_price numeric, median_price numeric, diff_pct numeric, sample integer)
language sql stable set search_path = ''
as $$
  with priced as (
    select i.id, i.business_id, i.unit_type,
           lower(i.name_ar) as name_ar, lower(coalesce(i.name_en, '')) as name_en,
           case when i.unit_type = 'piece' then i.price / i.unit_amount
                else i.price / i.unit_amount * 100 end as unit_price
      from public.items i
      join public.businesses b on b.id = i.business_id
     where b.status = 'approved' and i.price > 0
  )
  select p.id,
         round(p.unit_price, 2),
         round(m.median, 2),
         round((p.unit_price - m.median) / nullif(m.median, 0) * 100, 0),
         m.n::integer
    from priced p
    cross join lateral (
      select percentile_cont(0.5) within group (order by o.unit_price)::numeric as median, count(*) as n
        from priced o
       where o.business_id <> p.business_id
         and o.unit_type = p.unit_type
         and (extensions.similarity(o.name_ar, p.name_ar) >= 0.35
              or (p.name_en <> '' and extensions.similarity(o.name_en, p.name_en) >= 0.35))
    ) m
   where p.business_id = p_business_id and m.n >= 1
$$;
