/**
 * Genera `src/components/logos/generated.ts`.
 *
 * Junta las dos fuentes de forma vectorial que sí alcanzamos desde aquí:
 *
 *  · `traced.json` — los logotipos completos (símbolo + nombre) vectorizados
 *    con potrace a partir de las imágenes de referencia. Ver `trace.py`.
 *  · `simple-icons` — el símbolo oficial de las marcas de las que no hay
 *    imagen. Ojo: casi siempre es SOLO el símbolo, sin el nombre.
 *
 * Se ejecuta a mano cuando cambia alguna de las dos:
 *     node scripts/logos/emit.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const traced = JSON.parse(readFileSync(join(here, "traced.json"), "utf8"));

/** Símbolos oficiales de `simple-icons`, para marcas sin imagen de referencia. */
const WANTED = [
  "hbo", // el «HBO» del lockup; el «max» va trazado de la imagen de Uri
  "appletv", // trae el wordmark completo (manzana + tv)
  "plex", // trae el wordmark completo
  "fox", // trae el wordmark completo
  "discord",
  "duolingo", // el búho: en la imagen es verde sobre verde y no se puede trazar
];

const si = await import("simple-icons");
const marks = {};
for (const slug of WANTED) {
  const key = "si" + slug[0].toUpperCase() + slug.slice(1);
  const icon = si[key];
  if (!icon) {
    console.warn(`  ! sin icono en simple-icons: ${slug}`);
    continue;
  }
  marks[slug] = { d: icon.path, hex: `#${icon.hex}`, title: icon.title };
}

const q = (s) => JSON.stringify(s);

const out = `// GENERADO por scripts/logos/emit.mjs — no editar a mano.
//
// \`TRACED\` son los logotipos completos vectorizados de las imágenes de
// referencia: el nombre va como contorno, no como texto con una fuente
// parecida, así que la tipografía de cada marca queda exacta.
//
// \`MARKS\` son los símbolos oficiales de simple-icons, en lienzo 24×24 y de
// un solo color. Sirven de símbolo, nunca de logotipo completo.

export type TracedLayer = { fill: string; d: string };
export type TracedLogo = {\n  viewBox: string;\n  /** Fracción del encuadre realmente cubierta por trazo, de 0 a 1. */\n  coverage: number;\n  layers: TracedLayer[];\n};

export const TRACED: Record<string, TracedLogo> = ${JSON.stringify(traced, null, 0)};

export type Mark = { d: string; hex: string; title: string };

export const MARKS: Record<string, Mark> = {
${Object.entries(marks)
  .map(([k, v]) => `  ${k}: { d: ${q(v.d)}, hex: ${q(v.hex)}, title: ${q(v.title)} },`)
  .join("\n")}
};
`;

const dest = join(here, "..", "..", "src", "components", "logos", "generated.ts");
writeFileSync(dest, out);
console.log(
  `→ ${dest}\n  ${Object.keys(traced).length} logotipos vectorizados · ${Object.keys(marks).length} símbolos de simple-icons · ${(out.length / 1024).toFixed(1)} KB`,
);
