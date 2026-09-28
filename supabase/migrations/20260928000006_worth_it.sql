-- Worth-it check, rule-based: compare an item's unit price (per piece, or per 100 g / 100 ml)
-- with the median of comparable items in approved stores of the same type.
-- Runs with the caller's rights; it only reads items that are already public.
create or replace function public.item_value_scores(p_business_id uuid)
returns table (item_id uuid, unit_price numeric, median_price numeric, diff_pct numeric, sample integer)
language sql stable set search_path = ''
as $$
  with priced as (
    select i.id, i.business_id, i.unit_type, b.category,
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
       where o.id <> p.id and o.unit_type = p.unit_type and o.category = p.category
    ) m
   where p.business_id = p_business_id and m.n >= 3
$$;

grant execute on function public.item_value_scores(uuid) to anon, authenticated;
