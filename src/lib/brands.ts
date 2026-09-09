import type { SymbolId } from "@/components/brand-symbols";
import type { LogoId } from "@/components/logos";

/**
 * Identidad visual de cada servicio.
 *
 * **Criterio**: se reproduce el logotipo real, no una interpretación. Cada
 * marca aporta tres datos tomados de su logotipo tal como existe hoy:
 *
 *  - `bg`   — el color de fondo del logotipo. Si Tidal es negro, la ficha es
 *             negra; no se inventa un degradado «con todos los colores».
 *  - `ink`  — el color exacto de las letras. No todo va en blanco: la N de
 *             Netflix es roja, el nombre de Peacock es negro, el de Spotify
 *             verde.
 *  - `wash` — cuánto respira el color de acento sobre ese fondo. Existe porque
 *             muchas marcas premium *sí* son negras (HBO Max, Tidal, Apple TV+,
 *             MUBI) y una rejilla de negros idénticos no se lee; el acento sale
 *             del propio logotipo, así que el fondo sigue siendo el suyo.
 *
 * Cuando el logotipo real lleva degradado en las letras (ViX, Gemini) se
 * replica ese degradado en `inkGrad`, no uno distinto.
 *
 * Vive en código y no en `services.color` porque varios colores de la base
 * venían mal de la carga inicial, y porque así un servicio nuevo creado desde
 * /agregar toma su identidad al instante.
 */

export type BrandFont = "display" | "grotesk" | "geometric" | "condensed" | "script" | "serif";

export type Brand = {
  /**
   * Logotipo vectorial de la marca (ver `components/logos`). Cuando existe,
   * manda sobre todos los campos tipográficos de abajo: el nombre se dibuja
   * como contorno, no como texto con una fuente parecida.
   */
  logo?: LogoId;
  /** Fondo exacto del logotipo. Color sólido o degradado CSS completo. */
  bg: string;
  /** Color exacto de las letras. */
  ink: string;
  /** Degradado de las letras cuando el logotipo real lo lleva. */
  inkGrad?: string;
  /** Color del logotipo con el que respira el fondo y se dibujan los filos. */
  accent: string;
  /** Presencia del acento sobre el fondo, de 0 a 1. */
  wash: number;
  /**
   * Colores secundarios del logotipo (los cinco puntos de Peacock). En la
   * ficha entran como acentos discretos, nunca como protagonistas.
   */
  secondary?: string[];
  /**
   * Color del extremo profundo de la ficha. Por omisión es el propio acento
   * oscurecido; se fija a mano cuando el logotipo tiene un fondo con
   * identidad propia (el negro de Netflix, de Peacock o de Tidal).
   */
  deepEnd?: string;
  font: BrandFont;
  weight: number;
  tracking: string;
  upper: boolean;
  italic: boolean;
  /** Símbolo de la marca, encima del nombre. */
  symbol?: SymbolId;
  /** Color del hueco en los símbolos sólidos (el disco de Spotify). */
  symbolHole?: string;
  /** Tinta del símbolo cuando difiere de la del nombre (la A roja de Adobe). */
  symbolInk?: string;
  /** Peso del símbolo respecto al nombre. 1 = equilibrado. */
  symbolScale?: number;
  /** Tope de líneas del nombre, cuando el logotipo real tiene una forma fija. */
  maxLines?: number;
  /** Texto del logotipo cuando difiere del nombre del servicio. */
  label?: string;
  /** Segunda palabra con tratamiento propio: «Premium», «hub», «+». */
  suffix?: string;
  /** Fondo del sufijo (el bloque naranja de Pornhub). */
  suffixBg?: string;
  /** Tinta del sufijo si difiere. */
  suffixInk?: string;
  /** Logotipo de dos líneas. */
  lines?: [string, string];
  /** Fondo claro: el resto de la interfaz de la tarjeta se oscurece. */
  light: boolean;
  /**
   * Cuánto pesa el acento en el difuminado de la ficha, de 0 a 1. Por omisión
   * 1. Se baja cuando el color principal es casi blanco —el metal de HBO Max—
   * porque a plena intensidad no se lee como plata sino como una página gris.
   */
  fade?: number;
  /**
   * Textura de papel apenas perceptible. Va en Trámites y en los servicios
   * temáticos de «Otros»: son los que no representan a ninguna marca, y la
   * fibra les da el aire de archivo que los distingue del catálogo comercial.
   */
  paper?: boolean;
};

type Spec = Partial<Brand> & { bg: string; ink: string };

const W = "#FFFFFF";

function spec(s: Spec): Brand {
  return {
    ...(s.logo ? { logo: s.logo } : {}),
    ...(s.secondary ? { secondary: s.secondary } : {}),
    ...(s.deepEnd ? { deepEnd: s.deepEnd } : {}),
    ...(s.fade === undefined ? {} : { fade: s.fade }),
    ...(s.paper ? { paper: true } : {}),
    bg: s.bg,
    ink: s.ink,
    ...(s.inkGrad ? { inkGrad: s.inkGrad } : {}),
    accent: s.accent ?? s.ink,
    wash: s.wash ?? 0.22,
    font: s.font ?? "grotesk",
    weight: s.weight ?? 700,
    tracking: s.tracking ?? "-0.03em",
    upper: s.upper ?? false,
    italic: s.italic ?? false,
    ...(s.symbol ? { symbol: s.symbol } : {}),
    ...(s.symbolHole ? { symbolHole: s.symbolHole } : {}),
    ...(s.symbolInk ? { symbolInk: s.symbolInk } : {}),
    ...(s.symbolScale ? { symbolScale: s.symbolScale } : {}),
    ...(s.maxLines ? { maxLines: s.maxLines } : {}),
    ...(s.label ? { label: s.label } : {}),
    ...(s.suffix ? { suffix: s.suffix } : {}),
    ...(s.suffixBg ? { suffixBg: s.suffixBg } : {}),
    ...(s.suffixInk ? { suffixInk: s.suffixInk } : {}),
    ...(s.lines ? { lines: s.lines } : {}),
    light: s.light ?? false,
  };
}

/** Normaliza el nombre para buscar la marca: sin acentos, minúsculas. */
function key(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tabla de marcas. Gana la primera que coincide, así que lo específico
 * («canva edu») va antes que lo general («canva»).
 */ const BRANDS: Array<[RegExp, Brand]> = [
  // ── Streaming ──────────────────────────────────────────────────────────
  [
    /^netflix/,
    spec({
      // Muestreado de tu imagen: el fondo del logotipo es #101010, plano.
      bg: "#101010",
      ink: "#E50914",
      accent: "#E50914",
      deepEnd: "#101010",
      wash: 0.58,
      logo: "netflix",
    }),
  ],
  [
    // Rebranding «Aurora» de marzo de 2024: el azul marino de 2019 quedó atrás
    // y el arco sobre «Disney» pasó a ser blanco sólido. Paradas muestreadas
    // de la imagen de referencia.
    /^disney/,
    spec({
      bg: "linear-gradient(165deg,#073545,#0A5864 46%,#04BCBA 78%,#5AF3F1)",
      ink: "#FFFFFF",
      accent: "#04BCBA",
      wash: 0.3,
      logo: "disneyplus",
    }),
  ],
  [
    // El logotipo apilado que mandaste: las letras son metal —de blanco cálido
    // a gris azulado— y el fondo NO es negro, es un azul de tinta con viñeta.
    // Los dos colores salen muestreados de esa imagen, así que el difuminado
    // de la ficha se arma solo con ellos: nada de negro añadido por nosotros.
    /^hbo|^max\b/,
    spec({
      bg: "radial-gradient(128% 128% at 50% 50%,#0D0F1B,#00030C)",
      ink: "#E7E7EF",
      accent: "#DCDCE6",
      deepEnd: "#0D0F1B",
      // El metal es casi blanco: a plena intensidad la ficha sale gris en vez
      // de azul de tinta con luz de plata encima.
      fade: 0.3,
      wash: 0.34,
      logo: "hbomax",
    }),
  ],
  [
    /^prime video|^amazon prime/,
    spec({
      bg: "#0779FF",
      ink: "#FFFFFF",
      accent: "#9FCCFF",
      wash: 0.3,
      logo: "primevideo",
    }),
  ],
  [
    /^paramount/,
    spec({
      bg: "#006FFD",
      ink: "#FFFFFF",
      accent: "#8FC3FF",
      wash: 0.24,
      logo: "paramountplus",
    }),
  ],
  [
    /^peacock/,
    spec({
      bg: "#0D0D0D",
      ink: "#FFFFFF",
      accent: "#FFFFFF",
      deepEnd: "#0D0D0D",
      fade: 0.5,
      secondary: ["#F8B410", "#E82828", "#A42CDC", "#1898E8", "#00B060"],
      wash: 0.3,
      logo: "peacock",
    }),
  ],
  [
    /^apple tv/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#C3C3CC",
      deepEnd: "#000000",
      wash: 0.26,
      logo: "appletv",
    }),
  ],
  [
    // Naranja muestreado de la imagen: #FF5E00, no el #F47521 que citan las
    // fuentes secundarias.
    /^crunchyroll/,
    spec({
      bg: "#FF5E00",
      ink: "#FFFFFF",
      accent: "#FFB784",
      wash: 0.2,
      logo: "crunchyroll",
    }),
  ],
  [
    // Sin imagen de referencia: el degradado naranja del brand guide con las
    // letras en blanco. Dibujado por mí, pendiente de tu visto bueno.
    /^vix/,
    spec({
      // Las nueve paradas son la media de la imagen por franjas a 135°, no una
      // interpolación nuestra: el rosa vive solo en el primer octavo y el
      // naranja se queda con el resto, que es justo lo que se ve en el archivo.
      bg: "linear-gradient(135deg,#FF587E,#FE5F6E 12%,#FE685D 25%,#FD6E4A 38%,#FD6E39 50%,#FD672A 62%,#FE591E 75%,#FF4A14 88%,#FF4712)",
      ink: "#FFFFFF",
      accent: "#FD6E39",
      deepEnd: "#FF4712",
      wash: 0.16,
      logo: "vix",
    }),
  ],
  [
    // Colores invertidos a propósito: el logotipo real es rojo y negro sobre
    // blanco, pero la app es oscura y así combina.
    /^claro/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#E1251B",
      deepEnd: "#000000",
      wash: 0.5,
      logo: "clarovideo",
    }),
  ],
  [
    /^formula 1|^f1\b/,
    spec({
      bg: "#FFFFFF",
      ink: "#15151E",
      accent: "#E10600",
      wash: 0.28,
      logo: "f1tv",
      light: true,
    }),
  ],
  [
    // Sin imagen: «FOX» viene de simple-icons y «One» va como rótulo propio.
    /^fox/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#9AA6B8",
      wash: 0.26,
      logo: "foxone",
    }),
  ],
  [
    /^hidive/,
    spec({
      bg: "linear-gradient(180deg,#72EFFF,#30BFF4 55%,#04AFEF)",
      ink: "#000000",
      accent: "#04AFEF",
      wash: 0.2,
      logo: "hidive",
      light: true,
    }),
  ],
  [
    // IPTV no es una marca: identidad propia, vectorizada de tu referencia.
    /^iptv/,
    spec({
      bg: "linear-gradient(140deg,#1AAEFF,#3060FF 55%,#4E0FFF)",
      ink: "#FFFFFF",
      accent: "#3B7BFF",
      wash: 0.22,
      logo: "iptv",
    }),
  ],
  [
    /^kocowa/,
    spec({
      bg: "linear-gradient(140deg,#572978,#311C40 52%,#121212)",
      ink: "#FFFFFF",
      accent: "#7B3BA8",
      deepEnd: "#121212",
      wash: 0.4,
      logo: "kocowa",
    }),
  ],
  [
    /^mlb/,
    spec({
      bg: "#FFFFFF",
      ink: "#001E3C",
      accent: "#BA001E",
      wash: 0.24,
      logo: "mlbtv",
      light: true,
    }),
  ],
  [
    /^mubi/,
    spec({
      bg: "#001DFF",
      ink: "#FFFFFF",
      accent: "#7F92FF",
      wash: 0.26,
      logo: "mubi",
    }),
  ],
  [
    // El fondo del logotipo es negro, no gris; el blanco de «ple» es el color
    // que manda y el dorado de la «x» entra de secundario. Los tres están
    // muestreados de tu imagen.
    /^plex/,
    spec({
      bg: "#070708",
      ink: "#FFFFFF",
      accent: "#FFFFFF",
      secondary: ["#EFAE02"],
      deepEnd: "#070708",
      wash: 0.4,
      logo: "plex",
    }),
  ],
  [
    /^universal/,
    spec({
      bg: "#FBCC11",
      ink: "#000000",
      accent: "#8A6E00",
      wash: 0.18,
      logo: "universalplus",
      light: true,
    }),
  ],
  [
    /^viki/,
    spec({
      bg: "#0C9BFF",
      ink: "#FFFFFF",
      accent: "#9AD4FF",
      wash: 0.2,
      logo: "viki",
    }),
  ],
  [
    /^iqiyi/,
    spec({
      bg: "linear-gradient(180deg,#00DC5B,#00C251 60%,#00B74C)",
      ink: "#FFFFFF",
      accent: "#7BF0AC",
      wash: 0.18,
      logo: "iqiyi",
    }),
  ],

  // ── Música ─────────────────────────────────────────────────────────────
  [
    /^spotify/,
    spec({
      bg: "#191414",
      ink: "#1DB954",
      accent: "#1DB954",
      deepEnd: "#191414",
      wash: 0.6,
      logo: "spotify",
    }),
  ],
  [
    // El icono real es un degradado rosa→rojo. Uri pidió expresamente el
    // degradado y no el rojo plano de la campaña que mandó de referencia.
    /^apple music/,
    spec({
      bg: "linear-gradient(160deg,#FB5C74,#FA2337 55%,#D50F2C)",
      ink: "#FFFFFF",
      accent: "#FFB3BE",
      wash: 0.18,
      logo: "applemusic",
    }),
  ],
  [
    /^youtube/,
    spec({
      bg: "#FFFFFF",
      ink: "#282828",
      accent: "#FF0000",
      wash: 0.3,
      logo: "youtube",
      light: true,
    }),
  ],
  [
    /^amazon music/,
    spec({
      bg: "#25D2D9",
      ink: "#000000",
      accent: "#0B6E73",
      wash: 0.18,
      logo: "amazonmusic",
      light: true,
    }),
  ],
  [
    /^deezer/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#A237FF",
      deepEnd: "#000000",
      wash: 0.55,
      logo: "deezer",
    }),
  ],
  [
    /^tidal/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#C9CFD6",
      deepEnd: "#000000",
      wash: 0.22,
      logo: "tidal",
    }),
  ],
  [
    /^qobuz/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#B9C2CC",
      deepEnd: "#000000",
      wash: 0.22,
      logo: "qobuz",
    }),
  ],

  // ── Diseño e IA ────────────────────────────────────────────────────────
  [
    /^photoshop/,
    spec({
      bg: "#001E36",
      ink: "#31A8FF",
      accent: "#31A8FF",
      wash: 0.45,
      logo: "photoshop",
    }),
  ],
  [
    // Sin imagen de referencia: dibujo mío, pendiente de tu visto bueno.
    /^adobe/,
    spec({
      bg: "linear-gradient(150deg,#FF3B30,#E3001B 55%,#8A0010)",
      ink: "#FFFFFF",
      accent: "#FF6A5E",
      wash: 0.24,
      font: "grotesk",
      weight: 700,
      tracking: "-0.05em",
      symbol: "adobeA",
      symbolInk: "#FFFFFF",
      symbolScale: 0.66,
    }),
  ],
  [
    // Sin imagen: el degradado y el rosa del wordmark salen del brand kit.
    /^canva edu/,
    spec({
      bg: "linear-gradient(148deg,#00C4CC,#4B6BE8 52%,#7D2AE7)",
      ink: "#FFFFFF",
      accent: "#00C4CC",
      wash: 0.2,
      font: "geometric",
      weight: 600,
      tracking: "-0.035em",
      symbol: "canvaC",
      symbolHole: "#5C46E0",
      symbolScale: 0.6,
      label: "Canva",
      suffix: "Edu",
    }),
  ],
  [
    /^canva/,
    spec({
      bg: "linear-gradient(148deg,#00C4CC,#5C46E0 55%,#7D2AE7)",
      ink: "#FFFFFF",
      accent: "#00C4CC",
      wash: 0.2,
      font: "geometric",
      weight: 600,
      tracking: "-0.035em",
      symbol: "canvaC",
      symbolHole: "#5C46E0",
      symbolScale: 0.6,
      label: "Canva",
      suffix: "Pro",
    }),
  ],
  [
    /^capcut/,
    spec({
      bg: "#0A0A0C",
      ink: "#FFFFFF",
      accent: "#FFFFFF",
      deepEnd: "#0A0A0C",
      wash: 0.16,
      logo: "capcut",
      suffix: "Pro",
    }),
  ],
  [
    // El nudo va trazado de tu imagen; el nombre, en la tipografía de la app.
    /^chatgpt|^openai/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#FFFFFF",
      deepEnd: "#000000",
      wash: 0.5,
      logo: "chatgpt",
    }),
  ],
  [
    /^claude|^anthropic/,
    spec({
      bg: "#191919",
      ink: "#FFFFFF",
      accent: "#D4A27F",
      wash: 0.45,
      font: "serif",
      weight: 500,
      tracking: "-0.02em",
      symbol: "geminiSpark",
      symbolInk: "#D4A27F",
      symbolScale: 0.6,
    }),
  ],
  [
    /^gemini/,
    spec({
      bg: "#0A0D17",
      ink: "#FFFFFF",
      accent: "#4285F4",
      deepEnd: "#0A0D17",
      wash: 0.45,
      logo: "gemini",
    }),
  ],
  [
    /^office|^microsoft 365|^m365/,
    spec({
      bg: "#141416",
      ink: "#FFFFFF",
      accent: "#E0518C",
      deepEnd: "#141416",
      wash: 0.42,
      logo: "microsoft365",
    }),
  ],
  [
    /onedrive/,
    spec({
      bg: "#0B3B78",
      ink: "#FFFFFF",
      accent: "#28A8EA",
      wash: 0.46,
      logo: "onedrive",
    }),
  ],
  [
    // Fondo blanco, como el archivo: es la única forma de que el gris 700 de
    // «One» y los cuatro colores de Google salgan exactos y se lean.
    /almacenamiento google|google drive|google one/,
    spec({
      bg: "#FFFFFF",
      ink: "#5F6368",
      accent: "#4285F4",
      secondary: ["#EA4335", "#FBBC04", "#34A853"],
      deepEnd: "#E8EAED",
      wash: 0.4,
      logo: "googleone",
      light: true,
    }),
  ],
  [
    // Los dos verdes son los del icono: el del cuadro y el de la cabeza. El
    // amarillo del pico entra de secundario en el difuminado de la ficha.
    /^duolingo/,
    spec({
      bg: "#77C801",
      ink: "#FFFFFF",
      accent: "#8FDF02",
      secondary: ["#FEC200"],
      deepEnd: "#77C801",
      wash: 0.18,
      logo: "duolingo",
    }),
  ],
  [
    // Las siete paradas son la media del icono por franjas sobre su propio eje
    // de 45°: magenta abajo a la izquierda, cian arriba a la derecha, y el
    // morado que sale de mezclarlos en medio.
    /^picsart/,
    spec({
      bg: "linear-gradient(45deg,#D302BF,#B11EC6 25%,#9039CC 38%,#6B60D3 50%,#36ABE0 62%,#0DEBEB 75%,#01FDEE)",
      ink: "#FFFFFF",
      accent: "#B11EC6",
      secondary: ["#01FDEE"],
      deepEnd: "#7949D0",
      wash: 0.22,
      logo: "picsart",
    }),
  ],
  [
    /^scribd/,
    spec({
      bg: "#0A8648",
      ink: "#FFFFFF",
      accent: "#5FD79B",
      wash: 0.2,
      logo: "scribd",
    }),
  ],

  // ── Otros con marca ────────────────────────────────────────────────────
  [
    /^discord/,
    spec({
      bg: "#5865F2",
      ink: "#FFFFFF",
      accent: "#C3C8FF",
      wash: 0.18,
      logo: "discord",
    }),
  ],
  [
    /^free fire/,
    spec({
      bg: "#12141A",
      ink: "#FFFFFF",
      accent: "#FF7A00",
      deepEnd: "#12141A",
      wash: 0.34,
      font: "condensed",
      weight: 700,
      upper: true,
      italic: true,
      tracking: "0.02em",
      symbol: "flame",
      symbolInk: "#FF7A00",
      symbolHole: "#12141A",
      symbolScale: 0.6,
      label: "Free Fire",
    }),
  ],
  [
    /^smart fit|^smartfit/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#FBBA00",
      deepEnd: "#000000",
      wash: 0.4,
      logo: "smartfit",
    }),
  ],
  [
    /^robux|pavos/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#8E9AAE",
      deepEnd: "#000000",
      wash: 0.24,
      logo: "roblox",
    }),
  ],
  [
    /^cine/,
    spec({
      bg: "#12141C",
      ink: "#F2C260",
      accent: "#E8A33A",
      wash: 0.34,
      font: "serif",
      weight: 600,
      upper: true,
      tracking: "0.12em",
      symbol: "ticket",
      symbolScale: 0.56,
      label: "Cine",
    }),
  ],
  [
    /^transporte|metro monterrey/,
    spec({
      bg: "#0A4D34",
      ink: "#FFFFFF",
      accent: "#5FD6A4",
      wash: 0.34,
      font: "condensed",
      weight: 600,
      upper: true,
      tracking: "0.1em",
      symbol: "train",
      symbolScale: 0.56,
      label: "Metro",
    }),
  ],
];

/**
 * Servicios propios sin logotipo de marca. No son marcas ajenas, así que en vez
 * de imitar a nadie reciben su propio símbolo y un color profundo distinto.
 */
/**
 * Paleta institucional: la de un archivo, no la de una promoción.
 *
 * Es la misma para Trámites y para los servicios temáticos de «Otros» —los que
 * no son marca— porque son las dos categorías donde el color no identifica a
 * nadie: solo tiene que ordenar. Seis familias sacadas de papelería de oficina
 * —azul tinta, verde botella, granate, gris pizarra, ocre papel y azul acero—
 * más tres derivadas para que dos fichas vecinas nunca coincidan.
 *
 * Cada familia da tres cosas:
 *
 *  · `bg`   — el fondo de la fila de Trámites: profundo y con color de verdad,
 *             no un gris teñido.
 *  · `card` — el fondo de la tarjeta de «Otros»: la pizarra casi negra de CINE,
 *             con un punto del tono de la familia para que no sean 22 tarjetas
 *             idénticas.
 *  · `ink`  — el color sólido del nombre y del icono. Sólido de verdad, como el
 *             oro de CINE: ni fluorescente ni lavado.
 */
const SOBRIA = {
  tinta: { bg: "#141B33", card: "#12141F", ink: "#7C93D8" },
  botella: { bg: "#0E241C", card: "#101812", ink: "#57BE8E" },
  granate: { bg: "#2A141B", card: "#191114", ink: "#DB5F72" },
  pizarra: { bg: "#181B21", card: "#131519", ink: "#A6B2C2" },
  ocre: { bg: "#26200F", card: "#181509", ink: "#E0A93E" },
  acero: { bg: "#122130", card: "#101720", ink: "#57A6DC" },
  purpura: { bg: "#1E1630", card: "#15111F", ink: "#A98AE0" },
  oliva: { bg: "#1B2113", card: "#14170D", ink: "#B4C04C" },
  teja: { bg: "#2A1710", card: "#19110C", ink: "#E08050" },
} as const;

/**
 * Servicio temático de «Otros»: mismo molde para los 15, solo cambia el tono.
 *
 * La referencia es CINE: pizarra casi negra y un color sólido encima. Lo que se
 * evita es lo contrario en las dos direcciones —el pastel fluorescente sobre
 * fondo teñido, que parece un letrero de neón, y el tono lavado sobre gris, que
 * apaga la página entera.
 */
function sobrio(
  tone: keyof typeof SOBRIA,
  symbol: SymbolId,
  symbolScale = 0.54,
  extra: Partial<Parameters<typeof spec>[0]> = {},
): Brand {
  const t = SOBRIA[tone];
  return spec({
    bg: t.card,
    ink: t.ink,
    accent: t.ink,
    // Resplandor muy bajo: el color lo pone la tinta, no un halo detrás.
    wash: 0.16,
    font: "display",
    weight: 600,
    paper: true,
    symbol,
    symbolScale,
    ...extra,
  });
}

const OWN: Array<[RegExp, Brand]> = [
  [/^pagos de servicios/, sobrio("ocre", "card", 0.56)],
  [/^compras con descuento/, sobrio("granate", "bag", 0.56)],
  [/^abonos|liquidacion de creditos/, sobrio("oliva", "coins", 0.56)],
  [/^recargas/, sobrio("acero", "phone", 0.5)],
  [/^comida/, sobrio("teja", "cutlery", 0.52)],
  [/^hospedaje|boletos y viajes/, sobrio("acero", "plane", 0.54)],
  [/^seguro de autos/, sobrio("tinta", "carShield", 0.56)],
  [/^videojuegos/, sobrio("purpura", "gamepad", 0.56)],
  [/^peliculas|libros y pdf/, sobrio("granate", "book", 0.54)],
  [/^bots para grupos/, sobrio("botella", "bot", 0.54)],
  [/^seguidores/, sobrio("purpura", "users", 0.54)],
  [/^numeros virtuales/, sobrio("acero", "hash", 0.5)],
  [/^recuperacion de cuentas/, sobrio("ocre", "key", 0.52)],
  [/^paneles y metodos/, sobrio("tinta", "grid", 0.52)],
  [/^robux|pavos/, sobrio("pizarra", "coins", 0.52)],
];

/** Colecciones de «Otros»: agrupan varios servicios, no son una marca. */
const BUNDLES: Array<[RegExp, Brand]> = [
  [
    /adultos/,
    spec({
      bg: "#1A060D",
      ink: "#FF8FA8",
      accent: "#E23B63",
      wash: 0.26,
      symbol: "playCircle",
      symbolScale: 0.5,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /vpn/,
    spec({
      bg: "#07202B",
      ink: "#7FE0EE",
      accent: "#2CAFC4",
      wash: 0.26,
      symbol: "shield",
      symbolScale: 0.5,
      font: "display",
      weight: 600,
    }),
  ],
];

/**
 * Trámites, por tipo de documento.
 *
 * Tonos profundos y poco saturados: son 59 fichas seguidas y una paleta viva
 * las convertía en etiquetas de papelería. El color distingue el tipo de
 * documento y el icono lo nombra; el fondo se mantiene oscuro para que la
 * categoría se lea como un bloque tranquilo.
 */
type TramiteStyle = { tone: keyof typeof SOBRIA; symbol: SymbolId };

/**
 * Blanco cálido, no blanco puro y sobre todo no el color de acento.
 *
 * Poner el nombre del trámite en su propio color era lo que hacía que la
 * categoría entera se viera de neón: 59 renglones seguidos de texto teñido. El
 * acento se queda donde sí ordena —el icono y el filo— y el nombre se lee en el
 * blanco de un documento.
 */
const PAPEL = "#EDE9E1";

const TRAMITES: Record<string, TramiteStyle> = {
  actas: { tone: "tinta", symbol: "seal" },
  sat: { tone: "botella", symbol: "receipt" },
  salud: { tone: "acero", symbol: "medicalCross" },
  imss: { tone: "pizarra", symbol: "idCard" },
  educacion: { tone: "ocre", symbol: "gradCap" },
  antecedentes: { tone: "granate", symbol: "fingerprint" },
  vehiculos: { tone: "teja", symbol: "car" },
  infonavit: { tone: "purpura", symbol: "house" },
  citas: { tone: "oliva", symbol: "calendar" },
};

const TRAMITE_ORDER = Object.keys(TRAMITES);

/** Trámite sin subcategoría conocida: reparte por nombre, nunca gris. */
function tramiteFallback(name: string): TramiteStyle {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const slot = TRAMITE_ORDER[h % TRAMITE_ORDER.length] as string;
  return TRAMITES[slot] as TramiteStyle;
}

export type BrandInput = {
  name: string;
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  /** Color guardado en la base; solo se usa si no hay nada mejor. */
  color?: string | null;
  /** Tarjeta de colección de «Otros», no un servicio suelto. */
  bundle?: boolean;
};

const cache = new Map<string, Brand>();

export function resolveBrand(input: BrandInput): Brand {
  const cacheKey = `${input.name}|${input.categorySlug ?? ""}|${input.subcategorySlug ?? ""}|${input.color ?? ""}|${input.bundle ? 1 : 0}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const brand = compute(input);
  cache.set(cacheKey, brand);
  return brand;
}

function compute(input: BrandInput): Brand {
  const name = key(input.name);

  if (input.bundle) {
    for (const [re, brand] of BUNDLES) if (re.test(name)) return brand;
  }

  if (input.categorySlug === "tramites") {
    const sub = input.subcategorySlug ?? "";
    // «salud» agrupa dos familias distintas: consultas médicas y seguridad
    // social. Se separan porque el usuario las busca por separado.
    const slot =
      sub === "salud" &&
      /nss|seguro social|seguridad social|imss|issste|isssemym|afore|semanas|vigencia|incapacidad|sindo/.test(
        name,
      )
        ? "imss"
        : sub;
    const style = TRAMITES[slot] ?? tramiteFallback(name);
    const t = SOBRIA[style.tone];
    return spec({
      bg: t.bg,
      ink: PAPEL,
      accent: t.ink,
      // El acento vive solo en el icono y en el filo de arriba.
      symbolInk: t.ink,
      wash: 0.16,
      font: "display",
      weight: 600,
      tracking: "-0.02em",
      paper: true,
      symbol: style.symbol,
      symbolScale: 0.46,
    });
  }

  for (const [re, brand] of BRANDS) if (re.test(name)) return brand;
  for (const [re, brand] of OWN) if (re.test(name)) return brand;

  // Sin marca conocida: se respeta el color elegido a mano en la base.
  const base = normalizeHex(input.color) ?? hashColor(name);
  return spec({
    bg: shade(base, -0.78),
    ink: tint(base, 0.55),
    accent: base,
    wash: 0.26,
    font: "display",
    weight: 600,
    tracking: "-0.025em",
    symbol: "grid",
    symbolScale: 0.46,
  });
}

/** Color de acento de un servicio, para puntos y filos fuera de la ficha. */
export function brandAccent(input: BrandInput): string {
  return resolveBrand(input).accent;
}

// ── Composición de la superficie ────────────────────────────────────────────

export type BrandSkin = {
  /** Fondo completo de la tarjeta o de la ficha. */
  background: string;
  /** Borde. */
  border: string;
  /** Filo de luz superior. */
  edge: string;
  /** Tinta del logotipo. */
  ink: string;
  /** Degradado de la tinta, si la marca lo lleva. */
  inkGrad: string | undefined;
  /** Tinta del símbolo. */
  symbolInk: string;
  /** Sombra del logotipo, para que se despegue del fondo. */
  inkShadow: string;
  /** Acento de la marca, para contadores y detalles. */
  accent: string;
  /**
   * Extremo profundo del degradado de la ficha: el color de la marca muy
   * oscurecido, NUNCA negro. Si una marca no lleva negro —ViX, Crunchyroll,
   * Universal+— su ficha tampoco debe llevarlo.
   */
  deep: string;
  /** Color legible para texto secundario sobre esta superficie. */
  meta: string;
  /** Color del texto de interfaz (no del logotipo) sobre esta superficie. */
  chrome: string;
};

/**
 * Compone la superficie de una marca.
 *
 * `hero` es la ficha completa: el mismo fondo pero con más recorrido, porque
 * cubre toda la pantalla y necesita que la luz viaje de arriba abajo.
 */
export function brandSkin(brand: Brand, size: "card" | "hero" = "card"): BrandSkin {
  const hero = size === "hero";
  const a = brand.accent;

  /*
   * La tarjeta y la ficha no se pintan igual, y es a propósito:
   *
   *  · **Tarjeta** — el fondo EXACTO del logotipo, plano. Si el logotipo de
   *    Netflix es negro, la tarjeta es negra; no se le inventa un resplandor
   *    rojo. Lo único que se le suma es la luz cenital del sistema de vidrio,
   *    que es del lenguaje de la app y no del color de la marca.
   *  · **Ficha** — ahí sí entra el difuminado con los colores reales de la
   *    marca, que es lo que hace que la pantalla completa se sienta suya.
   */
  /*
   * En la ficha, la capa de marca mide lo que mide la PÁGINA —puede ser de
   * once mil píxeles—, así que todo lo que sea un efecto de entrada tiene que
   * ir en `vh` y no en porcentaje: un 46 % de once mil píxeles no es una luz
   * cenital, es un velo blanco sobre la mitad del documento. Ese fue el motivo
   * de que HBO Max saliera gris.
   */
  const skylight = hero
    ? `radial-gradient(120vw 38vh at 50% -6vh, ${rgba(brand.light ? "#000000" : "#FFFFFF", brand.light ? 0.05 : 0.08)}, transparent 64%)`
    : `radial-gradient(132% 62% at 50% -14%, ${rgba(brand.light ? "#000000" : "#FFFFFF", brand.light ? 0.05 : 0.08)}, transparent 64%)`;

  /*
   * En la ficha manda el color PRINCIPAL del logotipo, no su fondo.
   *
   * Es la diferencia entre una página viva y una apagada: el fondo del
   * logotipo de Netflix es negro y el de Peacock también, pero lo que
   * identifica a esas marcas es el rojo y el blanco. Si el negro domina, la
   * ficha se ve muerta. Así que el acento cubre la parte alta y el fondo real
   * queda como extremo profundo.
   *
   * Los colores secundarios —los cinco puntos de Peacock— entran después, en
   * dosis pequeñas, como acentos y no como protagonistas.
   */
  const deep = shade(a, -0.66);

  /** Cuánto pesa el acento en el difuminado. Ver `Brand.fade`. */
  const f = brand.fade ?? 1;

  /*
   * Halo bajo el logotipo, del propio extremo profundo de la marca.
   *
   * Sin él, un wordmark del mismo color que su acento se pierde en su propia
   * ficha: el rojo de Netflix sobre un fondo rojo, el blanco de Peacock sobre
   * uno blanco. En las marcas cuyo extremo profundo es su fondo oscuro —que
   * son justo esas— devuelve el suelo sobre el que el logotipo fue dibujado, y
   * en las demás es un tono más del mismo color y no se nota.
   */
  const halo = `radial-gradient(96vw 22vh at 50% 22vh, ${rgba(shade(brand.deepEnd ?? a, -0.2), 0.5)}, transparent 74%)`;

  /*
   * El difuminado de la ficha es UNO SOLO y es el mismo de arriba abajo.
   *
   * La referencia es ViX: la ficha entera es el degradado del propio logotipo,
   * del color de su fondo al color de sus letras, y se mantiene igual hasta el
   * final del scroll. No hay una primera pantalla vistosa y un pie oscuro —eso
   * partía la ficha en dos— ni negro añadido por nosotros: si la marca no lleva
   * negro, su ficha tampoco.
   *
   * Todo lo que sí es un efecto de entrada —la luz cenital y el halo bajo el
   * logotipo— se mide en `vh`, porque la capa de marca mide lo que mide la
   * página y un porcentaje sobre once mil píxeles no es un reflejo, es un velo.
   */
  const layers = hero
    ? [
        skylight,
        halo,
        ...(brand.secondary ?? []).map(
          (c, i) =>
            `radial-gradient(62vw 20vh at ${14 + i * 18}vw ${9 + (i % 2) * 7}vh, ${rgba(c, 0.26)}, transparent 64%)`,
        ),
        // El color del logotipo, parejo. Solo cede seis puntos de aquí al pie,
        // lo justo para que la página tenga profundidad y no se vea plana.
        `linear-gradient(180deg, ${rgba(a, 0.82 * f)} 0%, ${rgba(a, 0.78 * f)} 38%, ${rgba(a, 0.72 * f)} 72%, ${rgba(a, 0.68 * f)} 100%)`,
        // Profundidad, no oscuridad: es el propio color de la marca apenas
        // rebajado, y nunca llega a un tercio de presencia.
        `linear-gradient(180deg, transparent 0%, ${rgba(shade(brand.deepEnd ?? a, -0.28), 0.18)} 55%, ${rgba(shade(brand.deepEnd ?? a, -0.28), 0.3)} 100%)`,
        brand.bg,
      ]
    : [skylight, brand.bg];

  return {
    background: layers.join(", "),
    // Neutro, no del color de la marca: un borde rojo alrededor de Netflix se
    // lee como resplandor y rompe el negro plano de su logotipo. El marco es
    // del sistema de vidrio de la app; el color es del fondo y del logotipo.
    border: rgba(brand.light ? "#000000" : "#FFFFFF", brand.light ? 0.12 : 0.14),
    edge: rgba(brand.light ? "#000000" : "#FFFFFF", brand.light ? 0.12 : 0.34),
    ink: brand.ink,
    inkGrad: brand.inkGrad,
    symbolInk: brand.symbolInk ?? brand.ink,
    inkShadow: "none",
    accent: a,
    deep,
    // Neutro a propósito: el color de la marca es del fondo y del logotipo.
    // Si además tiñera los textos de apoyo, el rojo de Netflix se comería la
    // legibilidad de «81 ofertas» y de los precios.
    meta: brand.light ? rgba("#000000", 0.6) : rgba("#FFFFFF", 0.66),
    chrome: brand.light ? "#101014" : "#FFFFFF",
  };
}

// ── Utilidades de color ─────────────────────────────────────────────────────

function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    const [r, g, b] = [v[1], v[2], v[3]] as [string, string, string];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
}

function parse(hex: string): [number, number, number] {
  const h = normalizeHex(hex) ?? "#888888";
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

function toHex(r: number, g: number, b: number) {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

function rgba(hex: string, alpha: number) {
  const [r, g, b] = parse(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

/** Oscurece (`amount` negativo) o aclara un color. */
function shade(hex: string, amount: number) {
  const [r, g, b] = parse(hex);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  return toHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}

function tint(hex: string, amount: number) {
  return shade(hex, amount);
}

/** Color estable a partir del nombre, para lo que no tiene nada asignado. */
function hashColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const s = 0.52;
  const l = 0.6;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor(hue / 60) % 6;
  const rgb: Array<[number, number, number]> = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [r, g, b] = rgb[seg] as [number, number, number];
  return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
