import type { SymbolId } from "@/components/brand-symbols";

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
};

type Spec = Partial<Brand> & { bg: string; ink: string };

const W = "#FFFFFF";

function spec(s: Spec): Brand {
  return {
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
 */
const BRANDS: Array<[RegExp, Brand]> = [
  // ── Streaming ──────────────────────────────────────────────────────────
  [
    /^netflix/,
    spec({
      bg: "#000000",
      ink: "#E50914",
      accent: "#E50914",
      wash: 0.3,
      font: "grotesk",
      weight: 800,
      upper: true,
      tracking: "-0.005em",
      symbol: "netflix",
      symbolScale: 0.6,
      maxLines: 1,
    }),
  ],
  [
    // El logotipo actual es negro con las letras en blanco iridiscente; el azul
    // de 2023 ya no se usa. La guía de marca pide fondo oscuro con degradado
    // radial, que es justo lo que compone `brandSkin`.
    /^hbo|^max\b/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      inkGrad: "linear-gradient(96deg,#FFFFFF,#DCE4F2 42%,#F7EDE2 70%,#FFFFFF)",
      accent: "#9FB2CE",
      wash: 0.17,
      font: "grotesk",
      weight: 600,
      tracking: "-0.045em",
      label: "HBO Max",
      maxLines: 1,
    }),
  ],
  [
    /^disney/,
    spec({
      bg: "linear-gradient(168deg,#12266B,#050C2E 62%,#01061B)",
      ink: "#FFFFFF",
      accent: "#3DA9FF",
      wash: 0.26,
      font: "script",
      weight: 400,
      tracking: "0em",
      suffix: "+",
    }),
  ],
  [
    /^prime video|^amazon prime/,
    spec({
      bg: "#0B1620",
      ink: "#FFFFFF",
      accent: "#00A8E1",
      wash: 0.3,
      font: "geometric",
      weight: 600,
      tracking: "-0.025em",
      symbol: "primeSmile",
      symbolInk: "#00A8E1",
      symbolScale: 0.62,
      label: "prime video",
    }),
  ],
  [
    /^paramount/,
    spec({
      bg: "#0064FF",
      ink: "#FFFFFF",
      accent: "#8FC3FF",
      wash: 0.2,
      font: "grotesk",
      weight: 700,
      tracking: "-0.035em",
      symbol: "paramount",
      symbolScale: 0.94,
      suffix: "+",
    }),
  ],
  [
    /^peacock/,
    spec({
      bg: "#FFFFFF",
      ink: "#000000",
      accent: "#6460AA",
      wash: 0.09,
      font: "grotesk",
      weight: 600,
      tracking: "-0.045em",
      symbol: "peacock",
      symbolScale: 0.92,
      light: true,
    }),
  ],
  [
    /^apple tv/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#B7B7BE",
      wash: 0.12,
      font: "grotesk",
      weight: 500,
      tracking: "-0.055em",
      symbol: "apple",
      symbolScale: 0.72,
      label: "tv",
      suffix: "+",
    }),
  ],
  [
    /^crunchyroll/,
    spec({
      bg: "#F47521",
      ink: "#FFFFFF",
      accent: "#FFC79A",
      wash: 0.16,
      font: "grotesk",
      weight: 700,
      tracking: "-0.04em",
      symbol: "crunchyroll",
      symbolHole: "#F47521",
      symbolScale: 0.74,
    }),
  ],
  [
    // Las letras llevan el degradado naranja de la marca; el lila anterior era
    // un invento. No pude confirmar las paradas exactas en una fuente oficial.
    /^vix/,
    spec({
      bg: "#08060A",
      ink: "#FF6A00",
      inkGrad: "linear-gradient(96deg,#FFB300,#FF6A00 48%,#F5002E)",
      accent: "#FF6A00",
      wash: 0.3,
      font: "grotesk",
      weight: 800,
      tracking: "-0.05em",
    }),
  ],
  [
    /^claro/,
    spec({
      bg: "#E30613",
      ink: "#FFFFFF",
      accent: "#FFC9CD",
      wash: 0.14,
      font: "geometric",
      weight: 600,
      tracking: "-0.03em",
      symbol: "claroSwoosh",
      symbolScale: 0.62,
    }),
  ],
  [
    /^formula 1|^f1\b/,
    spec({
      bg: "#15151E",
      ink: "#FFFFFF",
      accent: "#FF1801",
      wash: 0.3,
      font: "condensed",
      weight: 700,
      upper: true,
      italic: true,
      tracking: "0.02em",
      symbol: "f1",
      symbolInk: "#FF1801",
      symbolScale: 0.6,
      label: "F1 TV",
      maxLines: 1,
    }),
  ],
  [
    // No pude confirmar la paleta oficial de Fox One; se usa el negro y el azul
    // corporativo de FOX.
    /^fox/,
    spec({
      bg: "#0A0A0C",
      ink: "#FFFFFF",
      accent: "#0C4DA2",
      wash: 0.26,
      font: "grotesk",
      weight: 800,
      upper: true,
      tracking: "0.02em",
    }),
  ],
  [
    // No pude confirmar la paleta oficial de HIDIVE.
    /^hidive/,
    spec({
      bg: "#08090D",
      ink: "#28B3F0",
      accent: "#28B3F0",
      wash: 0.24,
      font: "grotesk",
      weight: 800,
      upper: true,
      tracking: "0.01em",
    }),
  ],
  [
    // IPTV no es una marca sino una categoría: se le da identidad propia —
    // pantalla y ondas de señal sobre pizarra fría, sin imitar a nadie.
    /^iptv/,
    spec({
      bg: "linear-gradient(165deg,#0D2E37,#071B22 64%,#041015)",
      ink: "#7BE6D2",
      accent: "#31C9C0",
      wash: 0.24,
      font: "condensed",
      weight: 600,
      upper: true,
      tracking: "0.2em",
      symbol: "iptv",
      symbolScale: 0.8,
    }),
  ],
  [
    // No pude confirmar la paleta oficial de KOCOWA.
    /^kocowa/,
    spec({
      bg: "#12061F",
      ink: "#FFFFFF",
      accent: "#8B3DFF",
      wash: 0.32,
      font: "grotesk",
      weight: 800,
      upper: true,
      tracking: "-0.02em",
    }),
  ],
  [
    /^mlb/,
    spec({
      bg: "#002D72",
      ink: "#FFFFFF",
      accent: "#D50032",
      wash: 0.24,
      font: "grotesk",
      weight: 800,
      upper: true,
      tracking: "-0.01em",
      symbol: "mlb",
      symbolScale: 0.66,
    }),
  ],
  [
    // MUBI es blanco y negro; no pude confirmar un acento oficial.
    /^mubi/,
    spec({
      bg: "#0A0A0A",
      ink: "#FFFFFF",
      accent: "#C8C8CE",
      wash: 0.1,
      font: "grotesk",
      weight: 500,
      upper: true,
      tracking: "0.2em",
      maxLines: 1,
    }),
  ],
  [
    /^plex/,
    spec({
      bg: "#1F2326",
      ink: "#E5A00D",
      accent: "#E5A00D",
      wash: 0.26,
      font: "geometric",
      weight: 600,
      upper: true,
      tracking: "0.14em",
      symbol: "plex",
      symbolInk: "#E5A00D",
      symbolScale: 0.66,
    }),
  ],
  [
    // No pude confirmar la paleta oficial de Universal+; se usa el azul y el
    // globo de Universal.
    /^universal/,
    spec({
      bg: "#071A45",
      ink: "#FFFFFF",
      accent: "#5B8FD6",
      wash: 0.24,
      font: "grotesk",
      weight: 600,
      upper: true,
      tracking: "0.06em",
      symbol: "universal",
      symbolScale: 0.82,
      suffix: "+",
    }),
  ],
  [
    // Viki: azul Rakuten. No pude confirmar el hex exacto.
    /^viki/,
    spec({
      bg: "#04121C",
      ink: "#FFFFFF",
      accent: "#00A8E0",
      wash: 0.3,
      font: "geometric",
      weight: 700,
      tracking: "-0.04em",
      label: "viki",
    }),
  ],
  [
    // iQIYI: verde corporativo. No pude confirmar el hex exacto.
    /^iqiyi/,
    spec({
      bg: "#00BE06",
      ink: "#FFFFFF",
      accent: "#B6F5B8",
      wash: 0.14,
      font: "geometric",
      weight: 700,
      tracking: "-0.04em",
      label: "iQIYI",
    }),
  ],

  // ── Música ─────────────────────────────────────────────────────────────
  [
    /^spotify/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#1ED760",
      wash: 0.34,
      font: "geometric",
      weight: 700,
      tracking: "-0.045em",
      symbol: "spotify",
      symbolInk: "#1ED760",
      symbolHole: "#000000",
      symbolScale: 0.8,
    }),
  ],
  [
    /^apple music/,
    spec({
      bg: "linear-gradient(150deg,#FB5C74,#FA233B 58%,#C7112B)",
      ink: "#FFFFFF",
      accent: "#FFC2CA",
      wash: 0.12,
      font: "grotesk",
      weight: 500,
      tracking: "-0.05em",
      symbol: "appleMusic",
      symbolScale: 0.66,
      label: "Music",
    }),
  ],
  [
    /^youtube/,
    spec({
      bg: "#0F0F0F",
      ink: "#FFFFFF",
      accent: "#FF0033",
      wash: 0.24,
      font: "grotesk",
      weight: 700,
      tracking: "-0.05em",
      symbol: "youtubePlay",
      symbolInk: "#FF0033",
      symbolHole: "#0F0F0F",
      symbolScale: 0.6,
      label: "YouTube",
      suffix: "Premium",
    }),
  ],
  [
    /^amazon music/,
    spec({
      bg: "linear-gradient(155deg,#2ED2F5,#0A84D6 62%,#06407A)",
      ink: "#FFFFFF",
      accent: "#B6ECFB",
      wash: 0.12,
      font: "geometric",
      weight: 600,
      tracking: "-0.035em",
      symbol: "amazonMusicNote",
      symbolScale: 0.6,
      label: "music",
    }),
  ],
  [
    /^deezer/,
    spec({
      bg: "#0B0B0F",
      ink: "#FFFFFF",
      accent: "#A238FF",
      wash: 0.3,
      font: "geometric",
      weight: 700,
      tracking: "-0.04em",
      symbol: "deezerBars",
      symbolInk: "#A238FF",
      symbolScale: 0.72,
    }),
  ],
  [
    // Negro con blanco, sin adornos: el logotipo de Tidal es exactamente eso.
    /^tidal/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#D3D8DE",
      wash: 0.08,
      font: "grotesk",
      weight: 400,
      upper: true,
      tracking: "0.3em",
      maxLines: 1,
    }),
  ],
  [
    // No pude confirmar la paleta oficial de Qobuz.
    /^qobuz/,
    spec({
      bg: "#0B1B2E",
      ink: "#8FC0F0",
      accent: "#4A8FD6",
      wash: 0.22,
      font: "geometric",
      weight: 600,
      tracking: "-0.02em",
      symbol: "qobuz",
      symbolScale: 0.58,
    }),
  ],

  // ── Diseño e IA ────────────────────────────────────────────────────────
  [
    /^photoshop/,
    spec({
      bg: "#001E36",
      ink: "#31A8FF",
      accent: "#31A8FF",
      wash: 0.2,
      font: "grotesk",
      weight: 600,
      tracking: "-0.04em",
    }),
  ],
  [
    /^adobe/,
    spec({
      bg: "#08080A",
      ink: "#FFFFFF",
      accent: "#FA0F00",
      wash: 0.3,
      font: "grotesk",
      weight: 700,
      tracking: "-0.05em",
      symbol: "adobeA",
      symbolInk: "#FA0F00",
      symbolScale: 0.72,
    }),
  ],
  [
    /^canva edu/,
    spec({
      bg: "linear-gradient(148deg,#00C4CC,#4B6BE8 52%,#7D2AE8)",
      ink: "#FFFFFF",
      accent: "#B7F2F5",
      wash: 0.1,
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
      bg: "linear-gradient(148deg,#00C4CC,#5C46E0 55%,#7D2AE8)",
      ink: "#FFFFFF",
      accent: "#9FEDF2",
      wash: 0.1,
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
      bg: "#0E0E14",
      ink: "#FFFFFF",
      accent: "#3DE7F0",
      wash: 0.26,
      font: "geometric",
      weight: 700,
      tracking: "-0.045em",
      symbol: "capcut",
      symbolScale: 0.62,
      label: "CapCut",
      suffix: "Pro",
    }),
  ],
  [
    /^chatgpt|^openai/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#8FA8A2",
      wash: 0.12,
      font: "grotesk",
      weight: 600,
      tracking: "-0.035em",
      symbol: "openai",
      symbolScale: 0.7,
    }),
  ],
  [
    /^claude|^anthropic/,
    spec({
      bg: "#0F0D0B",
      ink: "#FFFFFF",
      accent: "#D97757",
      wash: 0.32,
      font: "serif",
      weight: 500,
      tracking: "-0.02em",
      symbol: "geminiSpark",
      symbolScale: 0.6,
    }),
  ],
  [
    /^gemini/,
    spec({
      bg: "#0A0D17",
      ink: "#9AB6FF",
      inkGrad: "linear-gradient(96deg,#5B8DFF,#A57BFF 58%,#E0708F)",
      accent: "#7C8FFF",
      wash: 0.26,
      font: "geometric",
      weight: 500,
      tracking: "-0.03em",
      symbol: "geminiSpark",
      symbolScale: 0.58,
    }),
  ],
  [
    /^office|^microsoft 365|^m365/,
    spec({
      bg: "#141416",
      ink: "#FFFFFF",
      accent: "#00A4EF",
      wash: 0.2,
      font: "grotesk",
      weight: 600,
      tracking: "-0.04em",
      symbol: "microsoft",
      symbolScale: 0.62,
    }),
  ],
  [
    /onedrive/,
    spec({
      bg: "#0364B8",
      ink: "#FFFFFF",
      accent: "#9BD3F5",
      wash: 0.16,
      font: "grotesk",
      weight: 600,
      tracking: "-0.035em",
      symbol: "onedrive",
      symbolScale: 0.62,
      label: "OneDrive",
    }),
  ],
  [
    /almacenamiento google|google drive|google one/,
    spec({
      bg: "#101116",
      ink: "#FFFFFF",
      accent: "#4688F1",
      wash: 0.22,
      font: "geometric",
      weight: 500,
      tracking: "-0.03em",
      symbol: "googleDrive",
      symbolScale: 0.64,
      label: "Google Drive",
    }),
  ],
  [
    /^duolingo/,
    spec({
      bg: "#58CC02",
      ink: "#FFFFFF",
      accent: "#C6F5A0",
      wash: 0.14,
      font: "geometric",
      weight: 800,
      tracking: "-0.03em",
      symbol: "duolingoOwl",
      symbolHole: "#FFFFFF",
      symbolScale: 0.72,
    }),
  ],
  [
    /^picsart/,
    spec({
      bg: "linear-gradient(150deg,#F0347E,#B026C9 55%,#6C1BD1)",
      ink: "#FFFFFF",
      accent: "#FFB3D4",
      wash: 0.1,
      font: "geometric",
      weight: 700,
      tracking: "-0.045em",
      symbol: "picsart",
      symbolScale: 0.58,
    }),
  ],
  [
    // No pude confirmar el hex oficial de Scribd; se usa su verde azulado.
    /^scribd/,
    spec({
      bg: "#0B2E33",
      ink: "#FFFFFF",
      accent: "#1E9E92",
      wash: 0.28,
      font: "grotesk",
      weight: 600,
      tracking: "-0.04em",
      symbol: "scribd",
      symbolScale: 0.58,
    }),
  ],

  // ── Otros ──────────────────────────────────────────────────────────────
  [
    /^discord/,
    spec({
      bg: "#5865F2",
      ink: "#FFFFFF",
      accent: "#C3C8FF",
      wash: 0.14,
      font: "geometric",
      weight: 700,
      tracking: "-0.035em",
      symbol: "discord",
      symbolHole: "#5865F2",
      symbolScale: 0.66,
      label: "Discord",
      suffix: "Nitro",
    }),
  ],
  [
    /^free fire/,
    spec({
      bg: "#111318",
      ink: "#FFFFFF",
      accent: "#FF7A00",
      wash: 0.32,
      font: "condensed",
      weight: 700,
      upper: true,
      italic: true,
      tracking: "0.02em",
      symbol: "flame",
      symbolInk: "#FF7A00",
      symbolHole: "#111318",
      symbolScale: 0.6,
      label: "Free Fire",
    }),
  ],
  [
    /^nordvpn|^nord/,
    spec({
      bg: "#0A1226",
      ink: "#FFFFFF",
      accent: "#4687FF",
      wash: 0.3,
      font: "geometric",
      weight: 600,
      tracking: "-0.035em",
      symbol: "shield",
      symbolInk: "#4687FF",
      symbolScale: 0.58,
    }),
  ],
  [
    /^surfshark/,
    spec({
      bg: "#0A2634",
      ink: "#FFFFFF",
      accent: "#20C5C5",
      wash: 0.3,
      font: "geometric",
      weight: 600,
      tracking: "-0.04em",
      symbol: "sharkFin",
      symbolInk: "#20C5C5",
      symbolScale: 0.6,
    }),
  ],
  [
    /^expressvpn|^express vpn/,
    spec({
      bg: "#C7222A",
      ink: "#FFFFFF",
      accent: "#FFB3B6",
      wash: 0.14,
      font: "geometric",
      weight: 600,
      tracking: "-0.04em",
      symbol: "pin",
      symbolScale: 0.56,
    }),
  ],
  [
    /^avira/,
    spec({
      bg: "#0E1319",
      ink: "#FFFFFF",
      accent: "#E2001A",
      wash: 0.28,
      font: "geometric",
      weight: 600,
      tracking: "-0.03em",
      symbol: "umbrella",
      symbolInk: "#E2001A",
      symbolScale: 0.58,
    }),
  ],
  [
    /^bitdefender/,
    spec({
      bg: "#0C1017",
      ink: "#FFFFFF",
      accent: "#ED1C24",
      wash: 0.28,
      font: "grotesk",
      weight: 600,
      tracking: "-0.04em",
      symbol: "shield",
      symbolInk: "#ED1C24",
      symbolScale: 0.56,
    }),
  ],
  [
    // Wordmark de dos bloques: «Porn» en blanco y «hub» sobre naranja.
    /^pornhub/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#FF9900",
      wash: 0.22,
      font: "grotesk",
      weight: 800,
      tracking: "-0.05em",
      label: "Porn",
      suffix: "hub",
      suffixBg: "#FF9900",
      suffixInk: "#000000",
    }),
  ],
  [
    /^brazzers/,
    spec({
      bg: "#000000",
      ink: "#FFFFFF",
      accent: "#9A9AA4",
      wash: 0.1,
      font: "grotesk",
      weight: 800,
      upper: true,
      tracking: "-0.02em",
    }),
  ],
  [
    /^onlyfans/,
    spec({
      bg: "#00AFF0",
      ink: "#FFFFFF",
      accent: "#B3E8FB",
      wash: 0.14,
      font: "geometric",
      weight: 600,
      tracking: "-0.04em",
      symbol: "infinity",
      symbolScale: 0.5,
      label: "OnlyFans",
    }),
  ],
  [
    /^smart fit|^smartfit/,
    spec({
      bg: "#FFD400",
      ink: "#101010",
      accent: "#7A5E00",
      wash: 0.1,
      font: "grotesk",
      weight: 800,
      upper: true,
      italic: true,
      tracking: "-0.02em",
      symbol: "dumbbell",
      symbolScale: 0.56,
      light: true,
    }),
  ],
  [
    /^cine/,
    spec({
      bg: "#12141C",
      ink: "#F2C260",
      accent: "#E8A33A",
      wash: 0.24,
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
      wash: 0.22,
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
const OWN: Array<[RegExp, Brand]> = [
  [
    /^pagos de servicios/,
    spec({
      bg: "#241A05",
      ink: "#FFC94D",
      accent: "#F0A81E",
      wash: 0.2,
      symbol: "card",
      symbolScale: 0.56,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^compras con descuento/,
    spec({
      bg: "#280C21",
      ink: "#FF9AD5",
      accent: "#D95FA8",
      wash: 0.2,
      symbol: "bag",
      symbolScale: 0.56,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^abonos|liquidacion de creditos/,
    spec({
      bg: "#20200A",
      ink: "#E6D65F",
      accent: "#C9B63E",
      wash: 0.2,
      symbol: "coins",
      symbolScale: 0.56,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^recargas/,
    spec({
      bg: "#0B2440",
      ink: "#8FC8FF",
      accent: "#4A90E2",
      wash: 0.22,
      symbol: "phone",
      symbolScale: 0.5,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^comida/,
    spec({
      bg: "#26110A",
      ink: "#FFA870",
      accent: "#E4713A",
      wash: 0.22,
      symbol: "cutlery",
      symbolScale: 0.52,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^hospedaje|boletos y viajes/,
    spec({
      bg: "#05222F",
      ink: "#74DCF5",
      accent: "#2EAFD4",
      wash: 0.22,
      symbol: "plane",
      symbolScale: 0.54,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^seguro de autos/,
    spec({
      bg: "#0C1D3D",
      ink: "#93B4FF",
      accent: "#4C74D9",
      wash: 0.22,
      symbol: "carShield",
      symbolScale: 0.56,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^videojuegos/,
    spec({
      bg: "#1C0E3C",
      ink: "#BCA6FF",
      accent: "#7B5CE6",
      wash: 0.24,
      symbol: "gamepad",
      symbolScale: 0.56,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^peliculas|libros y pdf/,
    spec({
      bg: "#251034",
      ink: "#DCB8FF",
      accent: "#8B5CD6",
      wash: 0.22,
      symbol: "book",
      symbolScale: 0.54,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^bots para grupos/,
    spec({
      bg: "#05231D",
      ink: "#7FEBC4",
      accent: "#25B98C",
      wash: 0.22,
      symbol: "bot",
      symbolScale: 0.54,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^seguidores/,
    spec({
      bg: "#2A0A1A",
      ink: "#FF9DBA",
      accent: "#E05580",
      wash: 0.22,
      symbol: "users",
      symbolScale: 0.54,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^numeros virtuales/,
    spec({
      bg: "#101E29",
      ink: "#9BD9EC",
      accent: "#4FA8C4",
      wash: 0.22,
      symbol: "hash",
      symbolScale: 0.5,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^recuperacion de cuentas/,
    spec({
      bg: "#271C06",
      ink: "#F5CE7B",
      accent: "#D0A23C",
      wash: 0.22,
      symbol: "key",
      symbolScale: 0.52,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^paneles y metodos/,
    spec({
      bg: "#151527",
      ink: "#B4B4FF",
      accent: "#6E6EE0",
      wash: 0.24,
      symbol: "grid",
      symbolScale: 0.52,
      font: "display",
      weight: 600,
    }),
  ],
  [
    /^robux|pavos/,
    spec({
      bg: "#111318",
      ink: "#E9EBF2",
      accent: "#8E9AAE",
      wash: 0.18,
      symbol: "coins",
      symbolScale: 0.52,
      font: "display",
      weight: 600,
    }),
  ],
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
type TramiteStyle = { bg: string; ink: string; accent: string; symbol: SymbolId };

const TRAMITES: Record<string, TramiteStyle> = {
  actas: { bg: "#161B33", ink: "#A9B6E8", accent: "#5C6FBF", symbol: "seal" },
  sat: { bg: "#0E2A25", ink: "#8ED8BA", accent: "#3F9E7C", symbol: "receipt" },
  salud: { bg: "#0D2534", ink: "#93CBE2", accent: "#3F8FB0", symbol: "medicalCross" },
  imss: { bg: "#122A2E", ink: "#96CFCF", accent: "#42979A", symbol: "idCard" },
  educacion: { bg: "#291D0F", ink: "#E0BA80", accent: "#B0813C", symbol: "gradCap" },
  antecedentes: { bg: "#201731", ink: "#BFA9E8", accent: "#7C5CC4", symbol: "fingerprint" },
  vehiculos: { bg: "#2C1717", ink: "#E5A697", accent: "#B26050", symbol: "car" },
  infonavit: { bg: "#2C1421", ink: "#E5A0BE", accent: "#B25580", symbol: "house" },
  citas: { bg: "#1D2612", ink: "#BDD292", accent: "#7C9B45", symbol: "calendar" },
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
    return spec({
      bg: style.bg,
      ink: style.ink,
      accent: style.accent,
      wash: 0.3,
      font: "display",
      weight: 600,
      tracking: "-0.02em",
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
  const w = brand.wash * (hero ? 1.15 : 1);
  const a = brand.accent;

  // Capas, de arriba abajo: luz cenital, acento de marca, fondo real.
  const layers = [
    `radial-gradient(${hero ? "120% 46%" : "132% 62%"} at 50% ${hero ? "-8%" : "-14%"}, ${rgba(brand.light ? "#000000" : "#FFFFFF", brand.light ? 0.06 : 0.11)}, transparent 64%)`,
    `radial-gradient(${hero ? "110% 62%" : "128% 96%"} at ${hero ? "82% 96%" : "50% 118%"}, ${rgba(a, w)}, transparent 62%)`,
    `radial-gradient(${hero ? "76% 44%" : "92% 70%"} at ${hero ? "6% 8%" : "8% 4%"}, ${rgba(a, w * 0.55)}, transparent 60%)`,
    brand.bg,
  ];

  return {
    background: layers.join(", "),
    border: rgba(brand.light ? "#000000" : a, brand.light ? 0.14 : 0.3),
    edge: rgba(brand.light ? "#000000" : "#FFFFFF", brand.light ? 0.12 : 0.34),
    ink: brand.ink,
    inkGrad: brand.inkGrad,
    symbolInk: brand.symbolInk ?? brand.ink,
    inkShadow: brand.light ? "none" : `0 2px 18px ${rgba(a, 0.34)}`,
    accent: a,
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
