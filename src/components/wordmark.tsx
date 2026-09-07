import { memo } from "react";

import type { Brand, BrandFont } from "@/lib/brands";

/**
 * Recrea el logotipo de cada servicio: familia, peso, caja y tracking propios
 * de la marca, más los elementos gráficos que la identifican (la curva de
 * Prime Video, la medialuna de Disney+, las dos líneas de HBO Max, el abanico
 * de Peacock). Cuando no hay logotipo reconocible —trámites, servicios
 * propios— usa la tipografía display de la app con la misma composición.
 *
 * El tamaño no es fijo: se calcula para que el nombre LLENE su tarjeta. Las
 * medidas van en `cqw` (porcentaje del ancho del contenedor), así que la misma
 * fórmula sirve para la tarjeta del mosaico, la fila de trámites y el
 * encabezado de la ficha sin números mágicos por pantalla.
 */

const FONTS: Record<BrandFont, string> = {
  display: "var(--font-display)",
  condensed: "var(--font-condensed)",
  script: "var(--font-script)",
  serif: "var(--font-serif)",
  sans: "var(--font-sans)",
};

/** Ancho medio de carácter en “em” por familia, para estimar el ajuste. */
const CHAR_WIDTH: Record<BrandFont, number> = {
  display: 0.6,
  condensed: 0.45,
  script: 0.44,
  serif: 0.47,
  sans: 0.56,
};

export type WordmarkSize = "tile" | "row" | "hero";

/**
 * Espacio disponible para el nombre, en porcentaje del ancho del contenedor.
 * Las unidades `cqw` se miden contra la caja de contenido, así que el relleno
 * de la tarjeta ya está descontado y el ancho útil es el 100 %.
 */
const BOX: Record<WordmarkSize, { width: number; height: number; max: number }> = {
  // Tarjeta del mosaico: alto ≈ 82 % del ancho, menos el conteo de ofertas.
  tile: { width: 100, height: 58, max: 34 },
  // Fila ancha y baja de los trámites.
  row: { width: 100, height: 24, max: 10 },
  // Encabezado de la ficha, sobre el ancho de la página.
  hero: { width: 100, height: 40, max: 21 },
};

/**
 * Mayor tamaño de letra que cabe en la caja. Prueba repartir el nombre en 1 a 4
 * líneas y se queda con el reparto que permite el cuerpo más grande.
 */
function fitSize(text: string, font: BrandFont, size: WordmarkSize): number {
  const box = BOX[size];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return box.max;
  const longest = Math.max(...words.map((w) => w.length));
  const charWidth = CHAR_WIDTH[font];
  const maxLines = Math.min(4, words.length);

  let best = 0;
  for (let lines = 1; lines <= maxLines; lines++) {
    // Ninguna línea puede ser más corta que la palabra más larga.
    const perLine = Math.max(longest, Math.ceil(text.length / lines));
    const byWidth = box.width / (perLine * charWidth);
    const byHeight = box.height / (lines * 1.16);
    // Pequeña penalización por línea extra: entre dos repartos parecidos gana
    // el de menos líneas, que siempre se lee mejor.
    const score = Math.min(byWidth, byHeight) * (1 - 0.07 * (lines - 1));
    if (score > best) best = score;
  }
  return Math.min(best, box.max);
}

export const Wordmark = memo(function Wordmark({
  name,
  brand,
  size = "tile",
}: {
  name: string;
  brand: Brand;
  size?: WordmarkSize;
}) {
  const wantsPlus = brand.mark === "plus" || brand.mark === "arc";
  const label = wantsPlus ? name.replace(/\s*\+\s*$/, "") : name;
  const hasPlus = wantsPlus && /\+\s*$/.test(name);

  const twoLine = brand.mark === "twoLine" && brand.lines;
  // En dos líneas la primera manda: se ajusta a ella y la segunda va escalada.
  const measured = twoLine ? (brand.lines?.[0] ?? label) : label;
  const cqw = fitSize(measured, brand.font, size) * (twoLine ? 0.86 : 1);

  const style: React.CSSProperties = {
    fontFamily: FONTS[brand.font],
    fontWeight: brand.weight,
    letterSpacing: brand.tracking,
    fontStyle: brand.italic ? "italic" : "normal",
    textTransform: brand.upper ? "uppercase" : "none",
    fontSize: `${cqw.toFixed(2)}cqw`,
    color: "var(--wordmark-ink)",
    textShadow: "var(--wordmark-shadow)",
    lineHeight: brand.font === "script" ? 1.12 : 1.04,
  };

  if (twoLine && brand.lines) {
    const [first, second] = brand.lines;
    return (
      <span className="flex flex-col items-center leading-none">
        <span style={{ ...style, letterSpacing: "-0.045em" }}>{first}</span>
        <span
          style={{
            ...style,
            fontSize: `${(cqw * 0.58).toFixed(2)}cqw`,
            fontWeight: 300,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginTop: "0.14em",
            opacity: 0.94,
          }}
        >
          {second}
        </span>
      </span>
    );
  }

  return (
    <span className="relative inline-flex max-w-full flex-col items-center">
      {brand.mark === "peacock" ? <PeacockFan /> : null}
      {brand.mark === "arc" ? <DisneyArc /> : null}
      <span className="inline-flex max-w-full items-start justify-center">
        <span style={style} className="text-balance">
          {label}
        </span>
        {hasPlus ? (
          <span
            style={{
              ...style,
              fontFamily: "var(--font-display)",
              fontSize: `${(cqw * 0.52).toFixed(2)}cqw`,
              fontWeight: 600,
              letterSpacing: "0",
              fontStyle: "normal",
              marginLeft: "0.1em",
              marginTop: "0.06em",
            }}
            aria-hidden
          >
            +
          </span>
        ) : null}
      </span>
      {brand.mark === "smile" ? <PrimeSmile /> : null}
    </span>
  );
});

/** Curva ascendente bajo el nombre, como el trazo de Prime Video. */
function PrimeSmile() {
  return (
    <svg
      viewBox="0 0 120 16"
      className="mt-[0.16em] h-[0.4em] w-[88%] overflow-visible"
      style={{ fontSize: "inherit" }}
      fill="none"
      aria-hidden
    >
      <path
        d="M3 4C22 13.5 52 16 74 13.2 89 11.3 101 7.6 110 2.6"
        stroke="var(--wordmark-ink)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path d="M104 0.6 118 2.2 108.5 11.4Z" fill="var(--wordmark-ink)" />
    </svg>
  );
}

/** Medialuna sobre el nombre, como el arco de Disney+. */
function DisneyArc() {
  return (
    <svg
      viewBox="0 0 120 18"
      className="mb-[-0.3em] h-[0.4em] w-[76%] overflow-visible"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 16C14 5.5 34 1 60 1s46 4.5 58 15"
        stroke="var(--wordmark-ink)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Abanico de plumas del pavo real de Peacock, con sus seis colores. */
const PEACOCK = ["#FCB711", "#F37021", "#CC004C", "#6460AA", "#0089D0", "#0DB14B"];
function PeacockFan() {
  return (
    <svg viewBox="0 0 72 34" className="mb-[0.18em] h-[0.7em] w-[2em]" fill="none" aria-hidden>
      {PEACOCK.map((color, i) => (
        <path
          key={color}
          d="M36 33C36 33 30 21 30 13a6 6 0 0 1 12 0c0 8-6 20-6 20Z"
          fill={color}
          transform={`rotate(${(i - 2.5) * 23} 36 33)`}
        />
      ))}
    </svg>
  );
}
