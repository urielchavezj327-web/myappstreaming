/**
 * Configuración de compilación independiente de Lovable.
 *
 * `vite.config.ts` usa `@lovable.dev/vite-tanstack-config`, un paquete privado
 * que solo se descarga desde el registro de Lovable. Mientras el proyecto siga
 * publicándose desde ahí eso no estorba, pero significa que el repositorio no
 * se puede compilar en ningún otro sitio: sin ese paquete, `vite build` falla.
 *
 * Este archivo arma a mano exactamente los mismos complementos, todos públicos
 * y ya presentes en package.json. Con él la aplicación se compila y se publica
 * en cualquier hosting sin depender de Lovable.
 *
 *     npm run build:standalone
 *
 * Los dos archivos conviven a propósito: el de Lovable sigue funcionando tal
 * cual hasta que decidas apagarlo.
 */
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(async ({ mode }) => {
  // Las variables VITE_* se incrustan en el cliente, igual que hace Lovable.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    define[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return {
    define,
    css: { transformer: "lightningcss" as const },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      // React y TanStack tienen que resolverse una sola vez o el SSR duplica
      // el runtime y los hooks fallan.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        // Mismo punto de entrada del servidor que usa la configuración actual.
        server: { entry: "server" },
        importProtection: {
          behavior: "error" as const,
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
      }),
      // `cloudflare-module` es el mismo destino que compila Lovable hoy, así
      // que el resultado es el que ya está probado. Se puede cambiar por
      // `node-server`, `vercel` o `netlify` con la variable NITRO_PRESET.
      nitro({ defaultPreset: process.env["NITRO_PRESET"] ?? "cloudflare-module" }),
    ],
    server: { host: "127.0.0.1", port: 8080 },
  };
});
