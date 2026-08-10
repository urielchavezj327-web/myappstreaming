-- Seguridad
ALTER FUNCTION public.set_updated_at() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

-- Nuevo grupo y vendedor
INSERT INTO public.groups (slug, name, kind, phone, parent_group, sort_order)
VALUES ('blackshop-renacido-vendedor-a', 'Vendedor A', 'venta_libre', '+52 333 773 9475', 'BLACKSHOP RENACIDO', 140);

INSERT INTO public.stock_items (service_id, group_id, product_type, months, price, detail, available)
SELECT s.id, g.id, v.ptype, v.months, v.price, v.detail, true
FROM (VALUES
  ('disney','perfil',1,8,NULL),
  ('disney','perfil',12,35,NULL),
  ('hbo-max','perfil',1,7,'Platino'),
  ('hbo-max','perfil',12,15,'Platino'),
  ('paramount','perfil',1,8,NULL),
  ('vix','perfil',1,2,NULL),
  ('prime-video','perfil',1,4,NULL),
  ('netflix','perfil',1,30,NULL),
  ('disney','completa',1,65,NULL),
  ('disney','completa',12,65,NULL),
  ('hbo-max','completa',1,28,'Platino'),
  ('hbo-max','completa',12,45,'Platino'),
  ('paramount','completa',1,20,NULL),
  ('vix','completa',1,5,NULL),
  ('vix','completa',12,10,NULL),
  ('apple-tv','completa',1,39,NULL),
  ('prime-video','completa',1,20,NULL),
  ('netflix','completa',1,125,NULL),
  ('spotify','individual',12,38,NULL),
  ('canva-pro','completa',1,4,NULL),
  ('canva-pro','completa',2,5,NULL)
) AS v(slug, ptype, months, price, detail)
JOIN public.services s ON s.slug = v.slug
JOIN public.groups g ON g.slug = 'blackshop-renacido-vendedor-a';