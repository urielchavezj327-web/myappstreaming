-- Q: nombre oficial ViX
UPDATE public.services SET name = 'ViX' WHERE slug = 'vix';

-- Color fiel de marca: Universal+ (negro/amarillo)
UPDATE public.services SET color = '#FFC72C' WHERE slug = 'universal';

-- R: nombre correcto
UPDATE public.groups SET name = 'Dafnesita' WHERE slug = 'xime-dafnesita';

-- S: consolidar ofertas duplicadas sin precio del mismo vendedor y servicio
WITH dups AS (
  SELECT service_id, group_id, product_type, months,
         min(id::text)::uuid AS keep_id,
         string_agg(NULLIF(detail,''), ' · ' ORDER BY detail) AS merged_detail,
         count(*) AS c
  FROM public.stock_items
  WHERE price IS NULL
  GROUP BY 1,2,3,4
  HAVING count(*) > 1
)
UPDATE public.stock_items si
SET detail = d.merged_detail
FROM dups d
WHERE si.id = d.keep_id;

WITH dups AS (
  SELECT service_id, group_id, product_type, months, min(id::text)::uuid AS keep_id
  FROM public.stock_items
  WHERE price IS NULL
  GROUP BY 1,2,3,4
  HAVING count(*) > 1
)
DELETE FROM public.stock_items si
USING dups d
WHERE si.service_id = d.service_id
  AND si.group_id = d.group_id
  AND si.product_type = d.product_type
  AND si.months IS NOT DISTINCT FROM d.months
  AND si.price IS NULL
  AND si.id <> d.keep_id;

-- R: reordenar vendedores agrupados por su grupo padre
WITH parents AS (
  SELECT parent_group, min(sort_order) AS first_seen
  FROM public.groups
  WHERE kind = 'venta_libre'
  GROUP BY parent_group
), ranked AS (
  SELECT g.id,
         100 + (row_number() OVER (ORDER BY p.first_seen, g.parent_group, g.sort_order))::int AS new_order
  FROM public.groups g
  JOIN parents p ON p.parent_group IS NOT DISTINCT FROM g.parent_group
  WHERE g.kind = 'venta_libre'
)
UPDATE public.groups g SET sort_order = r.new_order FROM ranked r WHERE g.id = r.id;