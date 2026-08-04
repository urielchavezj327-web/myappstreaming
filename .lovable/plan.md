# Comparador de Stock — Panel de precios

Un panel web (en español) para comparar precios de apps de streaming, música, diseño/IA y trámites entre todos tus grupos y vendedores, sin entrar grupo por grupo a WhatsApp.

## Look & feel

Paleta neutra oscura con negro: fondo negro carbón, superficies grafito, bordes sutiles, texto blanco hueso y grises. Un único acento neutro claro (blanco/plata) para elementos activos; el color solo aparece como punto de marca por app (Netflix rojo, Disney azul, ViX naranja, Spotify verde, etc.) en un pequeño indicador, nunca invadiendo el fondo. Tipografía limpia tipo dashboard, números de precio tabulares y grandes para leer rápido.

## Estructura de la web

```text
/                     Panel: buscador global + accesos por categoría + "mejores precios de hoy"
/streaming            Grid de apps (tarjetas con punto de color + precio mínimo)
/streaming/netflix    Comparativa de esa app
/musica               Igual que streaming
/diseno-ia            Canva, ChatGPT, Gemini, CapCut, Office, Duolingo...
/tramites             Subcategorías de trámites
/tramites/actas       Lista comparativa por trámite
/otros                Paneles, bots, diamantes, pagos/recargas con descuento
/admin                Panel de administración (requiere login)
```

## Cómo se ve la comparación de una app

Dentro de cada app, los registros se separan primero por **tipo de producto** (Perfil / Completa / Invitación / Familiar / Lote) y dentro por **duración** en este orden: 1 mes → 2 meses → 3 meses → 6 meses → 12 meses/anual → permanente/otros. Nunca se mezclan duraciones distintas en la misma comparación.

Dentro de cada bloque, filas ordenadas del precio más barato al más caro. La fila más barata queda marcada como "Mejor precio".

Cada fila muestra: grupo/vendedor, precio grande, detalle (con panel, a tus datos, hits, link, etc.), y una etiqueta que distingue el origen:

- **Grupo interno** (Monshop, Cami Store, Mxguel Store, AllVentas.Shop, Prov Hack, Fernando Contreras, Reve! Jaz!, Alisha Bot): tarjeta normal con nombre del grupo.
- **Venta libre**: bloque visualmente distinto con encabezado "Grupo de Venta Libre", el nombre grande del vendedor/grupo, el teléfono completo debajo y botón de WhatsApp que abre el chat con ese número.

## Filtros y búsqueda

Buscador global (app, servicio, trámite o vendedor), filtro por duración, filtro por tipo (perfil/completa), filtro por origen (internos / venta libre / todos), y orden por precio. Los filtros viven en la URL para poder compartir o guardar la vista.

## Organización propuesta para Trámites

Muchos trámites y muchos vendedores, así que se agrupan en subcategorías claras:

1. Actas y documentos personales (nacimiento, matrimonio, defunción, divorcio, concubinato, CURP)
2. SAT y fiscal (CSF/RFC, IDCIF, opinión de cumplimiento, cédula fiscal)
3. IMSS / ISSSTE y salud (NSS, semanas cotizadas, vigencia, incapacidades, recetas, certificados médicos, pruebas de laboratorio)
4. Educación (certificados primaria/secundaria/prepa, título, cédula, kardex)
5. Antecedentes y legal (estatales, federales, no deudor)
6. Vehículos (REPUVE, tenencia, permisos, licencias, pólizas, refacturas)
7. Infonavit y crédito (estado histórico, desbloqueo, buró)
8. Citas y otros (INE, pasaporte, Fonacot, CV, cartas)

Cada trámite se muestra como una fila comparativa con todos los vendedores que lo ofrecen y su precio, del más barato al más caro. Los trámites marcados "consultar" aparecen sin precio, al final, con etiqueta "Precio a consultar".

## Panel de administración

Login por correo y contraseña. Solo usuarios con rol de administrador entran. Desde ahí puedes:

- Crear/editar/eliminar grupos (marcando si es interno o venta libre, con teléfono)
- Crear/editar apps y servicios (con su color de marca y categoría)
- Crear/editar/eliminar registros de stock (tipo, duración, precio, detalle, notas)
- Marcar un stock como agotado sin borrarlo
- Carga rápida: pegar una lista de WhatsApp completa y revisarla antes de guardar (fase 2)

La web pública se puede ver sin iniciar sesión; solo el panel exige login.

## Datos iniciales

Cargo desde el inicio todas las listas que enviaste: los 8 grupos internos y todos los anuncios de venta libre (Bloom Store, Plug House, Cherrycita, Wenshop, FXND, Lily Snoop, Noetoy, etc.), con sus teléfonos donde los tengas. Donde no hay número, la oferta se muestra sin botón de WhatsApp.

## Detalles técnicos

- Lovable Cloud (base de datos + auth). Tablas: `categories`, `services` (app/servicio con color y categoría), `groups` (nombre, tipo interno/venta_libre, teléfono), `stock_items` (servicio, grupo, tipo de producto, meses, precio, detalle, notas, disponible), más `user_roles` + `has_role` para el rol admin.
- RLS: lectura pública (anon) sobre catálogo y stock; escritura solo para admins.
- Lectura pública vía server function con cliente publishable; escrituras del admin vía server functions autenticadas.
- Rutas TanStack por categoría y por app, cada una con su propio `head()` para SEO.
- Filtros como search params en la URL; orden y agrupación calculados en el cliente sobre los datos ya cargados.
- Datos semilla incluidos en la migración inicial.

## Orden de trabajo

1. Cloud + esquema + datos semilla completos
2. Diseño base y panel de inicio con buscador
3. Streaming/Música/Diseño: grid de apps y vista comparativa con agrupación por tipo y duración
4. Trámites con subcategorías
5. Bloques de venta libre con teléfono y WhatsApp
6. Login + panel de administración
