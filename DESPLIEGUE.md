# Publicar Stockdex sin depender de Lovable

Este documento explica cómo dejar de depender de Lovable para hosting, dominio
y base de datos. Está escrito para hacerse **desde el celular**, sin instalar
nada.

Ahora mismo hay dos formas de compilar el proyecto:

| Comando | Qué usa | Para qué sirve |
|---|---|---|
| `npm run build` | `@lovable.dev/vite-tanstack-config` (paquete privado de Lovable) | Lo que usa Lovable al publicar. Sigue funcionando igual. |
| `npm run build:standalone` | `vite.config.standalone.ts`, solo paquetes públicos | Compila en cualquier sitio, sin Lovable. |

El segundo ya está probado: genera el mismo sitio, con datos reales y renderizado
en servidor. Mientras no cambies nada, Lovable sigue publicando como hasta hoy;
cuando quieras mudarte, ya está listo.

---

## 1. La base de datos ya es tuya (probablemente)

Lovable no aloja tu base: la crea **en tu propia cuenta de Supabase**. El
proyecto es `cvyaxwggbvzlkwnmdkje`.

**Compruébalo:** entra a <https://supabase.com/dashboard> con tu correo. Si ves
el proyecto en la lista, es tuyo y no hay nada que mudar — sobrevive aunque
canceles Lovable.

Si **no** aparece, está en la organización de Lovable y hay que moverlo:

1. En Supabase, crea un proyecto nuevo tuyo.
2. En el proyecto viejo: **Database → Backups → Download backup**.
3. En el nuevo: **SQL Editor** y pega el respaldo.
4. Cambia `SUPABASE_URL` y las llaves por las del proyecto nuevo (paso 3).

> Aparte de eso, el panel privado tiene **Exportar CSV** en «Revisar catálogo»:
> descárgalo de vez en cuando y tendrás una copia de tu stock que no depende de
> nadie.

---

## 2. Hosting propio: Cloudflare Workers

El proyecto ya se compila al formato de Cloudflare (es lo que Lovable usa por
debajo), así que es el camino más corto y **el plan gratuito alcanza de sobra**
para esta app.

### Lo que necesito que hagas tú (10 minutos, desde el celular)

1. **Crea una cuenta** en <https://dash.cloudflare.com/sign-up> — gratis, solo
   correo y contraseña.
2. Dentro, entra a **Workers & Pages → Create → Import a repository** y conecta
   tu cuenta de GitHub. Autoriza el repositorio `myappstreaming`.
3. Cuando pregunte cómo compilar, pon exactamente esto:
   - **Build command:** `npm run build:standalone`
   - **Deploy command:** `npx wrangler deploy`
   - **Branch:** `main`
4. En **Settings → Variables and Secrets**, agrega una por una las variables del
   archivo `.env.example` con los valores reales de tu Supabase. Marca como
   **Secret** (no como texto) estas tres:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
   - `ADMIN_PIN`
5. **Save and Deploy.**

A partir de ahí, cada vez que se actualice `main` en GitHub, Cloudflare vuelve a
publicar solo. Ya no hace falta abrir Lovable.

### Alternativas equivalentes

Si prefieres otro proveedor, el mismo comando funciona cambiando una variable:

| Proveedor | Variable de entorno | Comando de compilación |
|---|---|---|
| Cloudflare Workers | (ninguna, es el valor por omisión) | `npm run build:standalone` |
| Vercel | `NITRO_PRESET=vercel` | `npm run build:standalone` |
| Netlify | `NITRO_PRESET=netlify` | `npm run build:standalone` |
| Un servidor propio | `NITRO_PRESET=node-server` | `npm run build:standalone` y luego `node .output/server/index.mjs` |

---

## 3. Dominio propio

1. Cómpralo donde prefieras. En Cloudflare mismo (**Domain Registration →
   Register**) es lo más simple porque no hay que configurar DNS a mano; en
   Namecheap o Porkbun suele salir un poco más barato.
2. En **Workers & Pages → tu proyecto → Settings → Domains & Routes → Add custom
   domain**, escribe tu dominio.
3. Si lo compraste en Cloudflare, listo. Si lo compraste fuera, Cloudflare te
   muestra dos servidores de nombres; cópialos en el panel de donde lo compraste,
   en la sección «Nameservers». Tarda entre unos minutos y unas horas.

El certificado de seguridad (HTTPS) lo pone Cloudflare solo.

### Nombres de dominio disponibles que le quedan bien

El nombre de la app es **Stockdex**. En orden de preferencia:

1. `stockdex.app` — el que recomiendo: `.app` obliga a HTTPS y suena a producto.
2. `stockdex.mx` — si quieres que se lea claramente mexicano.
3. `stockdex.io` / `stockdex.co` — alternativas cortas.
4. `mejorprecio.app` — si prefieres describir en vez de nombrar.

Comprueba disponibilidad y precio antes de decidir; cambian seguido.

---

## 4. Qué pasa con Lovable después

- **Publicar desde Lovable seguirá siendo gratis** mientras estés en el plan
  gratuito: publicar no gasta créditos. Los créditos se gastan al **pedirle
  cambios a la IA de Lovable**, no al publicar ni al visitar la página.
- El dominio `myappstreaming.lovable.app` deja de actualizarse si dejas de
  publicar desde ahí, pero tu dominio propio en Cloudflare sí.
- El repositorio de GitHub es tuyo y seguirá funcionando aunque canceles.
- Lo único que se pierde es el editor visual de Lovable.

**Sugerencia:** no canceles Lovable el mismo día. Publica primero en Cloudflare,
comprueba una semana que todo va bien, y recién entonces desconéctalo.
