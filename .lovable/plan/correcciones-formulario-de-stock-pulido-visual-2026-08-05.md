# Correcciones + formulario de stock + pulido visual

- Se mantiene la estructura actual (catálogo, ficha de servicio, grupos). Solo se corrigen detalles, se agrega el formulario protegido y se pule el diseño móvil.

## Parte 1 — Correcciones

1. **Texto de perfil**: el texto de la esquina del encabezado pasa a decir "Uri", con el mismo estilo.
2. **Categorías en una fila (móvil)**: la barra de categorías se convierte en una fila horizontal con scroll lateral, sin apilado, con el chip activo resaltado y bordes suaves.
3. **"Sin número publicado" solo en Venta Libre**: queda como regla permanente en el código — ese texto solo se puede renderizar en secciones de venta libre. En grupos internos nunca se muestra teléfono ni ese aviso, sin importar los datos.
4. **Vendedor vs grupo**:
  - El nombre grande de cada oferta = vendedor. El texto chico = nombre del grupo + teléfono + variante.
  - Los 3 nombres de grupo se conservan intactos: Venta Libre Cherrycita, C/V Bloom Store, Plug House by Birrias.
  - Se renombran solo los vendedores cuyo "nombre" hoy es una descripción de producto:
    - Plug House by Birrias: "Cuentas y Perfiles" → Vendedor A; "Perfiles, Completas y Lotes" → Vendedor B.
    - Venta Libre Cherrycita: "Cuentas Premium al mejor precio" → Vendedor A; "Trato Admi · Cuentas" → Vendedor B; "Documentos y Trámites" → Vendedor C; "Busco Revendedoras Activas" → Vendedor D.
    - C/V Bloom Store: "Bloom Store · Streaming" y "Bloom Store · Lista revendedores" → Bloom Store (la variante pasa al texto chico); "Trámites MT · Trato Admin" → Trámites MT.
  - Nombres reales que no se tocan: Wenshop, NOETOY, LostBot Oficial, Stock Cherrycita, Stock Lily Snoop, FXND, Servicio de Sheer.
5. **Alisha Bot → Alisha Shop** en la base de datos.
6. **"A consultar"**: hoy el precio "desde" del catálogo ignora las ofertas marcadas como agotadas, por eso aparece "A consultar" aunque sí haya precio. Se corrige para usar cualquier precio cargado; "A consultar" solo cuando de verdad no hay precio.
7. **Páginas para Adultos**: nueva categoría propia; Pornhub y Brazzers se mueven ahí desde Streaming.
8. **Frase bajo el título**: se reemplaza por una línea más corta y premium (comparativa en tiempo real de todos tus grupos y vendedores, del precio más bajo al más alto). NO ese texto no Pon algo muy distinto eso no es lo que busco que lleve
9. **"Grupo de Venta Libre" → "Vendedores de Venta Libre"** en la ficha de servicio y en el directorio.
10. **Separador de miles**: $1,100 en lugar de $1100, en todas las vistas.

## Parte 2 — Formulario para agregar stock (protegido con PIN)

- Nueva página `/agregar` o un + hazlo de la manera que se vea mejor hablando en diseño y visualmente, con acceso por PIN. El PIN se guarda como secreto del servidor y se valida en el servidor; al acertar se abre una sesión (cookie) que dura varios días. Todo el catálogo sigue siendo público; solo agregar/editar/eliminar pide PIN.
- Flujo de captura en dos pasos:
  - Datos del vendedor una sola vez: nombre, tipo (Interno / Venta libre), grupo de origen y teléfono (solo si es venta libre). Se puede elegir un vendedor ya existente en vez de crear uno.
  - Varias filas de ofertas para ese mismo vendedor: categoría, servicio, tipo de producto (Perfil, Cuenta completa, Lote u otro personalizado), duración (1, 3, 6 meses, Anual u otra) y precio. Botón "+ Otra oferta" para seguir agregando sin repetir los datos del vendedor.
- Al guardar, las ofertas se insertan en la misma tabla que las existentes, así que el catálogo las ordena solo por precio dentro de su categoría / servicio / tipo / duración, con la etiqueta "Mejor precio" automática. Cero ajuste manual.
- Página de administración con la lista de ofertas para editar precio/detalle/disponibilidad o eliminar, con la misma protección por PIN.

## Parte 3 — Pulido visual (sin cambiar estructura)

- Jerarquía tipográfica más marcada, números tabulares y precios con más peso.
- Tarjetas con capas de superficie, bordes más finos y sombras suaves; acento de marca más sutil.
- Espaciados y áreas táctiles pensadas para celular; filas de oferta reorganizadas para pantalla angosta sin que se corten los datos.
- Micro-interacciones: transiciones en chips, tarjetas y botones; estados activos y de foco claros.
- Etiquetas ("Mejor precio", "Agotado") rediseñadas como pastillas discretas.

## Detalles técnicos

- Migraciones: nueva categoría `adultos`, reasignación de `services.category_id` para Pornhub/Brazzers, `UPDATE` de nombres de grupos (Alisha Shop y vendedores genéricos).
- Regla de teléfono: helper compartido que solo expone teléfono/aviso cuando `group.kind = 'venta_libre'`.
- Formato: `Intl.NumberFormat('es-MX')` en `formatPrice`.
- Gate por PIN: `createServerFn` con comparación en tiempo constante contra `ADMIN_PIN`, sesión cifrada con `SESSION_SECRET`; las escrituras se hacen en el servidor con el cliente privilegiado solo después de validar la sesión (las políticas actuales siguen siendo lectura pública / escritura restringida).
- Rutas nuevas: `/agregar` (captura) y su vista de edición; el resto de rutas no cambia.