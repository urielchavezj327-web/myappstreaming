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
  | {
      kind: "full";
      key: string;
      grad?: Gradient;
      recolor?: Record<string, string>;
      /**
       * Recoloreado solo para la ficha. Hace falta cuando la tarjeta y la
       * ficha tienen fondos opuestos: el «TV» de F1 es negro y se lee sobre su
       * tarjeta blanca, pero desaparece sobre su ficha en rojo y negro.
       */
      recolorHero?: Record<string, string>;
      /** Ajuste fino sobre el tamaño que da la tinta. 1 = sin ajuste. */
      scale?: number;
      /**
       * El trazado ES el icono de la aplicación, fondo incluido. En la tarjeta
       * se sirve a sangre —de borde a borde— porque su fondo y el de la tarjeta
       * son el mismo color y así no se ve ni un canto; recortarlo a un cuadro
       * más chico es lo que lo hacía parecer un PNG pegado encima.
       */
      tile?: boolean;
    }
  /** Solo el símbolo oficial de simple-icons, que ya trae el nombre dentro. */
  | { kind: "solo"; key: string; ink?: string; scale?: number }
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
  // Las paradas son la media del archivo por franjas a lo ancho: el degradado
  // recorre la palabra entera, del azul de la «G» al rosa de la última «i».
  stops: [
    ["0%", "#4895E4"],
    ["32%", "#4D8BEA"],
    ["56%", "#6482E1"],
    ["76%", "#8C79CA"],
    ["100%", "#C4667F"],
  ],
  angle: 0,
};

const HBOMAX: Gradient = {
  id: "hbomax",
  // Las letras de HBO Max no son blancas: son metal. Van de un blanco cálido
  // rosado a la izquierda a un gris azulado frío a la derecha, con un repunte
  // de luz en la «x». Las cinco paradas están promediadas por tramos sobre la
  // tinta de la imagen de referencia, no elegidas a ojo.
  stops: [
    ["0%", "#F8F2F5"],
    ["30%", "#EDE7ED"],
    ["58%", "#DCDCE6"],
    ["82%", "#C6D1DC"],
    ["100%", "#D9E0E9"],
  ],
  angle: 8,
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
  // Apilado —«HBO» sobre «max»—, de una sola pieza, con el metal de la marca.
  // apilado y macizo: con el reparto por tinta salía a media tarjeta
  hbomax: { kind: "full", key: "hbomax", grad: HBOMAX, scale: 1.5 },
  // apilado en dos líneas más la sonrisa
  primevideo: { kind: "full", key: "primevideo", scale: 1.1 },
  vix: { kind: "full", key: "vix" },
  disneyplus: { kind: "full", key: "disneyplus" },
  // la montaña deja mucho aire alrededor de la estrella
  paramountplus: { kind: "full", key: "paramountplus", scale: 1.2 },
  peacock: { kind: "full", key: "peacock" },
  crunchyroll: { kind: "full", key: "crunchyroll" },
  clarovideo: { kind: "full", key: "clarovideo" },
  f1tv: { kind: "full", key: "f1tv", scale: 1.6 },
  hidive: { kind: "full", key: "hidive", scale: 2.4 },
  iptv: { kind: "full", key: "iptv", scale: 1.55 },
  kocowa: { kind: "full", key: "kocowa" },
  // el emblema y «MLB.tv» dejan mucho aire entre sí
  mlbtv: { kind: "full", key: "mlbtv", scale: 1.9 },
  universalplus: { kind: "full", key: "universalplus" },
  viki: { kind: "full", key: "viki", scale: 1.28 },
  iqiyi: { kind: "full", key: "iqiyi" },
  mubi: { kind: "full", key: "mubi" },
  tidal: { kind: "full", key: "tidal" },
  youtube: { kind: "full", key: "youtube" },
  applemusic: { kind: "full", key: "applemusic" },
  amazonmusic: { kind: "full", key: "amazonmusic" },

  // símbolo arriba y nombre abajo, muy separados
  qobuz: { kind: "full", key: "qobuz", scale: 1.2 },
  gemini: { kind: "full", key: "geminiword", grad: GEMINI },
  // solo el símbolo entre corchetes
  scribd: { kind: "full", key: "scribd", scale: 1.15 },
  // icono cuadrado sin nombre al lado
  photoshop: { kind: "full", key: "photoshop", scale: 1.2 },
  // El icono de la aplicación, tal cual: solo la «p» blanca. El degradado va
  // de fondo de tarjeta porque un degradado continuo no se puede trazar.
  picsart: { kind: "full", key: "picsart" },
  // El logotipo viene negro sobre blanco; la ficha es negra.
  capcut: { kind: "full", key: "capcut", recolor: { "#000000": "#FFFFFF" } },
  // vertical y estrecho
  // Sin recolorear: la tarjeta es blanca como el archivo, así los cuatro
  // colores de Google y el gris 700 de «One» salen exactos.
  googleone: { kind: "full", key: "googleone", scale: 0.85 },
  // Sin recolorear: la tarjeta es blanca como el archivo.
  onedrive: { kind: "full", key: "onedrive", scale: 1.15 },
  // «ple» en blanco y la «x» partida: chevrón dorado y chevrón blanco.
  plex: { kind: "full", key: "plex" },
  smartfit: { kind: "full", key: "smartfit" },
  // El icono de la aplicación completo —fondo, cabeza, ojos y pico—, porque la
  // cabeza del búho se sale por los lados y sin su cuadro quedaría cortada.
  // Su cobertura es del 100 % (el cuadro entero es tinta), así que el reparto
  // por tinta lo encogía: va al tope de altura de la tarjeta.
  // Sigue a sangre aunque su trazo ya no traiga el campo: `tile` es lo que le da
  // su tamaño y su encuadre, y quitarlo lo encogería y metería la cabeza dentro
  // de la pantalla. Lo que desaparece al borrar la capa del recuadro es el
  // canto verde, porque debajo queda el #77C801 del fondo de la ficha.
  duolingo: { kind: "full", key: "duolingo", tile: true },
  // De una pieza: la cinta de Copilot y «Microsoft 365» en la proporción del
  // archivo. Antes iban por separado y la «M» se salía de la tarjeta.
  microsoft365: {
    kind: "full",
    key: "microsoft365",
    grad: COPILOT,
    recolor: { "#737373": "#E6E6EC" },
  },
  roblox: { kind: "full", key: "roblox" },

  // ── Símbolo de simple-icons que ya incluye el nombre ────────────────────
  // solo la manzana y «tv»: con el tamaño común se pierde
  appletv: { kind: "solo", key: "appletv", ink: "#FFFFFF", scale: 1.55 },

  // ── Compuestos ─────────────────────────────────────────────────────────
  spotify: {
    kind: "compose",
    dir: "col",
    a: { traced: "spotifymark" },
    b: { traced: "spotifyword" },
    sizes: [44, 20],
  },
  deezer: {
    kind: "compose",
    dir: "col",
    a: { traced: "deezerheart" },
    b: { traced: "deezerword" },
    sizes: [46, 15],
  },
  foxone: { kind: "full", key: "foxone" },
  // El nudo de OpenAI trazado de tu imagen, encima del nombre. El nombre va en
  // la tipografía de esta app, no en una imitación de la suya.
  chatgpt: {
    kind: "compose",
    dir: "col",
    a: { traced: "chatgptmark" },
    b: { text: "ChatGPT" },
    // El símbolo pesa más que el nombre porque es lo que se reconoce. El nudo
    // es de trazo fino y en la cuadrícula pesaba menos que cualquier otro.
    sizes: [54, 19],
    recolor: { "#000000": "#FFFFFF" },
  },
  discord: {
    kind: "compose",
    dir: "col",
    /*
      La cara de Clyde trazada del archivo, SIN el disco morado. El disco es el
      campo, igual que el rectángulo verde de Duolingo: trazarlo le dejaría un
      canto visible sobre el fondo de la ficha. Los ojos son huecos de verdad
      —subtrazos en sentido contrario al contorno— así que por ellos se ve el
      fondo, no un morado pintado.
    */
    a: { traced: "discord" },
    b: { text: "Nitro" },
    sizes: [26, 12],
  },
} as const satisfies Record<string, LogoSpec>;

export type LogoId = keyof typeof LOGOS;

export function hasLogo(id: string): id is LogoId {
  return id in LOGOS;
}

/** ¿Este logotipo es el icono completo de la aplicación? Ver `tile`. */
export function isTileLogo(id: LogoId): boolean {
  const spec = LOGOS[id] as LogoSpec;
  return spec.kind === "full" && spec.tile === true;
}

/**
 * Tamaño de un logotipo, igualado por **cantidad de trazo**.
 *
 * Dos intentos anteriores fallaron por medir lo que no era. Con altura fija,
 * ViX (proporción 2.7) salía al 147 % del ancho y Prime Video (1.0) al 54 %.
 * Igualando el área del rectángulo tampoco: dos logotipos del mismo tamaño
 * pueden tener muy distinta densidad —ViX cubre el 61 % de su encuadre con
 * trazo y Disney+ solo el 16.6 %—, así que el macizo seguía viéndose enorme y
 * el aireado diminuto.
 *
 * Lo que sí iguala el peso visual es la superficie de TINTA: se despeja el
 * alto de `ancho · alto · cobertura = constante` y solo después se recorta
 * contra los topes de la tarjeta, conservando la proporción.
 */
const INK_AREA = 1420; // cqw² de trazo; el resto lo decide la proporción
// El ancho lo acaba fijando la caja del logotipo dentro de la tarjeta; el
// alto, lo que sobra bajo el contador de ofertas.
const MAX_W = 104;
const MAX_H = 62;

function fitBox(
  logo: { viewBox: string; coverage: number },
  scale = 1,
): { width: string; height: string } {
  const [, , vw, vh] = logo.viewBox.split(" ").map(Number);
  const ratio = (vw ?? 1) / (vh ?? 1);
  // Cobertura mínima para que un logotipo muy vacío no crezca sin freno.
  const ink = Math.max(logo.coverage || 0.3, 0.12);
  let h = Math.sqrt((INK_AREA * scale) / (ratio * ink));
  let w = h * ratio;
  if (w > MAX_W) {
    w = MAX_W;
    h = w / ratio;
  }
  if (h > MAX_H) {
    h = MAX_H;
    w = h * ratio;
  }
  return { width: `${w.toFixed(1)}cqw`, height: `${h.toFixed(1)}cqw` };
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
  scale,
  tile,
  full,
  label,
  grad,
  recolor,
}: {
  piece: Piece;
  height: number;
  scale?: number;
  tile?: boolean;
  /** Ancho completo de la caja, sin recorte y sin normalizar por tinta. */
  full?: boolean;
  label?: string;
  grad?: Gradient;
  recolor?: Record<string, string>;
}) {
  // `height` sigue mandando en las piezas compuestas, donde la proporción
  // entre símbolo y nombre la fija la marca; las piezas sueltas se normalizan
  // por área.
  /*
   * Dos maneras de servir el icono de aplicación, las dos a sangre:
   *
   *  · `full` — todo el ancho de la caja y el alto que le toque. Es la ficha:
   *    la caja es el ancho de la pantalla, así que los cantos rectos del
   *    cuadro caen fuera y solo se ve el dibujo.
   *  · `tile` — cubre la caja entera aunque tenga que recortarse por los
   *    lados. Es la tarjeta, que tiene proporción fija.
   */
  const box = full
    ? { width: "100%", height: "auto" }
    : tile
      ? { width: "100%", height: "100%" }
      : height > 0
        ? { width: "100%", height: `${height}cqw` }
        : fitBox(
            ("traced" in piece ? TRACED[piece.traced] : undefined) ?? {
              viewBox: "0 0 1 1",
              coverage: 0.3,
            },
            scale,
          );
  const common = {
    preserveAspectRatio: (tile ? "xMidYMid slice" : "xMidYMid meet") as
      "xMidYMid slice" | "xMidYMid meet",
    style: {
      display: "block",
      margin: "0 auto",
      ...box,
    },
  };

  if ("text" in piece) {
    return (
      // `block` a propósito: un `span` en línea ignora `text-center` y el
      // nombre se quedaba pegado a la izquierda debajo del símbolo.
      <span
        className="block w-full text-center font-display font-semibold tracking-[-0.01em]"
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
export const BrandLogo = memo(function BrandLogo({
  id,
  name,
  contain = false,
  hero = false,
}: {
  id: LogoId;
  name: string;
  /** Contener el icono en vez de servirlo a sangre. Solo afecta a los `tile`. */
  contain?: boolean;
  /** Se está pintando dentro de la ficha, no en la tarjeta. */
  hero?: boolean;
}) {
  const spec = LOGOS[id] as LogoSpec;

  if (spec.kind === "full") {
    const recolor = (hero && spec.recolorHero) || spec.recolor;
    return (
      <PieceView
        piece={{ traced: spec.key }}
        height={0}
        {...(spec.scale ? { scale: spec.scale } : {})}
        {...(spec.tile && !contain ? { tile: true } : {})}
        {...(spec.tile && contain ? { full: true } : {})}
        label={name}
        {...(spec.grad ? { grad: spec.grad } : {})}
        {...(recolor ? { recolor } : {})}
      />
    );
  }

  if (spec.kind === "solo") {
    return (
      <PieceView
        piece={{ mark: spec.key, ...(spec.ink ? { ink: spec.ink } : {}) }}
        height={44 * (spec.scale ?? 1)}
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
