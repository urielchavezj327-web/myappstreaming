import type { SymbolId } from "@/components/brand-symbols";
import type { LogoId } from "@/components/logos";
import type { TintaPagina } from "@/hooks/use-tinta-por-zona";

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
export type Ficha = {
  /**
   * Color de la barra de arriba, cuando no se puede sacar de la primera parada.
   *
   * La parada del 0 % no es el color que queda debajo de la barra: es el de la
   * ESQUINA superior izquierda. A 170deg y 180deg da igual, porque el primer
   * tramo es constante, pero en los diagonales no —en Canva hay 29 de
   * diferencia en el verde entre la esquina y el centro— y en Google One es un
   * fallo de bulto: son cinco radiales y la primera parada es el rojo, así que
   * la barra saldría rosa sobre un fondo casi blanco.
   */
  chromeBg?: string;
  /**
   * Color de abajo, cuando tampoco se puede sacar de la última parada. Mismo
   * caso que `chromeBg`: capas apiladas, o radiales.
   */
  abajo?: string;
} & (
  | { modelo: "color"; fondo: string | [string, string] }
  | { modelo: "negro"; fondo: string; luz: string }
  | { modelo: "claro"; fondo: string; tinte: string }
  /**
   * B2 — velo + espectro, sin blend.
   *
   * El plata de HBO Max es tornasol DE LADO A LADO y además tiene que subir de
   * abajo: son dos direcciones a la vez y un solo `linear-gradient` solo puede
   * ir en una. Van dos degradados en la misma propiedad: abajo el espectro en
   * su dirección, y encima un velo del casi-negro de la marca que se adelgaza
   * hacia abajo. La transparencia va en las paradas (`rgba(…, .84)`), nunca en
   * `opacity`, que apaga la capa entera pareja.
   *
   * Va como capa de FONDO y sin blend: el degradado de abajo es opaco, así que
   * el compuesto también lo es, y `screen(#000000, X) = X`. Meterlo en una capa
   * de luz daría exactamente lo mismo con una capa y un blend de más.
   */
  | { modelo: "espectro"; fondo: string }
);

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
   * Tinta de las letras que van DIRECTO sobre el fondo de la ficha.
   *
   * No se copia del logotipo: se decide por el fondo que tienen detrás, con
   * APCA en cinco puntos a lo ancho de cada renglón. Y como el fondo está fijo a
   * la pantalla, en cuatro fichas no alcanza una sola tinta para todo el alto y
   * hay que partirla por una línea de corte, en % de la capa de fondo.
   */
  tintaPagina?: TintaPagina;
  /**
   * La tarjeta de oferta: el panel donde van los renglones de cada perfil.
   *
   * El fondo es el color SECUNDARIO del logotipo con transparencia, y nada más.
   * Secundario es el segundo color de la marca, no el del campo: Netflix tiene
   * campo negro y marca roja, así que su tarjeta es roja; Amazon Music tiene
   * campo turquesa y letras negras, así que la suya es negra.
   *
   * Como el panel es semitransparente y las capas de fondo están fijas a la
   * pantalla, en cada punto se ve `secundario × α + fondo × (1 − α)`: el panel
   * cambia de tono conforme se scrollea. Ese efecto es el de Disney+ y es el
   * que se quiere; volverlo sólido lo rompe.
   */
  tarjeta?: {
    /** El segundo color del logotipo. */
    secundario: string;
    /**
     * Cuánto del secundario se ve.
     *
     * Disney+ va al .745, que funciona sobre un fondo de color medio. Sobre
     * casi negro, al .745 una tarjeta blanca se vería gris sucia y el rojo de
     * Netflix se vería vino: por eso ahí sube a entre .86 y .94.
     */
    alfa: number;
    /** Tinta de las letras de dentro. FIJA por ficha: no cambia por zona. */
    tinta: "blanca" | "oscura";
    /**
     * Alfa del texto secundario, en el COLOR y nunca en `opacity`, que apagaría
     * también el nombre y el precio. .85 sobre color saturado —sobre un rojo o
     * un verde vivo el blanco al .68 se hunde— y .68 en el resto.
     */
    alfa2: number;
    /**
     * Color del precio de la fila destacada, cuando el acento de marca no se
     * lee sobre la tarjeta. Solo Plex: su dorado sobre #F0F0F0 da Lc 35.
     */
    precio?: string;
  };
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

/*
 * Fondos que comparten DOS fichas.
 *
 * Un solo objeto referenciado por las dos, no dos copias: así nunca pueden
 * quedar distintas por un descuido al editar una y olvidar la otra.
 */

/** Canva EDU y Canva PRO. Lo único que cambia entre ellas es la palabra. */
const FICHA_CANVA: Ficha = {
  modelo: "color",
  // La parada del 0 % es la ESQUINA superior izquierda (#00C4CC), no lo que
  // queda bajo la barra: a media anchura el fondo ya va en #0CB5CE y en la
  // esquina derecha en #18A7D1, hasta 29 de diferencia en el verde.
  chromeBg: "#0CB5CE",
  // 154deg y no `to bottom right`: la palabra clave obliga a las otras dos
  // esquinas al 50 %, y en una pantalla alta eso deja el degradado corriendo de
  // lado, a unos 116deg. Con ángulo, el 0 % cae en la esquina de arriba a la
  // izquierda y el 100 % en la de abajo a la derecha, como en la tarjeta.
  fondo: "linear-gradient(154deg, #00C4CC 0%, #3E77D9 50%, #7D2AE7 100%)",
};

/**
 * Tidal, y con ella Apple TV y Fox One.
 *
 * Un solo objeto para las tres: así no pueden quedar distintas por editar una y
 * olvidar las otras, que es justo lo que pediste. La rampa sale del render de
 * Tidal de hoy, no de hex medidos en una captura de celular.
 */
const FICHA_TIDAL: Ficha = {
  modelo: "color",
  chromeBg: "#0B0B0B",
  abajo: "#313131",
  fondo:
    "linear-gradient(to bottom, transparent 0%, transparent 62%, color-mix(in srgb, var(--color-background) 12%, transparent) 88%, color-mix(in srgb, var(--color-background) 20%, transparent) 100%), linear-gradient(172deg, #0B0B0B 0%, #0B0B0C 18%, #0B0B0C 39%, #0B0B0C 61%, #1B1B1C 82%, #313131 100%)",
};

/** ChatGPT y CapCut: el mismo negro con un poco más de luz blanca abajo. */
const FICHA_CHATGPT: Ficha = {
  modelo: "negro",
  fondo: "#000000",
  luz: "linear-gradient(170deg, #0B0B0B 0%, #0B0B0B 56%, #131313 68%, #1F1F1F 80%, #2C2C2C 91%, #383838 100%)",
};

function spec(s: Spec): Brand {
  return {
    ...(s.logo ? { logo: s.logo } : {}),
    ...(s.secondary ? { secondary: s.secondary } : {}),
    ...(s.deepEnd ? { deepEnd: s.deepEnd } : {}),
    ...(s.ficha ? { ficha: s.ficha } : {}),
    ...(s.tarjeta ? { tarjeta: s.tarjeta } : {}),
    ...(s.tintaPagina ? { tintaPagina: s.tintaPagina } : {}),
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
      /*
       * Modelo B. La capa sólida daba #4D0207 parejo en toda la pantalla: vino,
       * y sin rastro del negro de Netflix. Ahora es una RAMPA: la mitad de
       * arriba se queda en el casi-negro cálido de la marca y la luz roja sube
       * en la mitad de abajo hasta #CA0C12, que es su #E50914 con el brillo
       * apenas bajado para que no se coma los precios.
       */
      ficha: {
        modelo: "negro",
        fondo: "#000000",
        luz: "linear-gradient(170deg, #160605 0%, #160605 50%, #240604 62%, #430303 74%, #770205 86%, #CA0C12 100%)",
      },
      tarjeta: { secundario: "#E50914", alfa: 0.9, tinta: "blanca", alfa2: 0.85 },
      tintaPagina: "blanca",
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
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: { arriba: "blanca", abajo: "oscura", corte: 76 },
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
      /*
       * Modelo B2. El plata de HBO Max es tornasol de lado a lado —cálido a la
       * izquierda, lila en medio, frío a la derecha— y además sube de abajo.
       * Son dos direcciones a la vez, así que van dos degradados: el espectro a
       * 90deg y encima el velo de su negro #0A0B0D, que se adelgaza hacia
       * abajo. La capa sólida daba #2E3346 parejo: gris azulado.
       */
      ficha: {
        modelo: "espectro",
        fondo:
          "linear-gradient(170deg, #0A0B0D 0%, #0A0B0D 50%, rgba(10,11,13,.95) 62%, rgba(10,11,13,.84) 74%, rgba(10,11,13,.62) 86%, rgba(10,11,13,.30) 95%, rgba(10,11,13,.12) 100%), linear-gradient(90deg, #8D8386 0%, #87848E 50%, #798898 100%)",
      },
      tarjeta: { secundario: "#CED7E1", alfa: 0.92, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      /*
       * Modelo A: el color de la tarjeta del catálogo, medido en pantalla. La
       * ficha tenía #00A8E1 y la tarjeta mide #0779FF plano en las cuatro
       * esquinas y en los cuatro medios (el centro es el blanco del logotipo y
       * el borde de arriba lo aclara el `skylight` a #097AFF). Adentro tiene
       * que ser idéntico a afuera.
       */
      ficha: { modelo: "color", fondo: "#0779FF" },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      tarjeta: { secundario: "#FFFFFF", alfa: 0.92, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      // La capa sólida daba #2E2E30 parejo: gris, no negro. Va al MISMO objeto
      // que Tidal, que es la referencia de negro de verdad.
      ficha: FICHA_TIDAL,
      tarjeta: { secundario: "#FFFFFF", alfa: 0.92, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      tarjeta: { secundario: "#FFFFFF", alfa: 0.88, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      /*
       * Modelo A: el degradado de la tarjeta, con sus mismas paradas. La ficha
       * iba de un naranja plano a un rojo y se veía demasiado vivo y parejo; la
       * tarjeta es difuminada, del rosa #FE616C en la esquina de arriba a la
       * izquierda al naranja #FE551B en la de abajo a la derecha (medido).
       *
       * 135deg en la tarjeta, que es casi cuadrada, se pasa a 154deg en la
       * pantalla alta: con `to bottom right` CSS forzaría las otras dos esquinas
       * al 50 % y en 360×740 el degradado correría de lado, a unos 116deg.
       */
      ficha: {
        modelo: "color",
        // A 154deg la primera parada es la ESQUINA de arriba a la izquierda, y a
        // media anchura el fondo ya va 13 más abajo en el verde. Medido del
        // render, no inventado.
        chromeBg: "#FE5E71",
        fondo:
          "linear-gradient(154deg, #FF587E 0%, #FE5F6E 12%, #FE685D 25%, #FD6E4A 38%, #FD6E39 50%, #FD672A 62%, #FE591E 75%, #FF4A14 88%, #FF4712 100%)",
      },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.88, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      // Modelo B. Su rojo es el #DA291C de Claro, más anaranjado que el de
      // Netflix: se parecen pero no son el mismo, y la rampa no se reutiliza.
      ficha: {
        modelo: "negro",
        fondo: "#000000",
        luz: "linear-gradient(170deg, #150705 0%, #150705 50%, #220705 62%, #400805 74%, #740E07 86%, #C2271B 100%)",
      },
      tarjeta: { secundario: "#DA291C", alfa: 0.9, tinta: "blanca", alfa2: 0.85 },
      tintaPagina: "blanca",
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
      /*
       * Modelo C, el espejo del B. El tinte sólido cubría toda la pantalla de
       * rosa; la rampa deja blanco limpio en los dos tercios de arriba y el rojo
       * F1 entra como luz abajo hasta llegar a su #E10600 exacto en la orilla.
       * Rojo con blanco, no rosa.
       */
      ficha: {
        modelo: "claro",
        fondo: "#FFFFFF",
        tinte:
          "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 66%, #FFF4F1 74%, #FEC0AF 81%, #FE745E 87%, #F1301F 93%, #E10600 100%)",
      },
      tarjeta: { secundario: "#E10600", alfa: 0.94, tinta: "blanca", alfa2: 0.85 },
      tintaPagina: { arriba: "oscura", abajo: "blanca", corte: 87 },
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
      // El mismo objeto que Tidal y Apple TV.
      ficha: FICHA_TIDAL,
      tarjeta: { secundario: "#FFFFFF", alfa: 0.92, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      /*
       * Modelo A. El par #00AEEF→negro se iba a negro demasiado pronto y casi
       * toda la pantalla salía oscura. Escrito con paradas queda parejo entre
       * el azul y el negro con un 10 % más de preferencia al azul: el cian puro
       * hasta el 35 %, el punto medio de la transición en el 55 % en vez del
       * 50 %, y el negro con el último tercio.
       */
      ficha: {
        modelo: "color",
        fondo:
          "linear-gradient(180deg, #00ADEF 0%, #00ADEF 35%, #0E8BBF 45%, #055779 55%, #023248 66%, #031723 80%, #04090C 100%)",
      },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.86, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      tarjeta: { secundario: "#FFFFFF", alfa: 0.9, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      tarjeta: { secundario: "#FFFFFF", alfa: 0.72, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "oscura",
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
      tarjeta: { secundario: "#FFFFFF", alfa: 0.86, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      tarjeta: {
        secundario: "#FFFFFF",
        alfa: 0.92,
        tinta: "oscura",
        alfa2: 0.68,
        precio: "#111111",
      },
      tintaPagina: "blanca",
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
      tarjeta: { secundario: "#000000", alfa: 0.82, tinta: "blanca", alfa2: 0.68 },
      tintaPagina: "oscura",
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
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "oscura",
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
      // Modelo B. El camino viejo daba un verde grisáceo (#142016 a #203427) en
      // vez de negro. Su casi-negro lleva un toque verde y el verde entra como
      // luz desde abajo.
      ficha: {
        modelo: "negro",
        fondo: "#000000",
        luz: "linear-gradient(170deg, #040E06 0%, #040E06 50%, #021706 62%, #00290C 74%, #01481A 86%, #077932 100%)",
      },
      tarjeta: { secundario: "#1ED760", alfa: 0.9, tinta: "oscura", alfa2: 0.85 },
      tintaPagina: "blanca",
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
      // Modelo A, muestreado del logo de la tarjeta: #FB576F arriba a #D91430
      // abajo. 160deg, casi vertical con una ligera inclinación, igual que el
      // degradado del icono.
      ficha: {
        modelo: "color",
        fondo:
          "linear-gradient(160deg, #FB5A71 0%, #FB495F 20%, #FA394E 35%, #FA293E 50%, #F21F35 65%, #E41932 80%, #D5132E 100%)",
      },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.88, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      // Modelo C, igual que F1 TV pero con SU rojo: el #FE0000 del botón de
      // play. La rampa no se reutiliza entre las dos.
      ficha: {
        modelo: "claro",
        fondo: "#FFFFFF",
        tinte:
          "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 66%, #FFF4F1 74%, #FEC0AF 81%, #FE816C 87%, #FF4330 93%, #FE0000 100%)",
      },
      tarjeta: { secundario: "#FE0000", alfa: 0.94, tinta: "blanca", alfa2: 0.85 },
      tintaPagina: { arriba: "oscura", abajo: "blanca", corte: 88 },
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
      // Modelo A. Tenía demasiado blanco encima y se veía turquesa lavado. El
      // suyo, constante hasta el 60 %, con una subida mínima de profundidad al
      // final y nada de blanco.
      ficha: {
        modelo: "color",
        fondo: "linear-gradient(180deg, #25D2D9 0%, #25D2D9 60%, #4CDAE0 100%)",
      },
      tarjeta: { secundario: "#000000", alfa: 0.82, tinta: "blanca", alfa2: 0.68 },
      tintaPagina: "oscura",
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
      /*
       * Migra al camino nuevo SIN cambiar de aspecto.
       *
       * No es una rampa aproximada: son las DOS capas que pintaba el camino
       * viejo, copiadas literales —el velo encima y su campo debajo—. Aproximar
       * las dos con un solo `linear-gradient` se quedaba en 3 o 4 por canal,
       * porque el velo va a 180deg y el campo a 172, y dos direcciones distintas
       * no caben en un degradado. Copiadas, la diferencia es cero por
       * construcción.
       */
      ficha: {
        modelo: "color",
        chromeBg: "#190827",
        abajo: "#432E54",
        fondo:
          "linear-gradient(to bottom, transparent 0%, transparent 62%, color-mix(in srgb, var(--color-background) 12%, transparent) 88%, color-mix(in srgb, var(--color-background) 20%, transparent) 100%), linear-gradient(172deg, #190827 0%, #1B0929 18%, #1B0929 50%, #371355 82%, #432E54 100%)",
      },
      tarjeta: { secundario: "#A237FF", alfa: 0.9, tinta: "blanca", alfa2: 0.85 },
      tintaPagina: "blanca",
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
      /*
       * Migra al camino nuevo SIN cambiar de aspecto.
       *
       * No es una rampa aproximada: son las DOS capas que pintaba el camino
       * viejo, copiadas literales —el velo encima y su campo debajo—. Aproximar
       * las dos con un solo `linear-gradient` se quedaba en 3 o 4 por canal,
       * porque el velo va a 180deg y el campo a 172, y dos direcciones distintas
       * no caben en un degradado. Copiadas, la diferencia es cero por
       * construcción.
       */
      ficha: FICHA_TIDAL,
      tarjeta: { secundario: "#FFFFFF", alfa: 0.92, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      /*
       * Migra al camino nuevo SIN cambiar de aspecto.
       *
       * No es una rampa aproximada: son las DOS capas que pintaba el camino
       * viejo, copiadas literales —el velo encima y su campo debajo—. Aproximar
       * las dos con un solo `linear-gradient` se quedaba en 3 o 4 por canal,
       * porque el velo va a 180deg y el campo a 172, y dos direcciones distintas
       * no caben en un degradado. Copiadas, la diferencia es cero por
       * construcción.
       */
      ficha: {
        modelo: "color",
        chromeBg: "#0B0B0B",
        abajo: "#313131",
        fondo:
          "linear-gradient(to bottom, transparent 0%, transparent 62%, color-mix(in srgb, var(--color-background) 12%, transparent) 88%, color-mix(in srgb, var(--color-background) 20%, transparent) 100%), linear-gradient(172deg, #0B0B0B 0%, #0B0C0C 18%, #0B0C0C 39%, #0B0C0C 61%, #1A1C1D 82%, #313131 100%)",
      },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.92, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      /*
       * Migra al camino nuevo SIN cambiar de aspecto.
       *
       * No es una rampa aproximada: son las DOS capas que pintaba el camino
       * viejo, copiadas literales —el velo encima y su campo debajo—. Aproximar
       * las dos con un solo `linear-gradient` se quedaba en 3 o 4 por canal,
       * porque el velo va a 180deg y el campo a 172, y dos direcciones distintas
       * no caben en un degradado. Copiadas, la diferencia es cero por
       * construcción.
       */
      ficha: {
        modelo: "color",
        chromeBg: "#051E32",
        abajo: "#2A4961",
        fondo:
          "linear-gradient(to bottom, transparent 0%, transparent 62%, color-mix(in srgb, var(--color-background) 12%, transparent) 88%, color-mix(in srgb, var(--color-background) 20%, transparent) 100%), linear-gradient(172deg, #051E32 0%, #052843 18%, #052843 50%, #0A3250 82%, #2A4961 100%)",
      },
      tarjeta: { secundario: "#31A8FF", alfa: 0.9, tinta: "blanca", alfa2: 0.85 },
      tintaPagina: "blanca",
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
      // Modelo A. Rojo vivo arriba a la izquierda bajando a rojo profundo en la
      // esquina inferior derecha, como la tarjeta. 154deg, no `to bottom right`.
      ficha: {
        modelo: "color",
        fondo:
          "linear-gradient(154deg, #FB3B34 0%, #F32227 25%, #E90D20 45%, #DC011B 60%, #BF0017 78%, #930113 100%)",
      },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.88, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      // Modelo A. Un solo objeto para EDU y PRO.
      ficha: FICHA_CANVA,
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
      suffix: "Edu",
    }),
  ],
  [
    /^canva/,
    spec({
      // Modelo A. El mismo objeto que Canva EDU.
      ficha: FICHA_CANVA,
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      // Modelo B. El mismo objeto que ChatGPT.
      ficha: FICHA_CHATGPT,
      tarjeta: { secundario: "#FFFFFF", alfa: 0.92, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      // Modelo B. Un solo objeto para ChatGPT y CapCut.
      ficha: FICHA_CHATGPT,
      tarjeta: { secundario: "#FFFFFF", alfa: 0.92, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      /*
       * Migra al camino nuevo SIN cambiar de aspecto.
       *
       * No es una rampa aproximada: son las DOS capas que pintaba el camino
       * viejo, copiadas literales —el velo encima y su campo debajo—. Aproximar
       * las dos con un solo `linear-gradient` se quedaba en 3 o 4 por canal,
       * porque el velo va a 180deg y el campo a 172, y dos direcciones distintas
       * no caben en un degradado. Copiadas, la diferencia es cero por
       * construcción.
       */
      ficha: {
        modelo: "color",
        chromeBg: "#868297",
        abajo: "#C9C3DD",
        fondo:
          "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.1) 60%, rgba(255,255,255,0.18) 100%), linear-gradient(172deg, #868297 0%, #CFCAE1 18%, #CFCAE1 39%, #A2ADDD 61%, #C1A3C1 82%, #C9C3DD 100%)",
      },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.72, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "oscura",
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
      /*
       * Modelo B2. Tenía apenas un rastro de color (#22202E a #3B3846). El
       * espectro son los colores del propio icono —magenta, coral, naranja,
       * ámbar, verde y verde azulado— corriendo en diagonal a 60deg como él, y
       * el velo de su casi-negro los deja aparecer desde el 38 % hacia abajo.
       */
      ficha: {
        modelo: "espectro",
        fondo:
          "linear-gradient(170deg, #0A0A12 0%, #0A0A12 38%, rgba(10,10,18,.84) 54%, rgba(10,10,18,.60) 68%, rgba(10,10,18,.34) 82%, rgba(10,10,18,.10) 100%), linear-gradient(60deg, #CA4AA3 0%, #E55E6D 20%, #EE7834 40%, #F19B2D 52%, #29B151 70%, #179FA0 100%)",
      },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.92, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      /*
       * Migra al camino nuevo SIN cambiar de aspecto.
       *
       * No es una rampa aproximada: son las DOS capas que pintaba el camino
       * viejo, copiadas literales —el velo encima y su campo debajo—. Aproximar
       * las dos con un solo `linear-gradient` se quedaba en 3 o 4 por canal,
       * porque el velo va a 180deg y el campo a 172, y dos direcciones distintas
       * no caben en un degradado. Copiadas, la diferencia es cero por
       * construcción.
       */
      ficha: {
        modelo: "color",
        chromeBg: "#C0DDF4",
        abajo: "#99BBD4",
        fondo:
          "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.1) 60%, rgba(255,255,255,0.18) 100%), linear-gradient(172deg, #C0DDF4 0%, #C3DFF5 18%, #C3DFF5 50%, #84BEEA 82%, #99BBD4 100%)",
      },
      tarjeta: { secundario: "#0178D4", alfa: 0.94, tinta: "blanca", alfa2: 0.85 },
      tintaPagina: "oscura",
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
      /*
       * ÚNICA excepción a la prohibición de radiales: manchas suaves de los
       * cuatro colores de Google sobre blanco, fijas a la pantalla. Las franjas
       * horizontales de antes parecían una raya pintada.
       *
       * El final de cada mancha es el mismo color con alfa 0, NUNCA la palabra
       * `transparent`: hay navegadores que la leen como negro transparente y la
       * orilla se ensucia de gris. El orden tampoco se toca: el primero de la
       * lista queda encima.
       *
       * `chromeBg` va a mano porque aquí no hay `linear-gradient` del que sacar
       * una primera parada: la primera de la lista es el rojo, y la barra
       * saldría rosa sobre un fondo casi blanco.
       */
      ficha: {
        modelo: "color",
        chromeBg: "#F6F3F7",
        fondo:
          "radial-gradient(51% 25% at 17% 16%, rgba(234,67,53,.39) 0%, rgba(234,67,53,0) 100%), radial-gradient(148% 32% at 44% 22%, rgba(66,133,244,.14) 0%, rgba(66,133,244,0) 100%), radial-gradient(47% 29% at 78% 35%, rgba(52,168,83,.37) 0%, rgba(52,168,83,0) 100%), radial-gradient(82% 44% at 49% 60%, rgba(251,188,4,.34) 0%, rgba(251,188,4,0) 100%), radial-gradient(200% 13% at 95% 97%, rgba(52,168,83,.08) 0%, rgba(52,168,83,0) 100%), #FFFFFF",
      },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.72, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "oscura",
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
      // Modelo A plano: el verde del campo de su logo. Con la ficha de este
      // mismo color, el recuadro del logotipo deja de verse.
      ficha: { modelo: "color", fondo: "#77C801" },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "oscura",
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
      // Modelo A. 206deg es el espejo de 154: cian en la esquina superior
      // DERECHA y magenta en la inferior izquierda, como la tarjeta.
      ficha: {
        modelo: "color",
        fondo:
          "linear-gradient(206deg, #08F8ED 0%, #0DEBEB 28%, #2DBAE3 40%, #5282D9 50%, #7D4DCF 60%, #9A32CB 72%, #B31CC6 84%, #C80CC2 100%)",
      },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: { arriba: "oscura", abajo: "blanca", corte: 41 },
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
      // Modelo A plano. El verde lavado de antes se iba a gris.
      ficha: { modelo: "color", fondo: "#0C874A" },
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
      tintaPagina: "blanca",
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
      // Campo de color con marca blanca, como Prime Video o Paramount+: el
      // blurple plano, sin capa de luz, sin degradado y sin mezcla con negro.
      // El #5765F2 que mide el archivo es este mismo con un punto de menos en
      // el rojo, de la compresión del webp.
      ficha: { modelo: "color", fondo: "#5865F2" },
      tintaPagina: "blanca",
      tarjeta: { secundario: "#FFFFFF", alfa: 0.745, tinta: "oscura", alfa2: 0.68 },
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
  /**
   * Los tres tokens de la tarjeta de oferta, ya resueltos. `null` en las
   * categorías que aún no migran, que se quedan con el vidrio del sistema.
   */
  tarjeta: { bg: string; tinta: string; tinta2: string; precio: string | null } | null;
  /** Tinta de página, o `null` en las categorías que aún no migran. */
  tintaPagina: TintaPagina | null;
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
/**
 * Corta una lista CSS por las comas de PRIMER nivel.
 *
 * Ni `split(",")` ni una expresión regular sirven: las paradas de un degradado
 * y los canales de un `rgba()` también van separados por comas.
 */
function porComas(css: string): string[] {
  const out: string[] = [];
  let hondo = 0;
  let buf = "";
  for (const ch of css) {
    if (ch === "(") hondo += 1;
    if (ch === ")") hondo -= 1;
    if (ch === "," && hondo === 0) {
      out.push(buf.trim());
      buf = "";
    } else buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** Los colores de un valor de `background`, en orden. */
function colores(css: string): string[] {
  return css.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) ?? [];
}

/**
 * El color de arriba y el de abajo de un fondo.
 *
 * Cuando hay varias capas apiladas manda la PRIMERA de la lista, que es la que
 * queda encima: en el modelo espectro esa es el velo, y tomar el primer color
 * de todo el string agarraría el del espectro de debajo y se equivocaría.
 */
function extremos(css: string): { top: string; bottom: string } {
  const primera = porComas(css)[0] ?? css;
  const cs = colores(primera);
  const top = cs[0] ?? css;
  const bottom = cs[cs.length - 1] ?? top;
  return { top, bottom };
}

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
  /*
   * Componer un extremo.
   *
   * Con una capa sólida basta la fórmula; con una rampa hay que componer cada
   * extremo por separado. Sobre negro puro `screen` devuelve exactamente la
   * rampa (`1-(1-0)(1-b) = b`) y sobre blanco puro `multiply` también
   * (`1 × b = b`), así que en la práctica los extremos SON los de la rampa;
   * la cuenta se hace igual por si algún fondo deja de ser puro.
   */
  const componer = (capa: string, f: (a: string, b: string) => string, fondo: string) => {
    const { top, bottom } = extremos(capa);
    return { top: f(fondo, top), bottom: f(fondo, bottom) };
  };

  if (ficha.modelo === "negro") {
    const { top, bottom } = componer(ficha.luz, screenHex, ficha.fondo);
    return {
      top: ficha.chromeBg ?? top,
      bottom,
      background: ficha.fondo,
      blend: { color: ficha.luz, mode: "screen" },
    };
  }

  if (ficha.modelo === "claro") {
    const { top, bottom } = componer(ficha.tinte, multiplyHex, ficha.fondo);
    return {
      top: ficha.chromeBg ?? top,
      bottom,
      background: ficha.fondo,
      blend: { color: ficha.tinte, mode: "multiply" },
    };
  }

  if (ficha.modelo === "espectro") {
    // Arriba manda el velo, que ahí es opaco. Abajo el velo casi no existe, así
    // que lo que se ve es el último color del espectro, o sea del SEGUNDO
    // degradado de la lista.
    const capas = porComas(ficha.fondo);
    const velo = colores(capas[0] ?? ficha.fondo);
    const espectro = colores(capas[1] ?? capas[0] ?? ficha.fondo);
    return {
      top: ficha.chromeBg ?? velo[0] ?? "#000000",
      bottom: espectro[espectro.length - 1] ?? velo[velo.length - 1] ?? "#000000",
      background: ficha.fondo,
      blend: null,
    };
  }

  const { fondo } = ficha;
  if (typeof fondo === "string") {
    // Puede ser un hex plano o un degradado entero escrito a mano.
    const { top, bottom } = fondo.includes("gradient(")
      ? extremos(fondo)
      : { top: fondo, bottom: fondo };
    return {
      top: ficha.chromeBg ?? top,
      bottom: ficha.abajo ?? bottom,
      background: fondo,
      blend: null,
    };
  }
  const [top, bottom] = fondo;
  // 180°, recto de arriba abajo. El grado y pico de inclinación de un modelo
  // anterior es lo que hacía que la luz «entrara por la izquierda», que es la
  // queja literal en HBO Max y en Fox One.
  return {
    top: ficha.chromeBg ?? top,
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
    tintaPagina: hero ? (brand.tintaPagina ?? null) : null,
    tarjeta:
      hero && brand.tarjeta
        ? {
            bg: rgba(brand.tarjeta.secundario, brand.tarjeta.alfa),
            tinta: brand.tarjeta.tinta === "blanca" ? "#FFFFFF" : "#111111",
            tinta2: rgba(
              brand.tarjeta.tinta === "blanca" ? "#FFFFFF" : "#111111",
              brand.tarjeta.alfa2,
            ),
            precio: brand.tarjeta.precio ?? null,
          }
        : null,
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
