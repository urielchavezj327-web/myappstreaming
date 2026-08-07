# Correcciones de datos, bugs y gestión de vendedores

## Diagnóstico confirmado (consultas hechas a la base)

- Hay **1,163 ofertas** cargadas, pero la API de datos devuelve como máximo **1,000 filas por consulta**. Las lecturas de stock del catálogo y de /grupos no piden todas las filas, así que se cortan. Eso explica dos bugs reportados:
  - **Parte D**: MonShop (103 ofertas reales) y Prov Hack Streaming (39 reales) muestran "0 ofertas".
  - **Parte F**: el precio "Desde" y los "A consultar" se calculan sobre un subconjunto incompleto (por eso Localizar AFORE muestra $15 en vez de $10, y Talón ISSSTE / SINDO / No derechohabiente ISSSTE salen "A consultar").
- **Parte E**: la categoría activa vive solo en estado local del componente; al regresar se pierde y vuelve a Streaming.
- Existen **dos vendedores duplicados llamados "Bloom Store"** con el mismo teléfono (+1 431 296-3863), uno con 41 ofertas y otro con 51. Corresponden a la lista publicada dos veces (Parte C). Se unifican en uno solo llamado **Aura Vnts** con la lista vigente.
- Categoría "Páginas para Adultos" existe como categoría principal con Pornhub y Brazzers; pasa a ser subcarpeta de "Otros" (Parte J).

## Parte 1 — Arreglos de bugs

1. **Conteos y precios completos**: paginar todas las lecturas de `stock_items` (bloques de 1,000) en catálogo y grupos, para que conteos y precio mínimo usen las 1,163 ofertas. El "Desde" toma el mínimo entre internos y venta libre; "A consultar" solo cuando de verdad no hay ningún precio (queda así en pagos de servicios, recargas, boletos, compras online, Smart Fit y Game Pass).
2. **Memoria de categoría**: la categoría activa pasa a la URL (`/?cat=musica`). Volver con el gesto del celular o con "Volver al catálogo" regresa a la categoría que estaba abierta.
3. **Adultos dentro de Otros**: Pornhub y Brazzers se mueven a la categoría "Otros" bajo la subcarpeta "Páginas para Adultos"; se elimina la categoría suelta de la fila principal.

## Parte 2 — Textos y nombres

- "Grupos donde estoy dentro" → **"Mis Grupos"** en toda la app.
- "Stock Monshop" → **"MonShop"**.
- Vendedores que llevan el nombre de su grupo:
  - "Stock Cherrycita" (+52 55 2378 6815) → **Vendedor E**
  - "Bloom Store" (+1 431 296-3863) → **Aura Vnts**
  - "Documentos Plug House" (+52 55 8097 5190) → **Vendedor C**  *(nota: ya existe un "Vendedor C" en Cherrycita; la numeración es por grupo, así que no hay conflicto)*
- Revisión completa de la base: ningún nombre de vendedor debe contener el nombre de su grupo; los que queden así se renumeran como "Vendedor X" dentro de su grupo.

## Parte 3 — Datos de stock

- **Aura Vnts (C/V Bloom Store)**: se fusionan sus dos registros duplicados y se deja la lista vigente. Disney+ + ESPN Completa $50 y Perfil $8; se borran ViX "Pase Mundial" $150 y ViX "Perfil" sin duración; se agregan IPTV, Prime Video, Crunchyroll y YouTube Premium con los precios indicados. Netflix, Max, Paramount+, Mubi, Pornhub, Brazzers, Duolingo, Spotify y Canva quedan intactos.
- **Vendedor B (Plug House by Birrias, 81 3914 7673)**: se actualiza el existente, sin crear uno nuevo por "C/V Libre¹". Mubi $9, Kokowa $9, Prime Perfil $6, Paramount+ Perfil $9, Paramount+ Completa $35, y se agrega Disney Premium (Perfil $12, Completa con panel $60). Lo demás sin cambios.
- **Grupos nuevos** "C/V Xime" y "C/V Libre¹" con las mismas reglas de los demás.
- **Vendedores nuevos**: Telmex al 50% (56 5955 4208, Bloom Store), pagos de servicios y abonos (+52 963 324 8532, C/V Xime), Pierrot Ventas (+52 962 255 3731, Plug House), stock de streaming (+52 55 2142 8864, Bloom Store), Stock by Dafnesita (+52 971 527 3418, C/V Xime, catálogo completo de perfiles/completas/música), y métodos sin teléfono en Venta Libre Cherrycita.
- **Parte I — Trámites**: repaso de la categoría Trámites contra las listas de los 3 grupos de venta libre, cargando lo faltante (Talón de pago ISSSTE, SINDO en sus 4 variantes, No derechohabiente ISSSTE en 3, Pantallas IMSS en 7 y Localizar AFORE a $10) y corrigiendo precios que no coincidan.

## Parte 4 — Buscador de portada

Al buscar "VIX" el resultado ya no manda solo a la categoría: se listan directamente **todas sus ofertas**, agrupadas por tipo (Perfil / Completa) y ordenadas por duración, igual que en la ficha del servicio. "VIX 2 meses" filtra solo esas. Buscar un teléfono (ej. +52 55 2378 6815) muestra todo lo que vende ese vendedor en cualquier categoría.

## Parte 5 — Gestión (PIN)

- En **/agregar**: se quita "Últimas ofertas cargadas" y se pone un buscador con el mismo estilo del de inicio ("Netflix Cami Store"), con acciones por resultado: eliminar, marcar "No disponible" y editar precio.
- En **/grupos**, cada tarjeta de vendedor tendrá **"Editar vendedor"** y **"Eliminar vendedor"**, ambos con el mismo PIN. Editar permite cambiar nombre, teléfono y grupo, y el cambio se refleja en todas sus ofertas de todas las categorías. Eliminar pide confirmación y borra en cascada todas sus ofertas.

## Detalles técnicos

- Paginación por rangos en `getCatalog`, `getServiceDetail` y `getGroups` para superar el límite de 1,000 filas de la API.
- Categoría activa como search param validado en la ruta `/` (`cat`), con `<Link>` que la conserva desde la ficha del servicio.
- Búsqueda: nueva función de servidor que devuelve ofertas (servicio + vendedor + tipo + duración + precio + teléfono) para consultas de texto o teléfono, reutilizando el ordenamiento de la ficha de servicio.
- Nuevas funciones de servidor protegidas por el PIN existente: `updateSeller`, `deleteSeller` (borrado en cascada) y búsqueda administrativa de ofertas.
- Cambios de datos vía migración/inserciones: renombres, fusión de los dos "Bloom Store", movimiento de Pornhub/Brazzers a Otros con subcategoría "Páginas para Adultos", nuevos grupos/vendedores y ajustes de precios.
- Sin cambios de diseño visual ni de estructura.
