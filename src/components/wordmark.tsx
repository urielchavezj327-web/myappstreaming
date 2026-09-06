import { memo } from "react";

import type { Brand } from "@/lib/brands";

/**
 * Recrea el logotipo de cada servicio: familia, peso, caja y tracking propios
 * de la marca, más los elementos gráficos que la identifican (la curva de
 * Prime Video, la medialuna de Disney+, las dos líneas de HBO Max, el abanico
 * de Peacock). Cuando no hay logotipo reconocible —trámites, servicios
 * propios— cae en la tipografía display de la app con la misma composición.
 */

const FONTS: Record<Brand["font"], string> = {
  display: "var(--font-display)",
  condensed: "var(--font-condensed)",
  script: "var(--font-script)",
  serif: "var(--font-serif)",
  sans: "var(--font-sans)",
};

export type WordmarkSize = "tile" | "row" | "hero";

/** Escala del nombre según el largo, para que nunca desborde la tarjeta. */
function fontSize(text: string, size: WordmarkSize, font: Brand["font"]) {
  const len = text.length;
  const base =
    size === "hero"
      ? len > 26
        ? 1.7
        : len > 18
          ? 2.05
          : 2.6
      : size === "row"
        ? len > 30
          ? 1.0
          : len > 20
            ? 1.12
            : 1.24
        : len > 26
          ? 1.02
          : len > 18
            ? 1.18
            : len > 11
              ? 1.42
              : 1.62;
  // Las serif y las script tienen ojo pequeño: necesitan algo más de cuerpo.
  const boost = font === "script" ? 1.24 : font === "serif" ? 1.12 : 1;
  return `${(base * boost).toFixed(3)}rem`;
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

  const style: React.CSSProperties = {
    fontFamily: FONTS[brand.font],
    fontWeight: brand.weight,
    letterSpacing: brand.tracking,
    fontStyle: brand.italic ? "italic" : "normal",
    textTransform: brand.upper ? "uppercase" : "none",
    fontSize: fontSize(label, size, brand.font),
    color: "var(--wordmark-ink)",
    textShadow: "var(--wordmark-shadow)",
    lineHeight: brand.font === "script" ? 1.1 : 1.05,
  };

  if (brand.mark === "twoLine" && brand.lines) {
    const [first, second] = brand.lines;
    return (
      <span className="flex flex-col items-center leading-none">
        <span style={{ ...style, letterSpacing: "-0.045em" }}>{first}</span>
        <span
          style={{
            ...style,
            fontSize: `calc(${style.fontSize} * 0.62)`,
            fontWeight: 300,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginTop: "0.12em",
            opacity: 0.92,
          }}
        >
          {second}
        </span>
      </span>
    );
  }

  return (
    <span className="relative inline-flex flex-col items-center">
      {brand.mark === "peacock" ? <PeacockFan /> : null}
      {brand.mark === "arc" ? <DisneyArc /> : null}
      <span className="inline-flex items-start">
        <span style={style} className="text-balance">
          {label}
        </span>
        {hasPlus ? (
          <span
            style={{
              ...style,
              fontFamily: "var(--font-display)",
              fontSize: `calc(${style.fontSize} * 0.56)`,
              fontWeight: 600,
              letterSpacing: "0",
              fontStyle: "normal",
              marginLeft: "0.08em",
              marginTop: "0.04em",
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
      className="mt-[0.18em] h-[0.42em] w-[86%] overflow-visible"
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
      className="mb-[-0.28em] h-[0.44em] w-[74%] overflow-visible"
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
    <svg viewBox="0 0 72 34" className="mb-1 h-6 w-16" fill="none" aria-hidden>
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
