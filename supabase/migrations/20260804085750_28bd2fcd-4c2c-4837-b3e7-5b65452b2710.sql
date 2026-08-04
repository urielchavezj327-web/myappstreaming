INSERT INTO public.services (category_id, subcategory_id, slug, name, color, sort_order)
SELECT c.id, sub.id, v.slug, v.name, '#8b8b8b', 900
FROM (VALUES
  ('pantallas-imss','Pantallas IMSS','salud'),
  ('sindo','SINDO','salud'),
  ('talon-issste','Talón de pago ISSSTE','salud'),
  ('no-derechohabiente-isssemym','No derechohabiente Isssemym','salud'),
  ('analisis-clinicos','Análisis clínicos','salud')
) AS v(slug,name,subslug)
JOIN public.categories c ON c.slug='tramites'
JOIN public.subcategories sub ON sub.slug = v.subslug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.services (category_id, subcategory_id, slug, name, color, sort_order)
SELECT c.id, NULL, 'game-pass', 'Game Pass', '#107c10', 900
FROM public.categories c WHERE c.slug='otros'
ON CONFLICT (slug) DO NOTHING;