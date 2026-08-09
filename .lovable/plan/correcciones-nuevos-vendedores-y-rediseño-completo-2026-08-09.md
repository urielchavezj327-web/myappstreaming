# Correcciones, nuevos vendedores y rediseño completo

Orden de trabajo: primero datos y bugs (X–EE, GG–II), verificación, y al final el rediseño (FF).

## 1. Buscadores (X, Y, Z, CC)

- Buscador de /agregar: añadir ícono de lupa a la izquierda y botón "X" para borrar el texto, idénticos a los de la portada.
- Buscador de la portada: no existe la lupa crearla con buen diseño y cambiar el placeholder a "Busca cualquier servicio, vendedor o número…".
- Teléfonos: normalizar tanto la consulta como el número guardado a solo dígitos, e ignorar el prefijo de país. Buscar "+52 55 2378 6815", "5523786815" o "52 55 2378 6815" debe dar el mismo resultado. Se aplica a los dos buscadores.

## 2. Título de sección (AA)

Wordmark corto en inglés arriba del buscador de la portada, con tipografía propia (display, tracking amplio, tratamiento tipo logotipo, no etiqueta de sistema). Propuesta: **STOCK BOARD** con "STOCK" sólido y "BOARD" en trazo fino, para que tenga carácter sin sentirse marketinero. Pero puedes poner algún otro título siempre y cuando sea atractivo, agradable corto y siendo original no necesariamente tiene que ser ese 

## 3. PIN en el sitio publicado (BB)

La lógica del PIN es la misma en preview y en producción; la causa más probable de que no lo pida en el link público es que la sesión de administrador quedó abierta en ese navegador (la cookie dura 14 días) — esto no está confirmado todavía, así que el primer paso será verificarlo en el sitio publicado antes de aplicar el arreglo. Con eso confirmado:

- Reducir la duración de la sesión de administrador y añadir un botón visible de "Bloquear" en /agregar y en /grupos.
- Reverificar la sesión en el servidor cada vez que se abre el modal, no una sola vez al cargar la página.
- Si la verificación de sesión falla por cualquier motivo, el estado por defecto será bloqueado (nunca abierto).
- Presentar el PIN siempre como modal pequeño con fondo difuminado (en /agregar hoy es una pantalla completa), acorde al resto del diseño.
- Publicar al final y confirmar en el link público que el PIN se exige de nuevo.

## 4. Datos

- **DD**: en la ficha del Vendedor B (Plug House, 81 3914 7673) solo hay una oferta de $80 de "Diamantes, likes 2K, Pase Booyah…"; existe además una de $50 "Panel diamantes, Pase Booyah y fragmentos" que parece ser la repetida. Se eliminará la repetida y quedará únicamente la de $80. Los dos ítems de $100 ("Página web reportes" y "Página para sacar panel…") se conservan intactos.
- **GG**: actualizar precios de Fernando Contreras (grupo interno) con la lista vigente; se comparan sus 36 ofertas actuales una por una, se corrigen precios cambiados, se agregan las que falten y se dejan como "A consultar" los pagos con descuento y seguidores.
- **HH**: alta de "Esme Shop" (56 6536 5802, Venta Libre Cherrycita) con todo su catálogo; Viki se carga una sola vez a $10; Game Pass Premium a $140 solo para este vendedor.
- **II**: alta de "Vendedor G" (56 4593 2888, Venta Libre Cherrycita) con su catálogo; los bundles ("2 X $55", "2 por $100", "3 por $100", Apple TV+ con Apple Music) se guardan como detalle dentro de su oferta, no como productos aparte; Canva solo con 1 y 2 meses.
- Ambos vendedores nuevos reciben la posición correcta dentro de su grupo padre en /grupos y entran automáticamente en el cálculo de "Desde" y "Mejor precio", y en los dos buscadores.

## 5. Revisión completa (EE)

Recorrido automatizado con navegador: cada categoría, varias fichas por categoría, apertura y cierre de cada modal (PIN, editar y eliminar vendedor), y batería de búsquedas (servicio, servicio + duración, servicio + tipo, vendedor, teléfono con y sin formato) en portada y /agregar. Se corrige todo lo que aparezca antes de entregar.

## 6. Rediseño completo (FF)

Se aplica al final, sin cambiar datos, cálculos ni comportamiento.

- **Portada**: wordmark + buscador como centro de la pantalla, chips de categoría con conteo, y catálogo en tarjetas con acento real de cada marca, sombra en capas y vidrio esmerilado.
- **Ficha de servicio**: encabezado con el color de la marca, resumen (mejor precio, número de ofertas, vendedores), y ofertas agrupadas por tipo y duración con la mejor claramente destacada.
- **/grupos**: secciones por grupo padre con encabezado propio, tarjetas de vendedor uniformes, acciones de editar/eliminar visibles y protegidas por PIN.
- **/agregar** (el que más cambia): panel de administración de verdad — barra superior con estado de sesión y botón de bloquear, dos zonas claras ("Capturar stock" y "Buscar y editar"), formulario en tarjetas por bloque con etiquetas consistentes, filas de oferta compactas y edición en línea, buscador con lupa y botón de borrar.
- **Modales, estados vacíos y de carga**: un solo lenguaje visual en toda la app (vidrio, radios, tipografía y animación de entrada iguales), con esqueletos de carga y estados vacíos ilustrados con ícono y texto guía.

## Notas técnicas

- Normalización de teléfono compartida en `catalog.functions.ts` y `admin.functions.ts` (solo dígitos, comparación por sufijo para ignorar lada).
- Cambios de datos por migración/inserción SQL, no por código de carga en tiempo de ejecución.
- El gate de administrador se reevalúa en servidor al abrir cada acción sensible; `getAdminState` con fallo ⇒ bloqueado.
- Rediseño concentrado en componentes y CSS (`styles.css`, `offer-list.tsx`, rutas), sin tocar `catalog.functions.ts` salvo lo de teléfono.