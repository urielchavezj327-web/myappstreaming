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

/**
 * Cómo se pinta el fondo de la ficha.
 *
 * Tres modelos, y cada marca entra en UNO SOLO según cómo esté construido su
 * logotipo. No se mezclan ni se aplica uno donde va otro.
 *
 *  · **`color`** — el color exacto de la marca. Ni se aclara, ni se lava, ni se
 *    mezcla con blanco. Plano si su logotipo es de un color; par arriba/abajo si
 *    su logotipo ya trae su propio degradado.
 *  · **`negro`** — para los logotipos en blanco y negro. Fondo negro y encima
 *    una capa de color SÓLIDO en `mix-blend-mode: screen`. La fórmula del screen
 *    es `1-(1-a)(1-b)`: sobre negro puro devuelve exactamente el color de la
 *    capa, y sobre contenido claro se queda claro. Levanta el negro HACIA un
 *    color sin lavarlo a gris, que es justo lo que pasaba al degradar de negro a
 *    rojo —la mitad de la pantalla quedaba granate—.
 *  · **`claro`** — el reverso: fondo claro y una capa sólida en `multiply`.
 *
 * Dos reglas que, si se rompen, rompen el efecto:
 *
 *  · La intensidad se controla OSCURECIENDO el color sólido de la capa, nunca
 *    con `opacity`. La opacidad es lo que producía el lavado gris-rosa.
 *  · La capa es un color sólido, jamás un degradado, y va anclada a la PANTALLA
 *    (`fixed inset-0`) para verse idéntica a cualquier altura del scroll.
 *
 * Prohibidos en el modelo `negro`: `multiply` (negro × lo que sea = negro),
 * `overlay` y `soft-light`.
 */
export type Ficha =
  | { modelo: "color"; fondo: string | [string, string] }
  | { modelo: "negro"; fondo: string; luz: string }
  | { modelo: "claro"; fondo: string; tinte: string };

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
  /** Cómo se pinta el fondo de la ficha. Cuando existe, manda sobre `mix`. */
  ficha?: Ficha;
  /**
   * El tercer color del logotipo —el dorado de la «x» de Plex, el rojo de MLB,
   * los cinco puntos de Peacock—.
   *
   * Ya NO va en el fondo. Con la capa de luz obligada a ser sólida no queda
   * sitio ahí, y meterlo como parada de degradado lo convierte en una franja
   * fija al pie de la pantalla. Va en la interfaz, sustituyendo a la plata del
   * sistema: acento neutro por defecto, color de marca donde la marca tiene uno
   * propio.
   *
   * Uno solo tiñe los tres sitios donde vive la plata dentro de la ficha —el
   * precio de la fila destacada, la píldora «Mejor precio» y el botón de
   * copiar—. Varios se quedan SOLO en la píldora, en su orden real: cinco
   * colores repartidos por la ficha serían confeti.
   */
  fichaAccent?: string[];
  /**
   * MODELO VIEJO. Los colores del logotipo que se promediaban en uno solo.
   *
   * Solo sigue vivo para las categorías que aún no se han revisado ficha por
   * ficha —Música, Diseño e IA, Otros y Trámites—. Cuando la última esté
   * aprobada, esto y `secondary` se borran junto con `legacyField`.
   */
  mix?: string[];
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
    ...(s.ficha ? { ficha: s.ficha } : {}),
    ...(s.fichaAccent ? { fichaAccent: s.fichaAccent } : {}),
    ...(s.mix ? { mix: s.mix } : {}),
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
      // Modelo B. Su logotipo es rojo sobre negro: el negro se levanta HACIA el
      // rojo con una capa sólida en `screen`. Degradar de un negro a un rojo
      // dejaba media pantalla en granate, que es el vino que no es de Netflix.
      ficha: { modelo: "negro", fondo: "#000000", luz: "#4D0207" },
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
      // Modelo A: el degradado del propio logotipo, exacto. El celeste de abajo
      // tiene que verse VIVO, y el encabezado toma el #084F60 de arriba.
      ficha: { modelo: "color", fondo: ["#084F60", "#00D6E8"] },
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
      wash: 0.34,
      // Modelo B. El plateado de sus letras entra como aclarado general en
      // `screen`, no como luz por un lado.
      ficha: { modelo: "negro", fondo: "#05070F", luz: "#2A2E3A" },
      logo: "hbomax",
    }),
  ],
  [
    /^prime video|^amazon prime/,
    spec({
      bg: "#0779FF",
      ink: "#FFFFFF",
      accent: "#0779FF",
      wash: 0.3,
      // Modelo A: su azul exacto, plano. Ni aclarado ni mezclado con blanco.
      ficha: { modelo: "color", fondo: "#00A8E1" },
      logo: "primevideo",
    }),
  ],
  [
    /^paramount/,
    spec({
      bg: "#006FFD",
      ink: "#FFFFFF",
      accent: "#006FFD",
      wash: 0.24,
      // Modelo A: su azul exacto, plano.
      ficha: { modelo: "color", fondo: "#0064FF" },
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
      secondary: ["#F8B410", "#E82828", "#A42CDC", "#1898E8", "#00B060"],
      wash: 0.3,
      // Modelo B: negro levantado apenas. Sus cinco puntos no van en el fondo
      // —serían confeti— sino en la píldora «Mejor precio», en su orden real.
      ficha: { modelo: "negro", fondo: "#000000", luz: "#262628" },
      fichaAccent: ["#F8B410", "#E82828", "#A42CDC", "#1898E8", "#00B060"],
      logo: "peacock",
    }),
  ],
  [
    /^apple tv/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#FFFFFF",
      deepEnd: "#000000",
      wash: 0.26,
      // Modelo B: negro con el blanco de sus letras levantándolo en `screen`.
      ficha: { modelo: "negro", fondo: "#000000", luz: "#2E2E30" },
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
      accent: "#FF5E00",
      wash: 0.2,
      // Modelo A: su naranja oficial, plano y sin aclarar. Sin negro: su
      // logotipo no lo lleva.
      ficha: { modelo: "color", fondo: "#F47521" },
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
      // Modelo A: su propio degradado naranja, exacto.
      ficha: { modelo: "color", fondo: ["#FF5900", "#F52D1F"] },
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
      // Modelo B: negro levantado hacia su rojo.
      ficha: { modelo: "negro", fondo: "#000000", luz: "#4A0E08" },
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
      // Modelo C: blanco teñido de rojo con una capa en `multiply`. Su logotipo
      // es rojo y azul marino sobre blanco, así que la ficha va clara, igual que
      // la tarjeta.
      //
      // El #FFE0DE de la primera pasada era un rosa tan pálido que el rojo no
      // se notaba. Este es blanco con un 28 % de su rojo #E10600: se lee como
      // rosa y deja la tinta oscura en 11:1.
      ficha: { modelo: "claro", fondo: "#FFFFFF", tinte: "#F7B9B8" },
      logo: "f1tv",
      // Su fondo es blanco: sin esto, el contador de ofertas de la TARJETA salía
      // blanco sobre blanco.
      light: true,
    }),
  ],
  [
    // Sin imagen: «FOX» viene de simple-icons y «One» va como rótulo propio.
    /^fox/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#FFFFFF",
      wash: 0.26,
      // Modelo B, igual que Apple TV: el blanco tiene que notarse.
      ficha: { modelo: "negro", fondo: "#000000", luz: "#303032" },
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
      // Modelo A: su cian exacto cayendo a negro, como su propio archivo.
      ficha: { modelo: "color", fondo: ["#00AEEF", "#000000"] },
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
      // Modelo A: su propio degradado azul→violeta. Aprobado, no se toca.
      ficha: { modelo: "color", fondo: ["#2B7FEE", "#4B36E0"] },
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
      // Modelo A, MUESTREADO del archivo píxel a píxel: su icono va de #612C86
      // en la esquina superior izquierda a un negro neutro #121212 en la
      // inferior derecha. El extremo oscuro no es un morado oscuro.
      ficha: { modelo: "color", fondo: ["#612C86", "#121212"] },
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
      secondary: ["#BA001E"],
      // Modelo C: blanco teñido de su azul marino. El rojo no cabe dentro de una
      // capa sólida, así que va de acento en la interfaz.
      ficha: { modelo: "claro", fondo: "#FFFFFF", tinte: "#DDE4EF" },
      fichaAccent: ["#D50032"],
      logo: "mlbtv",
      light: true,
    }),
  ],
  [
    /^mubi/,
    spec({
      bg: "#001DFF",
      ink: "#FFFFFF",
      accent: "#001DFF",
      wash: 0.26,
      // Modelo A: su azul, plano. El archivo del logotipo es trazo negro sobre
      // blanco y no tiene un solo píxel azul, así que este hex NO está
      // muestreado de ahí: lo dio Uri.
      ficha: { modelo: "color", fondo: "#1010D2" },
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
      // Modelo B. Su fondo real es carbón, no negro puro, así que el `screen`
      // parte de #282A2D. El dorado de la «x» va de acento en la interfaz.
      //
      // Con la capa en #1F1F1F el compuesto salía #424447, un gris medio: el
      // mismo «Plex se ve gris y no negro» de la ronda anterior. Bajada a
      // #141414 queda en #393B3E. El suelo es #282A2D —el `screen` solo puede
      // aclarar— así que más oscuro que eso habría que mover su fondo real.
      ficha: { modelo: "negro", fondo: "#282A2D", luz: "#141414" },
      fichaAccent: ["#E5A00D"],
      logo: "plex",
    }),
  ],
  [
    /^universal/,
    spec({
      bg: "#FBCC11",
      ink: "#000000",
      accent: "#FBCC11",
      wash: 0.18,
      // Modelo C: su amarillo teñido con una capa en `multiply`, que es como el
      // negro de sus letras entra sin ensuciarlo.
      ficha: { modelo: "claro", fondo: "#FBCC11", tinte: "#E8D89A" },
      logo: "universalplus",
      light: true,
    }),
  ],
  [
    /^viki/,
    spec({
      bg: "#0C9BFF",
      ink: "#FFFFFF",
      accent: "#0C9BFF",
      wash: 0.2,
      // Modelo A: su azul cielo exacto, plano. Sin negro.
      ficha: { modelo: "color", fondo: "#0C9BFF" },
      logo: "viki",
    }),
  ],
  [
    /^iqiyi/,
    spec({
      bg: "linear-gradient(180deg,#00DC5B,#00C251 60%,#00B74C)",
      ink: "#FFFFFF",
      accent: "#00DC5B",
      wash: 0.18,
      // Modelo A: su verde exacto, plano. Sin negro.
      ficha: { modelo: "color", fondo: "#00DC5A" },
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
      mix: ["#191414", "#191414", "#1DB954"],
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
      accent: "#FB5C74",
      wash: 0.18,
      mix: ["#FB5C74", "#FB5C74", "#FA4B62"],
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
      mix: ["#FFFFFF", "#FFFFFF", "#FF0000"],
      logo: "youtube",
      light: true,
    }),
  ],
  [
    /^amazon music/,
    spec({
      bg: "#25D2D9",
      ink: "#000000",
      accent: "#25D2D9",
      wash: 0.18,
      mix: ["#25D2D9", "#25D2D9", "#000000"],
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
      mix: ["#000000", "#000000", "#A237FF"],
      logo: "deezer",
    }),
  ],
  [
    /^tidal/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#FFFFFF",
      deepEnd: "#000000",
      wash: 0.22,
      mix: ["#000000", "#000000", "#000000", "#C9CFD6"],
      logo: "tidal",
    }),
  ],
  [
    /^qobuz/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#FFFFFF",
      deepEnd: "#000000",
      wash: 0.22,
      mix: ["#000000", "#000000", "#000000", "#B9C2CC"],
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
      mix: ["#001E36", "#001E36", "#31A8FF"],
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
      mix: ["#0A0A0C", "#0A0A0C", "#0A0A0C", "#FFFFFF"],
      logo: "capcut",
      suffix: "Pro",
    }),
  ],
  [
    // El nudo va trazado de tu imagen; el nombre, en la tipografía de la app.
    // Su identidad es negro y blanco, y el blanco a plena intensidad convierte
    // la ficha en una página gris: entra rebajado, como luz sobre el negro.
    /^chatgpt|^openai/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#FFFFFF",
      deepEnd: "#000000",
      wash: 0.5,
      mix: ["#000000", "#000000", "#000000", "#FFFFFF"],
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
    // Fondo claro, como el archivo, pero no blanco de papel: el gris 50 de la
    // propia paleta de Google, que es el que usan ellos de superficie.
    /^gemini/,
    spec({
      bg: "#F8F9FA",
      ink: "#4D8BEA",
      accent: "#6482E1",
      deepEnd: "#EDEFF3",
      wash: 0.45,
      mix: ["#F8F9FA", "#F8F9FA", "#4D8BEA", "#C4667F"],
      logo: "gemini",
      light: true,
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
      mix: ["#141416", "#141416", "#0A91E1", "#E0518C"],
      logo: "microsoft365",
    }),
  ],
  [
    // Fondo blanco, que es el del archivo que mandaste: el logotipo de OneDrive
    // es una nube azul y un nombre azul marino sobre blanco, no al revés.
    /onedrive/,
    spec({
      bg: "#FFFFFF",
      ink: "#074BB3",
      accent: "#0179D4",
      deepEnd: "#E6F1FB",
      wash: 0.46,
      mix: ["#FFFFFF", "#FFFFFF", "#0179D4"],
      logo: "onedrive",
      light: true,
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
      deepEnd: "#E8EAED",
      wash: 0.4,
      mix: [
        "#FFFFFF",
        "#FFFFFF",
        "#FFFFFF",
        "#FFFFFF",
        "#FFFFFF",
        "#FFFFFF",
        "#4285F4",
        "#EA4335",
        "#FBBC04",
        "#34A853",
      ],
      logo: "googleone",
      light: true,
    }),
  ],
  [
    // El acento es el verde del propio cuadro del icono, no el de la cabeza:
    // así la parte alta de la ficha es exactamente el suelo sobre el que está
    // dibujado el búho y no se ve el canto del icono. El blanco de los ojos y
    // los dos tonos del pico entran de secundarios, sin quitarle el mando al
    // verde. Nada de negro: el icono no lo lleva.
    /^duolingo/,
    spec({
      bg: "#77C801",
      ink: "#FFFFFF",
      accent: "#77C801",
      secondary: ["#FEC200", "#F38003", "#FFFFFF"],
      deepEnd: "#8FDF02",
      wash: 0.18,
      // Plano en el mismo verde del cuadro del icono: cualquier variación
      // detrás de él dibujaría el canto del cuadro. Los otros colores entran
      // por abajo, donde el icono ya no está.
      mix: ["#77C801", "#77C801", "#8FDF02"],
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
      deepEnd: "#7949D0",
      wash: 0.22,
      mix: ["#D302BF", "#9039CC", "#36ABE0", "#01FDEE"],
      logo: "picsart",
    }),
  ],
  [
    /^scribd/,
    spec({
      bg: "#0A8648",
      ink: "#FFFFFF",
      accent: "#0A8648",
      wash: 0.2,
      mix: ["#0A8648", "#0A8648", "#FFFFFF"],
      logo: "scribd",
    }),
  ],

  // ── Otros con marca ────────────────────────────────────────────────────
  [
    /^discord/,
    spec({
      bg: "#5865F2",
      ink: "#FFFFFF",
      accent: "#5865F2",
      wash: 0.18,
      mix: ["#5865F2", "#5865F2", "#FFFFFF"],
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
      mix: ["#000000", "#000000", "#FBBA00"],
      logo: "smartfit",
    }),
  ],
  [
    /^robux|pavos/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#FFFFFF",
      deepEnd: "#000000",
      wash: 0.24,
      mix: ["#000000", "#000000", "#000000", "#FFFFFF"],
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
      paper: true,
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
  tinta: { bg: "#141B33", card: "#12141F", ink: "#7E90BE" },
  botella: { bg: "#0E241C", card: "#101812", ink: "#63AE8C" },
  granate: { bg: "#2A141B", card: "#191114", ink: "#C4707C" },
  pizarra: { bg: "#181B21", card: "#131519", ink: "#A3ACB8" },
  ocre: { bg: "#26200F", card: "#181509", ink: "#DDAE5B" },
  acero: { bg: "#122130", card: "#101720", ink: "#6EA1C4" },
  purpura: { bg: "#1E1630", card: "#15111F", ink: "#9E8BC4" },
  oliva: { bg: "#1B2113", card: "#14170D", ink: "#AEB667" },
  teja: { bg: "#2A1710", card: "#19110C", ink: "#CE8663" },
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
    // La ficha es la misma pizarra de la tarjeta llevada hacia su color: al
    // entrar se ve lo mismo que se venía viendo, un punto más encendido.
    mix: [t.card, mixHex(t.card, t.ink, 0.34)],
    // Resplandor muy bajo: el color lo pone la tinta, no un halo detrás. Y en
    // la ficha el color entra apenas teñido, para que al entrar se vea la
    // misma pizarra que en la tarjeta y no una pantalla del color del texto.
    wash: 0.16,
    font: "display",
    weight: 600,
    paper: true,
    symbol,
    symbolScale,
    ...extra,
  });
}

/*
 * Los quince servicios temáticos de «Otros».
 *
 * Ninguno es una marca, así que aquí la tipografía SÍ es el logotipo: es lo
 * único que distingue una ficha de otra. Cada una lleva la de su asunto —la
 * condensada de una placa para los videojuegos y el transporte, la de billete
 * de avión para los viajes, la manuscrita de una carta para la comida, la
 * serif de una marquesina para el cine y los libros, la geométrica de un
 * recibo para pagos y recargas—, con el mismo molde de color para todos.
 */
const OWN: Array<[RegExp, Brand]> = [
  [/^pagos de servicios/, sobrio("ocre", "card", 0.56, { font: "geometric", weight: 600 })],
  [
    /^compras con descuento/,
    sobrio("granate", "bag", 0.56, { font: "display", weight: 800, tracking: "-0.04em" }),
  ],
  [
    /^abonos|liquidacion de creditos/,
    sobrio("oliva", "coins", 0.56, { font: "grotesk", weight: 700, tracking: "-0.02em" }),
  ],
  [/^recargas/, sobrio("acero", "phone", 0.5, { font: "geometric", weight: 600 })],
  [/^comida/, sobrio("teja", "cutlery", 0.52, { font: "script", weight: 400, tracking: "0em" })],
  [
    /^hospedaje|boletos y viajes/,
    sobrio("acero", "plane", 0.54, {
      font: "condensed",
      weight: 500,
      upper: true,
      tracking: "0.1em",
    }),
  ],
  [
    /^seguro de autos/,
    sobrio("tinta", "carShield", 0.56, {
      font: "condensed",
      weight: 600,
      upper: true,
      tracking: "0.08em",
    }),
  ],
  [
    /^videojuegos/,
    sobrio("purpura", "gamepad", 0.56, {
      font: "condensed",
      weight: 700,
      upper: true,
      tracking: "0.14em",
    }),
  ],
  [
    /^peliculas|libros y pdf/,
    sobrio("granate", "book", 0.54, { font: "serif", weight: 600, tracking: "0.02em" }),
  ],
  [/^bots para grupos/, sobrio("botella", "bot", 0.54, { font: "geometric", weight: 600 })],
  [
    /^seguidores/,
    sobrio("purpura", "users", 0.54, { font: "display", weight: 800, tracking: "-0.045em" }),
  ],
  [
    /^numeros virtuales/,
    sobrio("acero", "hash", 0.5, { font: "geometric", weight: 600, tracking: "0.02em" }),
  ],
  [
    /^recuperacion de cuentas/,
    sobrio("ocre", "key", 0.52, { font: "grotesk", weight: 700, tracking: "-0.02em" }),
  ],
  [
    /^paneles y metodos/,
    sobrio("tinta", "grid", 0.52, { font: "geometric", weight: 600, tracking: "0.02em" }),
  ],
  [
    /^transporte/,
    sobrio("pizarra", "grid", 0.52, {
      font: "condensed",
      weight: 600,
      upper: true,
      tracking: "0.1em",
    }),
  ],
  [
    /^robux|pavos/,
    sobrio("pizarra", "coins", 0.52, { font: "display", weight: 800, tracking: "-0.04em" }),
  ],
];

/** Colecciones de «Otros»: agrupan varios servicios, no son una marca. */
const BUNDLES: Array<[RegExp, Brand]> = [
  [/adultos/, sobrio("granate", "playCircle", 0.5, { font: "display", weight: 700 })],
  [
    /vpn/,
    sobrio("acero", "shield", 0.5, {
      font: "condensed",
      weight: 600,
      upper: true,
      tracking: "0.1em",
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
      mix: [t.bg, mixHex(t.bg, t.ink, 0.3)],
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
  /** ¿Esta superficie quedó clara? Se decide por superficie, no por marca. */
  light: boolean;
  /** Color de la barra superior dentro de la ficha. */
  chromeBg: string;
  /** Fondo completo de la tarjeta o de la ficha. */
  background: string;
  /**
   * La capa sólida que va ENCIMA del fondo, con su modo de mezcla. `null` en el
   * modelo A y en las tarjetas del catálogo, que no llevan ninguna.
   */
  blend: { color: string; mode: "screen" | "multiply" } | null;
  /**
   * Acento contextual de la marca; sustituye a la plata del sistema dentro de
   * la ficha. `null` = plata. `brand` en `null` con `metal` puesto significa
   * que el color va solo en la píldora (Peacock).
   */
  uiAccent: {
    brand: string | null;
    ink: string;
    glow: string;
    metal: string;
    sheen: string;
  } | null;
  /** Borde. */
  border: string;
  /** Filo de luz superior. */
  edge: string;
  /** Sombras en capas del canto de la tarjeta, para que no se vea plana. */
  relief: string;
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
  /**
   * ¿La ZONA DE ARRIBA quedó clara? No siempre coincide con `light`, que se
   * decide por el color de media pantalla: Disney+ tiene el cuerpo claro y la
   * barra sobre un teal casi negro, y HIDIVE justo al revés.
   */
  chromeLight: boolean;
};

/**
 * Compone la superficie de una marca.
 *
 * `hero` es la ficha completa: el mismo fondo pero con más recorrido, porque
 * cubre toda la pantalla y necesita que la luz viaje de arriba abajo.
 */
/** Fondo de la ficha ya resuelto: qué se pinta y qué color queda encima. */
type Surface = {
  /** Color COMPUESTO de arriba: lo que se ve, no el hex crudo del fondo. */
  top: string;
  /** Color compuesto de abajo. En los modelos B y C es el mismo que `top`. */
  bottom: string;
  /** Lo que va en la capa de fondo. */
  background: string;
  /** La capa de mezcla que va encima, o `null` en el modelo A. */
  blend: { color: string; mode: "screen" | "multiply" } | null;
};

/**
 * El fondo de la ficha, según el modelo de la marca.
 *
 * Hay dos caminos, y cuál se toma lo decide si la marca tiene `ficha`:
 *
 *  · **`fichaSurface`** — los tres modelos. Es el bueno y el que se queda. Hoy
 *    lo usan las 21 fichas de Streaming.
 *  · **`legacyField`** — promediar los colores del logotipo en uno. Es el que
 *    hay que borrar. Sigue vivo únicamente para las categorías que todavía no
 *    se han revisado ficha por ficha; cuando la última esté aprobada, esa
 *    función, `mix` y `secondary` se van juntos.
 */
function fichaSurface(ficha: Ficha): Surface {
  if (ficha.modelo === "negro") {
    const compuesto = screenHex(ficha.fondo, ficha.luz);
    return {
      top: compuesto,
      bottom: compuesto,
      background: ficha.fondo,
      blend: { color: ficha.luz, mode: "screen" },
    };
  }

  if (ficha.modelo === "claro") {
    const compuesto = multiplyHex(ficha.fondo, ficha.tinte);
    return {
      top: compuesto,
      bottom: compuesto,
      background: ficha.fondo,
      blend: { color: ficha.tinte, mode: "multiply" },
    };
  }

  const { fondo } = ficha;
  if (typeof fondo === "string") {
    return { top: fondo, bottom: fondo, background: fondo, blend: null };
  }
  const [top, bottom] = fondo;
  // 180°, recto de arriba abajo. El grado y pico de inclinación del modelo
  // anterior es lo que hacía que la luz «entrara por la izquierda», que es la
  // queja literal en HBO Max y en Fox One.
  return {
    top,
    bottom,
    background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`,
    blend: null,
  };
}

/**
 * El tercer color del logotipo, convertido en acento de interfaz.
 *
 * Sustituye a la plata del sistema en los tres sitios donde vive dentro de la
 * ficha: el precio de la fila destacada, la píldora «Mejor precio» y el botón
 * de copiar. Uno solo tiñe los tres; varios se quedan en la píldora.
 */
/**
 * Corrige las paradas de la píldora hasta que la tinta se lea en TODAS.
 *
 * Se mide con el brillo del metal ya encima, no con el color desnudo: la franja
 * diagonal blanca es lo que decide el peor punto de la píldora, y sin contarla
 * la cuenta sale optimista justo donde se lee peor.
 *
 * El factor es UNO SOLO para todas las paradas. Por separado se les cambia la
 * relación entre ellas, y los cinco puntos de Peacock dejan de leerse como la
 * cola del pavo real para parecer cinco colores sueltos.
 */
function pillStops(colors: string[], ink: string, sheen: number): string[] {
  const legible = (f: number) =>
    colors.every((c) => contrast(ink, mixHex(shade(c, f), "#FFFFFF", sheen)) >= 4.5);
  // Hacia el negro si la tinta es blanca, hacia el blanco si es oscura.
  const dir = ink === "#FFFFFF" ? -1 : 1;
  let f = 0;
  while (f < 0.6 && !legible(dir * f)) f += 0.01;
  return colors.map((c) => shade(c, dir * f));
}

function uiAccent(
  colors: string[],
): { brand: string | null; ink: string; glow: string; metal: string; sheen: string } | null {
  const first = colors[0];
  if (!first) return null;

  if (colors.length === 1) {
    const ink = prefersDarkInk(first) ? "#14161A" : "#FFFFFF";
    // Sobre la plata el brillo sube el contraste, porque su tinta es oscura;
    // sobre un acento oscuro lo hunde. Se baja solo donde estorba.
    const sheenPct = ink === "#FFFFFF" ? 0.16 : 0.42;
    // Recorrido corto: con el rango ancho de la plata, el extremo oscuro del
    // dorado dejaba la píldora en 4.4:1 contra su propia tinta.
    const [a, b, c] = pillStops([tint(first, 0.1), first, shade(first, -0.16)], ink, sheenPct) as [
      string,
      string,
      string,
    ];
    return {
      brand: first,
      ink,
      glow: rgba(first, 0.38),
      metal: `linear-gradient(135deg, ${a}, ${b} 52%, ${c})`,
      sheen: `oklch(1 0 0 / ${Math.round(sheenPct * 100)}%)`,
    };
  }

  /*
   * Los cinco puntos de Peacock, en su orden real y solo en la píldora: cinco
   * colores repartidos por la ficha serían confeti.
   *
   * A plena saturación no hay tinta que se lea encima —el blanco da 1.9:1
   * sobre su amarillo, el negro 3.5:1 sobre su morado—, así que se oscurecen
   * todos por igual hasta que el blanco pase de 4.5:1.
   */
  const stops = pillStops(colors, "#FFFFFF", 0.16)
    .map((c, i) => `${c} ${Math.round((i * 100) / (colors.length - 1))}%`)
    .join(", ");
  return {
    brand: null,
    ink: "#FFFFFF",
    glow: rgba(first, 0.3),
    metal: `linear-gradient(100deg, ${stops})`,
    sheen: "oklch(1 0 0 / 16%)",
  };
}

/** MODELO VIEJO. Ver `fichaSurface`. Se borra cuando la última categoría migre. */
function legacyField(brand: Brand): { top: string; bottom: string; field: string } {
  const a = brand.accent;
  const declared = brand.mix ?? [a, brand.deepEnd ?? a];
  const groundLum = lum(declared[0] as string);
  const groundLight = brand.light;
  const ceiling = Math.min(0.44, Math.max(0.24, groundLum * 2.2));
  const floor = 0.42;
  const band = (c: string) => {
    const l = lum(c);
    if (!groundLight && l > ceiling) return mixHex(c, "#000000", Math.min(0.88, 1 - ceiling / l));
    if (groundLight && l < floor) return mixHex(c, "#FFFFFF", Math.min(0.88, 1 - l / floor));
    return c;
  };
  const mix = declared.map(band);

  let blend = mix[0] as string;
  for (let i = 1; i < mix.length; i += 1) blend = mixHex(blend, mix[i] as string, 1 / (i + 1));
  for (const c of (brand.secondary ?? []).map(band)) blend = mixHex(blend, c, 0.12);
  blend = band(blend);

  const inkLight = lum(brand.ink) > 0.5;
  const top = inkLight ? shade(blend, -0.3) : tint(blend, 0.22);
  const bottom = inkLight ? tint(blend, 0.14) : shade(blend, -0.12);
  const wash = mix.map((c) => mixHex(c, blend, 0.74));
  const inner = wash
    .map((c, i) => `${c} ${Math.round(18 + (i * 64) / Math.max(1, wash.length - 1))}%`)
    .join(", ");
  return { top, bottom, field: `linear-gradient(172deg, ${top} 0%, ${inner}, ${bottom} 100%)` };
}

export function brandSkin(brand: Brand, size: "card" | "hero" = "card"): BrandSkin {
  const hero = size === "hero";
  const a = brand.accent;

  /*
   * La tarjeta y la ficha no se pintan igual, y es a propósito:
   *
   *  · **Tarjeta** — el fondo EXACTO del logotipo, plano o con su propio
   *    degradado. Si el logotipo de Netflix es negro, la tarjeta es negra; no
   *    se le inventa un resplandor rojo. Lo único que se le suma es la luz
   *    cenital del sistema de vidrio, que es del lenguaje de la app.
   *  · **Ficha** — el degradado de los colores de la marca, anclado a la
   *    PANTALLA. Ver `fichaField`.
   */
  const skylight = `radial-gradient(132% 62% at 50% -14%, ${rgba(brand.light ? "#000000" : "#FFFFFF", brand.light ? 0.05 : 0.08)}, transparent 64%)`;

  const deep = shade(a, -0.66);
  const surface: Surface = brand.ficha
    ? fichaSurface(brand.ficha)
    : (() => {
        const { top, bottom, field } = legacyField(brand);
        return { top, bottom, background: field, blend: null };
      })();
  const { top, bottom } = surface;

  const layers = hero ? [surface.background] : [skylight, brand.bg];

  /*
   * Claro u oscuro se decide por superficie Y por zona.
   *
   * Con extremos como los de Disney+ —de un teal casi negro arriba a uno
   * brillante abajo— ningún color de texto único funciona en toda la pantalla.
   * El cromo de arriba (el chip «Catálogo», el rótulo de categoría) se decide
   * por el color de arriba; el cuerpo, donde vive la lista de ofertas, por el
   * de abajo.
   */
  // El cuerpo se decide por el color de MEDIA pantalla, que es donde está la
  // lista, no por el extremo de abajo.
  const surfaceLight = hero ? prefersDarkInk(mixHex(top, bottom, 0.62)) : brand.light;
  const chromeLight = hero ? prefersDarkInk(top) : brand.light;

  return {
    light: surfaceLight,
    // La barra de arriba se pinta del color que tiene justo debajo, para que
    // no se lea como una pieza de otra pantalla pegada encima.
    chromeBg: hero ? top : "transparent",
    background: layers.join(", "),
    // Solo en la ficha: la tarjeta del catálogo lleva el fondo exacto del
    // logotipo y nada encima, que es justo lo que no se puede tocar.
    blend: hero ? surface.blend : null,
    uiAccent: hero ? uiAccent(brand.fichaAccent ?? []) : null,
    // Neutro, no del color de la marca: un borde rojo alrededor de Netflix se
    // lee como resplandor y rompe el negro plano de su logotipo. El marco es
    // del sistema de vidrio de la app; el color es del fondo y del logotipo.
    border: rgba(surfaceLight ? "#000000" : "#FFFFFF", surfaceLight ? 0.12 : 0.14),
    edge: rgba(surfaceLight ? "#000000" : "#FFFFFF", surfaceLight ? 0.12 : 0.34),
    /*
     * Relieve del canto de la tarjeta.
     *
     * Plana se veía como una calcomanía: un rectángulo de color y nada más. Va
     * ENTERO POR FUERA —un filete y dos halos del propio color de la marca—.
     * Hacia dentro tapaba el fondo del logotipo, que es justo lo que no se
     * puede tocar.
     */
    relief: brand.paper
      ? // Trámites y los temáticos de «Otros» no llevan halo de color: sobre una
        // pizarra oscura, un aro del color del texto es exactamente lo que se
        // lee como un letrero de neón. Sombra neutra y nada más.
        "0 2px 4px -2px rgba(0,0,0,0.6), 0 18px 36px -22px rgba(0,0,0,0.9)"
      : [
          "0 2px 4px -2px rgba(0,0,0,0.6)",
          `0 0 0 1px ${rgba(a, 0.18)}`,
          `0 10px 24px -10px ${rgba(a, 0.5)}`,
          `0 26px 54px -26px ${rgba(a, 0.62)}`,
        ].join(", "),
    ink: brand.ink,
    inkGrad: brand.inkGrad,
    symbolInk: brand.symbolInk ?? brand.ink,
    inkShadow: "none",
    accent: a,
    deep,
    // Neutro a propósito: el color de la marca es del fondo y del logotipo.
    // Si además tiñera los textos de apoyo, el rojo de Netflix se comería la
    // legibilidad de «81 ofertas» y de los precios.
    // El contador de ofertas se perdía contra los fondos con más color. Sube lo
    // justo: tiene que leerse de reojo, no competir con el logotipo.
    meta: surfaceLight ? rgba("#000000", 0.72) : rgba("#FFFFFF", 0.82),
    chrome: chromeLight ? "#101014" : "#FFFFFF",
    chromeLight,
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
/**
 * ¿Sobre este color se lee mejor tinta oscura que blanca?
 *
 * Se decide midiendo, no con un umbral de luminancia a ojo: el naranja de
 * Crunchyroll y el verde de iQIYI tienen luminancia media —por debajo del 0.5
 * de toda la vida— y aun así el blanco encima da 2.6:1, o sea que no se lee.
 * Se comparan los dos contrastes y gana el mayor.
 */
/**
 * Luminancia relativa de verdad, con corrección gamma.
 *
 * `lum` de aquí abajo es una media ponderada a secas, que sirve para decidir a
 * ojo si un color es oscuro pero NO para calcular contraste: sin la corrección
 * gamma, un azul medio sale un 70 % más luminoso de lo que es y la cuenta se
 * equivoca de tinta. Es lo que dejaba el texto oscuro sobre el índigo de IPTV.
 */
function relLum(hex: string) {
  const [r, g, b] = parse(hex).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function prefersDarkInk(hex: string) {
  // Con los colores de tinta REALES, no con blanco y negro puros: la app
  // escribe en #FAFAFC y en #14161A, y usar los puros inclina la cuenta hacia
  // el oscuro lo justo para equivocarse en los tonos medios.
  const l = relLum(hex) + 0.05;
  const claro = relLum("#FAFAFC") + 0.05;
  const oscuro = relLum("#14161A") + 0.05;
  return l / oscuro > claro / l;
}

/** Luminancia relativa aproximada, para decidir si un color es oscuro. */
function lum(hex: string) {
  const [r, g, b] = parse(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * `screen`, la fórmula del modelo B: `1-(1-a)(1-b)`.
 *
 * Sobre negro puro devuelve exactamente el color de la capa; sobre contenido
 * claro se queda claro. Es lo que levanta el negro HACIA un color sin lavarlo a
 * gris. Aquí se calcula en JS para saber de qué color queda el encabezado y qué
 * tinta pedir, porque el navegador la resuelve al pintar y nosotros la
 * necesitamos antes.
 */
function screenHex(a: string, b: string) {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const f = (x: number, y: number) => 255 - ((255 - x) * (255 - y)) / 255;
  return toHex(f(r1, r2), f(g1, g2), f(b1, b2));
}

/** `multiply`, la fórmula del modelo C: `a·b`. El reverso del `screen`. */
function multiplyHex(a: string, b: string) {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return toHex((r1 * r2) / 255, (g1 * g2) / 255, (b1 * b2) / 255);
}

/** Contraste entre dos colores, fórmula de la WCAG. */
function contrast(a: string, b: string) {
  const la = relLum(a) + 0.05;
  const lb = relLum(b) + 0.05;
  return la > lb ? la / lb : lb / la;
}

/** Mezcla dos colores. `t` es cuánto del segundo entra, de 0 a 1. */
function mixHex(a: string, b: string, t: number) {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

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
