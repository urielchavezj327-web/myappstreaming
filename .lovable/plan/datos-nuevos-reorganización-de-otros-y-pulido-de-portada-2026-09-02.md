# Datos nuevos, reorganización de "Otros" y pulido de portada

Trabajo mayormente de datos. Diseño solo se toca en el título de portada (Sección 11) y en el buscador de /agregar (Sección 3).

## Verificado antes de planear

- Grupos padre actuales: `Venta Libre Cherrycita` (11 vendedores) verificar que pases todos los vendedores y no te falte ninguno  verifica tu conteo, porque de venta libre Cherrycita son 11 no 10 y `C/V Bloom Store` (4: Aura Vnts, Trámites MT, Vendedor A, Vendedor B) — se renombran, no se duplican.
- `Trámites MT` = 56 6043 6293, 42 ofertas cargadas hoy.
- Ninguno de los teléfonos nuevos de este mensaje existe todavía en la base: no hay duplicados que fusionar (salvo las dos publicaciones de +52 999 101 2929, que se cargan como un solo vendedor).
- En "Otros" existen las fichas: Recargas telefónicas, Pagos de servicios con descuento, Compras online con descuento, Seguidores y redes sociales, Películas/Libros/PDF, Game Pass, Robux y Pavos, Números virtuales, Recuperación de cuentas, Discord Nitro, Free Fire, Paneles y Métodos, Bots para grupos, Boletos y viajes, Drama Box, Smart Fit y la subcategoría Páginas para Adultos (Brazzers, Pornhub). **No existe** ficha OnlyFans: se crea.

## Qué se va a hacer

1. **Renombrar grupos** (Sección 1): `Venta Libre Cherrycita` → `C/V Libre Gaeta¹`, `C/V Bloom Store` → `C/V Nessita¹`. Mismo grupo, mismos vendedores, mismas ofertas.
2. **Tipo "Lote"** (Sección 2): las ofertas por varias cuentas se registran con tipo Lote, no como texto — incluidas las de Vendedor H (Gaeta¹), Alice Vts (Xime) y Vendedor D (BLACKSHOP), y todas las de las secciones nuevas.
3. **Trámites MT** (Sección 4): actualización completa de precios, altas nuevas (lote de actas, opinión de cumplimiento, certificados escolares, incapacidad IMSS, semanas cotizadas, constancias, licencias) y bajas ("primera vez con curp (clon)", "opinión de cumplimiento $25" en extras).
4. **Vendedores nuevos**: Gaeta¹ (Reze Ventas, Vendedor H, Vendedor I, Tramites Crou, Vendedor J, Streaming Pacheco's), Plug House (Vendedor D, Vendedor E), C/V Xime (Vendedor B, Vendedor C, Alice Vts), BLACKSHOP RENACIDO (Multiservicios Aaron, Norman Shop, Vendedor C, Trámites Digitales Mingo, SKYFALL, Vendedor D, Vendedor B), Nessita¹ (YONISAUR SHOP && HYPE). Cada uno queda ordenado dentro de su grupo padre.
5. **Grupos nuevos de venta libre** (Sección 9): `V/L Abichuelita` y `The Onion Market`, al final de /grupos, con las mismas funciones (editar, eliminar, seleccionables en /agregar), cada uno con su Vendedor A.
6. **Servicios nuevos** que hacen falta: Peacock, Hidive (Streaming), Qobuz (Música), OnlyFans (Páginas para Adultos) y en Otros: Internet Satelital (Starlink), Videojuegos, Cine, Comida Rápida, Hospedaje (Booking), Transporte (Metro Monterrey), Pastelería, Comida y Delivery, Liquidación de Créditos. Se omite todo lo de "Número virtual $18" de Vendedor D y lo de seguidores de YONISAUR.
7. **Mxguel Store** (Sección 13): altas "A consultar" en sus fichas correspondientes ya existentes + OnlyFans + las 2 fichas nuevas.
8. **Limpieza de "Otros"** (Sección 14): revisión ficha por ficha de cada oferta cargada; toda oferta cuyo contenido no corresponda a su ficha se separa y se mueve a la ficha correcta (caso típico: pagos de servicios mezclados con compras online). La consolidación en una sola tarjeta por vendedor se mantiene, pero solo dentro de cada ficha. Queda como regla permanente para cargas futuras.
9. **Filtro de categoría en /agregar** (Sección 3): chips Todo / Streaming / Música / Diseño e IA / Trámites / Otros sobre el buscador de ofertas, con el mismo orden por defecto del buscador de portada, funcionando para búsquedas por vendedor, grupo o teléfono.
10. **Título de portada** (Sección 11): "Stock" pasa a serif elegante, peso ligero y color apagado; "Index" queda igual.
11. **Revisión y rendimiento** (Sección 12): recorrido de categorías, fichas, modales de PIN/editar/eliminar y ambos buscadores, corrigiendo bugs encontrados; y virtualización (o carga progresiva equivalente) de las listas largas de Trámites para eliminar el traboneo al hacer scroll, priorizando siempre que nada deje de funcionar.
12. Al final: informe con las mejoras que yo propondría por mi cuenta, para que decidas después.

## Detalles técnicos

- Todo el alta/edición de datos va en migraciones SQL sobre las tablas `groups`, `services`, `subcategories` y `stock_items`; los lotes usan `product_type = 'lote'` y los precios variables `price = null` (se muestran como "A consultar").
- Los grupos renombrados se actualizan por `parent_group` en `groups`; el orden dentro de /grupos se mantiene con `sort_order`.
- El "Desde" y la etiqueta "Mejor precio" ya se calculan solos a partir del mínimo del servicio: al insertar precios más bajos se actualizan sin cambios de código.
- El filtro de /agregar reutiliza la lógica de categorías de `searchStock`, aplicada al buscador admin de `admin.functions.ts`.
- Para el scroll se aplicará virtualización sobre la lista de tarjetas de cada categoría, conservando el `content-visibility` actual y el estado de búsqueda/scroll al volver del detalle.