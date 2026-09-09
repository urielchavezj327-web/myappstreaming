import { memo } from "react";

import { MARKS, TRACED, type TracedLogo } from "./generated";

/**
 * Logotipos de marca.
 *
 * El cambio de raíz respecto a las rondas anteriores: el nombre de la marca
 * dejó de ser **texto con una fuente parecida** y pasó a ser **contorno**. Las
 * tipografías de Netflix, Disney, Peacock, Crunchyroll o Paramount+ son
 * lettering propio, no existen como fuente, y por eso nunca quedaban.
 *
 * Hay dos niveles, y la diferencia es honesta y visible:
 *
 *  · `full` — el logotipo completo (símbolo + nombre) vectorizado de la imagen
 *    de referencia. Es idéntico al real. No lleva rótulo: el logotipo ya dice
 *    de quién es.
 *  · `mark` — solo el símbolo oficial de la marca, que es exactamente lo que
 *    usa cada una como icono de aplicación. Debajo va el nombre del servicio
 *    en la tipografía **de esta app**, sin fingir que es el wordmark de la
 *    marca. Preferimos un rótulo propio y sincero a una imitación mala.
 */

/** Una pieza del logotipo: o un trazado de la imagen, o un símbolo oficial. */
export type Piece =
  { traced: string } | { mark: string; ink?: string } | { text: string; ink?: string };

export type LogoSpec =
  /** Logotipo completo, ya con símbolo y nombre en el mismo trazado. */
  | { kind: "full"; key: string; grad?: Gradient; recolor?: Record<string, string> }
  /** Solo el símbolo oficial de simple-icons, que ya trae el nombre dentro. */
  | { kind: "solo"; key: string; ink?: string }
  /**
   * Dos piezas compuestas. `col` pone el símbolo encima del nombre; `row` los
   * deja en el mismo renglón, que es como van HBO Max y Fox One.
   */
  | {
      kind: "compose";
      dir: "col" | "row";
      a: Piece;
      b: Piece;
      /** Alto de cada pieza en `cqw`. */
      sizes: [number, number];
      grad?: Gradient;
      recolor?: Record<string, string>;
    };

/** Degradado que se aplica a las capas marcadas `#COPILOT` en el trazado. */
type Gradient = { id: string; stops: Array<[string, string]>; angle?: number };

const GEMINI: Gradient = {
  id: "gemini",
  // La estrella de Gemini recorre los cuatro colores de Google.
  stops: [
    ["0%", "#34A853"],
    ["34%", "#4285F4"],
    ["68%", "#9B72CB"],
    ["100%", "#D96570"],
  ],
  angle: 45,
};

const COPILOT: Gradient = {
  id: "copilot",
  // El listón de Microsoft 365 Copilot recorre azul, verde, amarillo,
  // naranja, rosa y morado; muestreado de la imagen de referencia.
  stops: [
    ["0%", "#0A91E1"],
    ["22%", "#28B24B"],
    ["45%", "#F2C230"],
    ["66%", "#F07C2B"],
    ["84%", "#E0518C"],
    ["100%", "#9A3BD4"],
  ],
  angle: 135,
};

/**
 * Registro de logotipos.
 *
 * Las claves son las mismas que usa `brands.ts` en su campo `logo`.
 */
export const LOGOS = {
  // ── Logotipo completo en un solo trazado ────────────────────────────────
  netflix: { kind: "full", key: "netflixword" },
  primevideo: { kind: "full", key: "primevideo" },
  vix: { kind: "full", key: "vix" },
  disneyplus: { kind: "full", key: "disneyplus" },
  paramountplus: { kind: "full", key: "paramountplus" },
  peacock: { kind: "full", key: "peacock" },
  crunchyroll: { kind: "full", key: "crunchyroll" },
  clarovideo: { kind: "full", key: "clarovideo" },
  f1tv: { kind: "full", key: "f1tv" },
  hidive: { kind: "full", key: "hidive" },
  iptv: { kind: "full", key: "iptv" },
  kocowa: { kind: "full", key: "kocowa" },
  mlbtv: { kind: "full", key: "mlbtv" },
  universalplus: { kind: "full", key: "universalplus" },
  viki: { kind: "full", key: "viki" },
  iqiyi: { kind: "full", key: "iqiyi" },
  mubi: { kind: "full", key: "mubi" },
  tidal: { kind: "full", key: "tidal" },
  youtube: { kind: "full", key: "youtube" },
  applemusic: { kind: "full", key: "applemusic" },
  amazonmusic: { kind: "full", key: "amazonmusic" },
  deezer: { kind: "full", key: "deezer" },
  qobuz: { kind: "full", key: "qobuz" },
  gemini: { kind: "full", key: "geminiword", grad: GEMINI },
  scribd: { kind: "full", key: "scribd" },
  photoshop: { kind: "full", key: "photoshop" },
  // El magenta original se pierde contra el degradado morado de la ficha, así
  // que sube de luminosidad lo justo para leerse encima.
  picsart: { kind: "full", key: "picsart", recolor: { "#BE07BD": "#FF63F0" } },
  // El logotipo viene negro sobre blanco; la ficha es negra.
  capcut: { kind: "full", key: "capcut", recolor: { "#000000": "#FFFFFF" } },
  googleone: { kind: "full", key: "googleone" },
  onedrive: { kind: "full", key: "onedrive" },
  smartfit: { kind: "full", key: "smartfit" },
  roblox: { kind: "full", key: "roblox" },

  // ── Símbolo de simple-icons que ya incluye el nombre ────────────────────
  appletv: { kind: "solo", key: "appletv", ink: "#FFFFFF" },
  plex: { kind: "solo", key: "plex", ink: "#E5A00D" },

  // ── Compuestos ─────────────────────────────────────────────────────────
  spotify: {
    kind: "compose",
    dir: "col",
    a: { traced: "spotifymark" },
    b: { traced: "spotifyword" },
    sizes: [30, 15],
  },
  // El logotipo de 2025 es horizontal: «HBO» y «Max» en el mismo renglón.
  // «HBO» viene de simple-icons; «Max» está trazado de tu imagen.
  hbomax: {
    kind: "compose",
    dir: "row",
    a: { mark: "hbo", ink: "#FFFFFF" },
    b: { traced: "hbomaxword" },
    // El símbolo «HBO» de simple-icons viene en un lienzo cuadrado y su tinta
    // ocupa solo una banda horizontal, así que necesita más caja para pesar lo
    // mismo que «max», que sí viene recortado a su tinta.
    sizes: [44, 16],
  },
  foxone: { kind: "full", key: "foxone" },
  duolingo: {
    kind: "compose",
    dir: "col",
    a: { mark: "duolingo", ink: "#FFFFFF" },
    b: { traced: "duolingoword" },
    sizes: [30, 13],
  },
  discord: {
    kind: "compose",
    dir: "col",
    a: { mark: "discord", ink: "#FFFFFF" },
    b: { text: "Nitro" },
    sizes: [26, 12],
  },
  microsoft365: {
    kind: "compose",
    dir: "col",
    a: { traced: "microsoft365" },
    b: { traced: "microsoft365word" },
    sizes: [28, 12],
    grad: COPILOT,
    recolor: { "#8A8A8E": "#E6E6EC" },
  },
} as const satisfies Record<string, LogoSpec>;

export type LogoId = keyof typeof LOGOS;

export function hasLogo(id: string): id is LogoId {
  return id in LOGOS;
}

function Defs({ grad }: { grad: Gradient }) {
  const a = ((grad.angle ?? 135) * Math.PI) / 180;
  return (
    <defs>
      <linearGradient
        id={grad.id}
        x1={`${50 - Math.cos(a) * 50}%`}
        y1={`${50 - Math.sin(a) * 50}%`}
        x2={`${50 + Math.cos(a) * 50}%`}
        y2={`${50 + Math.sin(a) * 50}%`}
      >
        {grad.stops.map(([offset, color]) => (
          <stop key={offset} offset={offset} stopColor={color} />
        ))}
      </linearGradient>
    </defs>
  );
}

/**
 * `recolor` reemplaza el color con que se trazó una capa. Hace falta cuando
 * el logotipo original es oscuro y la ficha también: CapCut viene negro sobre
 * blanco y aquí va en blanco sobre negro.
 */
function Layers({
  logo,
  grad,
  recolor,
}: {
  logo: TracedLogo;
  grad?: Gradient;
  recolor?: Record<string, string>;
}) {
  return (
    <>
      {logo.layers.map((l, i) => (
        <path
          key={i}
          d={l.d}
          fill={
            !/^#[0-9A-Fa-f]{6}$/.test(l.fill) && grad
              ? `url(#${grad.id})`
              : (recolor?.[l.fill] ?? l.fill)
          }
        />
      ))}
    </>
  );
}

/**
 * Una pieza del logotipo, dibujada con un alto fijo.
 *
 * El alto —y no el ancho— es lo que fija la escala: así un logotipo ancho y
 * bajo (FOX) y uno cuadrado (Scribd) pesan lo mismo ópticamente en la
 * cuadrícula, que es justo lo que impide notar cuál viene de archivo y cuál
 * de simple-icons.
 */
function PieceView({
  piece,
  height,
  label,
  grad,
  recolor,
}: {
  piece: Piece;
  height: number;
  label?: string;
  grad?: Gradient;
  recolor?: Record<string, string>;
}) {
  const common = {
    preserveAspectRatio: "xMidYMid meet" as const,
    style: { display: "block", width: "100%", height: `${height}cqw` },
  };

  if ("text" in piece) {
    return (
      <span
        className="text-center font-display font-semibold tracking-[-0.01em]"
        style={{
          fontSize: `${height * 0.82}cqw`,
          color: piece.ink ?? "currentColor",
          lineHeight: 1,
        }}
      >
        {piece.text}
      </span>
    );
  }

  if ("mark" in piece) {
    const mark = MARKS[piece.mark];
    if (!mark) return null;
    return (
      <svg
        viewBox="0 0 24 24"
        {...common}
        {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      >
        {label ? <title>{label}</title> : null}
        <path d={mark.d} fill={piece.ink ?? "currentColor"} />
      </svg>
    );
  }

  const logo = TRACED[piece.traced];
  if (!logo) return null;
  return (
    <svg
      viewBox={logo.viewBox}
      {...common}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {label ? <title>{label}</title> : null}
      {grad ? <Defs grad={grad} /> : null}
      <Layers logo={logo} {...(grad ? { grad } : {})} {...(recolor ? { recolor } : {})} />
    </svg>
  );
}

/**
 * Dibuja el logotipo de una marca dentro de la caja que le da el padre.
 *
 * Todo se mide en `cqw` contra esa caja, así que la misma pieza sirve para la
 * tarjeta del catálogo y para el encabezado de la ficha sin recomponerse: solo
 * cambia el ancho del contenedor.
 */
export const BrandLogo = memo(function BrandLogo({ id, name }: { id: LogoId; name: string }) {
  const spec = LOGOS[id] as LogoSpec;

  if (spec.kind === "full") {
    return (
      <PieceView
        piece={{ traced: spec.key }}
        height={54}
        label={name}
        {...(spec.grad ? { grad: spec.grad } : {})}
        {...(spec.recolor ? { recolor: spec.recolor } : {})}
      />
    );
  }

  if (spec.kind === "solo") {
    return (
      <PieceView
        piece={{ mark: spec.key, ...(spec.ink ? { ink: spec.ink } : {}) }}
        height={40}
        label={name}
      />
    );
  }

  const [ha, hb] = spec.sizes;
  return (
    <span
      className={
        spec.dir === "col"
          ? "flex w-full flex-col items-center gap-[6cqw]"
          : "flex w-full items-center justify-center gap-[5cqw]"
      }
    >
      <span
        className={spec.dir === "row" ? "shrink-0" : "w-full"}
        style={spec.dir === "row" ? { width: "38%" } : undefined}
      >
        <PieceView
          piece={spec.a}
          height={ha}
          label={name}
          {...(spec.grad ? { grad: spec.grad } : {})}
          {...(spec.recolor ? { recolor: spec.recolor } : {})}
        />
      </span>
      <span
        className={spec.dir === "row" ? "shrink-0" : "w-full"}
        style={spec.dir === "row" ? { width: "50%" } : undefined}
      >
        <PieceView
          piece={spec.b}
          height={hb}
          {...(spec.grad ? { grad: spec.grad } : {})}
          {...(spec.recolor ? { recolor: spec.recolor } : {})}
        />
      </span>
    </span>
  );
});
