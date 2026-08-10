# Lupa, wordmark, seguridad, rendimiento y nuevo grupo

## 1. Lupa del buscador de la portada (Y)

El código de la portada ya incluye el ícono de lupa a la izquierda del campo; falta verificar por qué no se ve (posible versión vieja en el link público o ícono con muy poco contraste). Primer paso: comprobarlo en el navegador contra la app en ejecución. Luego, en la portada, la lupa quedará más grande que la de /agregar (buscador más ancho) y con mejor contraste, alineada verticalmente con el texto.

## 2. Wordmark "Stock Index" centrado (AA)

Reemplaza "STOCK BOARD" por **Stock Index**, centrado horizontalmente sobre el buscador: "Stock" con peso fuerte y "Index" en trazo fino y tono apagado, tipografía display con tracking amplio, tratamiento de logotipo (no etiqueta de sistema). Se centra también el bloque de estadísticas para que la composición quede simétrica.

## 3. Advertencia de seguridad (KK)

Revisión hecha: las acciones de editar/eliminar vendedor **no** son funciones de base de datos; son funciones de servidor que ya validan la sesión de PIN en el servidor antes de tocar datos (`requireUnlocked`), así que ese camino ya está cerrado. La advertencia del escáner apunta a funciones internas de la base:

- `set_updated_at` (trigger): pasa a SECURITY INVOKER y se le revoca EXECUTE a los roles públicos.
- `has_role`: debe seguir siendo SECURITY DEFINER porque las políticas de acceso dependen de ella; se limita su permiso de ejecución al mínimo necesario y se documenta en la memoria de seguridad por qué es segura (solo lee el rol del usuario que se le pasa).

Además se refuerza el PIN: cada acción sensible revalida la sesión en el servidor y, ante cualquier fallo, el estado por defecto es bloqueado.

## 4. Rendimiento del scroll (EE)

En categorías largas (Trámites) el scroll se traba. Plan conservador, sin cambiar comportamiento:

- Renderizado incremental de la cuadrícula: se pinta un primer bloque de tarjetas y el resto entra por lotes al acercarse el scroll, con altura reservada para que no haya saltos.
- Se memorizan las tarjetas y los cálculos de precio para evitar recomputar toda la lista en cada tecla del buscador.
- Se quitan efectos costosos (desenfoques y sombras grandes) de las tarjetas fuera de vista.
- Buscador, filtros, edición y eliminación siguen funcionando idénticos; si algo se rompe, se elige la versión conservadora.

## 5. Revisión completa (EE)

Recorrido automatizado: cada categoría, varias fichas por categoría, apertura y cierre de cada modal (PIN, editar y eliminar vendedor), y búsquedas combinadas (servicio, servicio + duración, vendedor, teléfono con y sin lada) en portada y /agregar. Se corrige lo que aparezca.

## 6. Nuevo grupo BLACKSHOP RENACIDO (MM)

- Se crea el quinto grupo padre **BLACKSHOP RENACIDO**, ubicado al final de /grupos, después de C/V Xime.
- Primer vendedor: **Vendedor A**, teléfono +52 333 773 9475, con el mismo formato del resto.
- Catálogo cargado por migración: perfiles (Disney+ $8, Disney+ Anual $35, Max Platino $7 y 12 meses $15, Paramount+ $8, ViX 1 mes $2, Prime Video $4, Netflix $30), completas (Disney+ $65, Disney+ Anual $65, Max Platino $28 y 12 meses $45, Paramount+ $20, ViX 1 mes $5 y 12 meses $10, Apple TV+ $39, Prime Video $20, Netflix $125), Spotify Individual 12 meses $38 y Canva 1 y 2 meses ($4 / $5).
- Entra automáticamente en ambos buscadores, en el cálculo de "Desde" y "Mejor precio", y es editable/eliminable como cualquier otro.

## 7. Publicar y GitHub (JJ, LL)

- Al terminar todo, publico el sitio y confirmo que el link público ya muestra los cambios.
- La sincronización con GitHub no puede iniciarla yo desde aquí: se activa desde el menú "+" del chat → GitHub → Conectar proyecto, y a partir de ahí el repositorio se mantiene sincronizado en ambos sentidos automáticamente. Te indico los pasos exactos al entregar.

## Notas técnicas

- Wordmark y lupa: solo `src/routes/index.tsx` y `styles.css`.
- Seguridad: migración con `ALTER FUNCTION ... SECURITY INVOKER` para `set_updated_at`, revocación de EXECUTE y actualización de la memoria de seguridad.
- Rendimiento: lotes por `IntersectionObserver` y memorización en la cuadrícula del catálogo; sin virtualización dura para no romper búsqueda ni anclas.
- Datos del nuevo grupo por migración/SQL, con `sort_order` posterior a todos los grupos existentes.
