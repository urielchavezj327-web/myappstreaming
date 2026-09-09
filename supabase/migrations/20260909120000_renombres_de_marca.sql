-- Tres nombres de servicio que no coincidían con el logotipo real.
--
--   · «YouTube Premium» → «YouTube». El logotipo oficial es solo «YouTube»;
--     el plan Premium es una variante de la oferta, no otra marca.
--   · «Kocowa» → «Kocowa+». El «+» va en el logotipo desde el rebranding.
--   · «Hidive» → «HIDIVE», que es como se escribe dentro de su placa negra.
--
-- Solo cambia el rótulo: ni el slug ni las ofertas se tocan, así que las
-- direcciones guardadas siguen funcionando.

UPDATE services SET name = 'YouTube' WHERE slug = 'youtube-premium';
UPDATE services SET name = 'Kocowa+' WHERE slug = 'kocowa';
UPDATE services SET name = 'HIDIVE' WHERE slug = 'hidive';
