import { memo } from "react";

import type { Brand, BrandFont } from "@/lib/brands";
import { BrandSymbol } from "@/components/brand-symbols";

/**
 * Logotipo de un servicio.
 *
 * Se compone de tres piezas, en el orden en que se leen: el símbolo de la
 * marca, el nombre con la tipografía del logotipo real, y el sufijo que
 * algunas marcas llevan aparte (el «+» de Paramount+, «Premium» de YouTube,
 * el bloque naranja de Pornhub).
 *
 * El tamaño no es fijo: la caja padre declara `container-type: inline-size` y
 * aquí todo se mide en `cqw`, así que un nombre corto llena la tarjeta y uno
 * largo se reparte en dos o tres líneas sin salirse. Es lo que hace que
 * Netflix y «Pagos de servicios con descuento» ocupen el mismo hueco.
 */

export type WordmarkSize = "tile" | "row" | "hero";

const FAMILY: Record<BrandFont, string> = {
  display: "var(--font-display)",
  grotesk: "var(--font-grotesk)",
  geometric: "var(--font-geometric)",
  condensed: "var(--font-condensed)",
  script: "var(--font-script)",
  serif: "var(--font-serif)",
};

/** Ancho medio de carácter como fracción del cuerpo, por familia. */
const CHAR_W: Record<BrandFont, number> = {
  display: 0.6,
  grotesk: 0.56,
  geometric: 0.55,
  condensed: 0.43,
  script: 0.45,
  serif: 0.47,
};

type Box = {
  /** Ancho útil en cqw (la caja mide 100cqw). */
  width: number;
  /** Cuerpo máximo en cqw. */
  max: number;
  /** Cuerpo mínimo en cqw. */
  min: number;
  /** Lado del símbolo en cqw, antes de aplicar `symbolScale`. */
  symbol: number;
  /** Líneas permitidas. */
  lines: number;
  /**
   * Altura disponible para el bloque completo, en cqw. La tarjeta del mosaico
   * tiene proporción fija, así que un nombre de tres líneas se sale por abajo
   * si solo se ajusta al ancho; con este tope el cuerpo baja lo necesario.
   * `0` = sin límite (la ficha y las filas crecen a lo alto).
   */
  height: number;
};

/** Interlínea del bloque de nombre. */
const LINE_H = 1.04;

const BOX: Record<WordmarkSize, Box> = {
  tile: { width: 100, max: 30, min: 8, symbol: 34, lines: 3, height: 64 },
  row: { width: 100, max: 12, min: 4.6, symbol: 12, lines: 2, height: 0 },
  hero: { width: 100, max: 22, min: 7, symbol: 26, lines: 3, height: 0 },
};

/** Reparte el texto en `n` líneas equilibradas sin cortar palabras. */
function wrap(text: string, n: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (n <= 1 || words.length <= 1) return [text];
  if (words.length < n) return words;

  // Búsqueda simple: probar todos los cortes y quedarse con el más parejo.
  const best = { lines: [text], spread: Infinity };
  const cut = (start: number, left: number, acc: string[]) => {
    if (left === 1) {
      const lines = [...acc, words.slice(start).join(" ")];
      const lens = lines.map((l) => l.length);
      const spread = Math.max(...lens) - Math.min(...lens) + Math.max(...lens) * 0.001;
      if (spread < best.spread) {
        best.spread = spread;
        best.lines = lines;
      }
      return;
    }
    for (let i = start + 1; i <= words.length - left + 1; i += 1) {
      cut(i, left - 1, [...acc, words.slice(start, i).join(" ")]);
    }
  };
  cut(0, n, []);
  return best.lines;
}

/**
 * Elige cuántas líneas y con qué cuerpo. Cada línea extra cuesta un 8%: entre
 * dos composiciones parecidas gana la de menos líneas, que es la que se lee
 * como logotipo y no como párrafo.
 */
function fit(text: string, brand: Brand, box: Box, availableHeight: number) {
  const charW = CHAR_W[brand.font] * (brand.weight >= 700 ? 1.05 : 1) * (brand.upper ? 1.12 : 1);
  const track = parseFloat(brand.tracking) || 0;

  let winner = { lines: [text], size: box.min, score: -Infinity };
  const maxLines = Math.min(brand.maxLines ?? box.lines, box.lines, text.split(/\s+/).length);

  for (let n = 1; n <= Math.max(1, maxLines); n += 1) {
    const lines = wrap(text, n);
    const longest = Math.max(...lines.map((l) => l.length));
    const perChar = charW + track;
    // 0.96 de margen: la métrica real de la fuente varía unas décimas
    // respecto a la estimación y sin holgura el navegador parte la línea.
    const byWidth = (box.width * 0.96) / Math.max(longest * perChar, 0.001);
    const byHeight = availableHeight > 0 ? availableHeight / (n * LINE_H) : Infinity;
    const size = Math.min(box.max, byWidth, byHeight);
    const score = size * Math.pow(0.92, n - 1);
    if (score > winner.score) winner = { lines, size, score };
  }

  return { lines: winner.lines, size: Math.max(box.min, winner.size) };
}

/**
 * «Disney» recreado en vector.
 *
 * La tipografía del logotipo es un lettering propio, no una fuente: ninguna
 * familia de Google se le acerca, así que va dibujada a trazo — un monolineal
 * con la bandera de la D y la cola larga de la y, que son los dos rasgos por
 * los que se reconoce.
 */
function DisneyScript({ width, color }: { width: string; color: string }) {
  return (
    <svg
      viewBox="0 0 492 158"
      width={width}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
      focusable="false"
    >
      <g fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round">
        {/* D: asta con bandera, y bombo */}
        <path d="M92 116 C 86 72, 84 38, 62 27 C 40 16, 24 36, 40 51 C 56 66, 90 60, 116 47" />
        <path d="M98 48 C 136 33, 176 47, 178 79 C 180 108, 144 124, 104 116" />
        {/* i */}
        <path d="M206 70 C 202 86, 202 100, 209 108 C 214 114, 222 111, 229 102" />
        <circle cx="209" cy="47" r="7" fill={color} stroke="none" />
        {/* s */}
        <path d="M264 74 C 258 65, 245 65, 243 76 C 241 89, 265 91, 265 103 C 265 114, 250 116, 243 107" />
        {/* n */}
        <path d="M283 110 C 283 92, 285 78, 288 70 C 290 82, 295 85, 301 76 C 310 64, 326 67, 326 82 C 326 93, 324 101, 324 110" />
        {/* e */}
        <path d="M341 94 C 355 92, 369 87, 369 78 C 369 69, 358 67, 351 76 C 342 88, 345 108, 360 110 C 369 111, 378 105, 385 96" />
        {/* y, con la cola que vuelve por debajo */}
        <path d="M396 70 C 396 86, 400 100, 408 104 C 415 107, 421 99, 423 84 C 424 74, 424 70, 424 70 C 424 70, 425 100, 419 122 C 412 148, 392 154, 378 146 C 368 141, 368 129, 378 126" />
        {/* El «+» va dentro del vector: así nunca se despega del nombre. */}
        <path d="M462 30 v46 M439 53 h46" strokeWidth={11} />
      </g>
    </svg>
  );
}

export const Wordmark = memo(function Wordmark({
  name,
  brand,
  size,
}: {
  name: string;
  brand: Brand;
  size: WordmarkSize;
}) {
  // El «+» de Paramount+, Universal+ o Apple TV+ ya viene en el nombre del
  // servicio: se quita del texto para que lo dibuje `Suffix` con su propio
  // peso, pegado a la última letra y no en una línea aparte.
  const raw = brand.label ?? name;
  const label = brand.suffix === "+" ? raw.replace(/\s*\+\s*$/, "") : raw;

  const inkStyle: React.CSSProperties = brand.inkGrad
    ? {
        backgroundImage: brand.inkGrad,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }
    : { color: "var(--wordmark-ink)" };

  /*
   * La fila ancha de los trámites no usa `cqw`: su caja es tan ancha como la
   * pantalla y el cuerpo calculado sobre ese ancho salía enorme. Aquí el
   * nombre es texto normal, con el símbolo a un lado y un cuerpo fijo.
   */
  if (size === "row") {
    return (
      <span className="flex min-w-0 items-center gap-3">
        {brand.symbol ? (
          <BrandSymbol
            id={brand.symbol}
            size="1.65rem"
            className="shrink-0"
            {...(brand.symbolInk ? { ink: brand.symbolInk } : {})}
            {...(brand.symbolHole ? { hole: brand.symbolHole } : {})}
          />
        ) : null}
        <span
          className="min-w-0 flex-1 text-left text-[1.02rem] leading-[1.25]"
          style={{
            fontFamily: FAMILY[brand.font],
            fontWeight: Math.min(brand.weight, 650),
            letterSpacing: "-0.02em",
            fontStyle: brand.italic ? "italic" : "normal",
            ...inkStyle,
          }}
        >
          {label}
        </span>
      </span>
    );
  }

  const box = BOX[size];
  const symbolSide =
    brand.symbol || brand.font === "script" ? box.symbol * (brand.symbolScale ?? 0.7) : 0;
  const gap = symbolSide * 0.22;
  // Lo que queda para el nombre tras descontar el símbolo y su separación.
  const available = box.height > 0 ? Math.max(box.height - symbolSide - gap, 12) : 0;
  const { lines, size: fontSize } = fit(label, brand, box, available);

  return (
    <span className="flex flex-col items-center" style={{ gap: `${gap}cqw` }}>
      {brand.font === "script" ? (
        <DisneyScript width={`${box.width * 0.94}cqw`} color={brand.ink} />
      ) : brand.symbol ? (
        <BrandSymbol
          id={brand.symbol}
          size={`${symbolSide}cqw`}
          {...(brand.symbolInk ? { ink: brand.symbolInk } : {})}
          {...(brand.symbolHole ? { hole: brand.symbolHole } : {})}
        />
      ) : null}

      <span
        className="text-center"
        style={{
          fontFamily: FAMILY[brand.font],
          fontSize: `${fontSize}cqw`,
          fontWeight: brand.weight,
          letterSpacing: brand.tracking,
          fontStyle: brand.italic ? "italic" : "normal",
          textTransform: brand.upper ? "uppercase" : "none",
          lineHeight: LINE_H,
          // Cuando el logotipo real es de una sola línea (HBO Max, Tidal), se
          // impide el salto: la estimación de ancho puede quedarse corta por
          // unas décimas y el navegador partiría la palabra.
          whiteSpace: brand.maxLines === 1 ? "nowrap" : undefined,
          textShadow: brand.inkGrad ? undefined : "var(--wordmark-shadow)",
          ...inkStyle,
        }}
      >
        {brand.font === "script"
          ? null
          : lines.map((line, i) => (
              <span key={i} className="block">
                {line}
                {/* El sufijo corto va pegado a la última línea, no debajo. */}
                {brand.suffix && brand.suffix.length <= 3 && i === lines.length - 1 ? (
                  <Suffix brand={brand} fontSize={fontSize} />
                ) : null}
              </span>
            ))}
        {brand.suffix && brand.suffix.length > 3 && brand.font !== "script" ? (
          <Suffix brand={brand} fontSize={fontSize} />
        ) : null}
      </span>
    </span>
  );
});

/**
 * El segundo bloque del logotipo. Tres formas distintas según la marca: un «+»
 * pegado al nombre, una palabra en peso ligero («Premium», «Pro») o un bloque
 * de color con su propio fondo (el «hub» de Pornhub).
 */
function Suffix({ brand, fontSize }: { brand: Brand; fontSize: number }) {
  const text = brand.suffix as string;
  const isPlus = text === "+";

  if (brand.suffixBg) {
    return (
      <span
        style={{
          display: "inline-block",
          background: brand.suffixBg,
          color: brand.suffixInk ?? "#000",
          padding: `0 ${fontSize * 0.16}cqw`,
          borderRadius: `${fontSize * 0.14}cqw`,
          marginLeft: `${fontSize * 0.08}cqw`,
        }}
      >
        {text}
      </span>
    );
  }

  if (isPlus) {
    return (
      <span
        style={{
          fontFamily: "var(--font-grotesk)",
          fontWeight: 400,
          fontStyle: "normal",
          letterSpacing: "0",
          fontSize: "0.62em",
          verticalAlign: "0.5em",
          marginLeft: "0.06em",
        }}
      >
        +
      </span>
    );
  }

  return (
    <span
      className="block"
      style={{
        fontFamily: "var(--font-grotesk)",
        fontWeight: 300,
        fontStyle: "normal",
        fontSize: `${fontSize * 0.46}cqw`,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        opacity: 0.82,
        marginTop: `${fontSize * 0.14}cqw`,
      }}
    >
      {text}
    </span>
  );
}
