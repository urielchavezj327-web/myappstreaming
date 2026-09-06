/**
 * Identidad visual de cada servicio.
 *
 * Una sola fuente de verdad para el color y el tratamiento tipográfico de las
 * fichas. Vive en código (no en `services.color`) por dos razones:
 *
 *  1. Los colores de la base venían de una carga inicial y varios no coinciden
 *     con el logotipo real (Kocowa estaba rosa, MUBI gris, Hidive verde…).
 *  2. Un servicio nuevo creado desde /agregar toma su identidad al instante:
 *     escribir "Claude" basta para que use el naranja óxido de Anthropic.
 *
 * `services.color` se sigue respetando como respaldo cuando no hay marca
 * conocida, para no perder las decisiones de color ya tomadas a mano.
 */

export type BrandFont = "display" | "condensed" | "script" | "serif" | "sans";
export type BrandMark = "none" | "smile" | "arc" | "plus" | "twoLine" | "peacock";

export type Brand = {
  /** Colores del logotipo real, el principal primero. */
  colors: string[];
  /** Color del nombre sobre la tarjeta. */
  ink: string;
  font: BrandFont;
  weight: number;
  tracking: string;
  upper: boolean;
  italic: boolean;
  mark: BrandMark;
  /** Para logotipos de dos líneas (HBO / Max, YouTube / Premium). */
  lines?: [string, string];
  /** Tarjeta de fondo claro (Peacock): invierte el degradado y la tinta. */
  light: boolean;
};

type BrandSpec = Partial<Omit<Brand, "colors">> & { colors: string[] };

const WHITE = "#FFFFFF";

function spec(s: BrandSpec): Brand {
  return {
    colors: s.colors,
    ink: s.ink ?? WHITE,
    font: s.font ?? "display",
    weight: s.weight ?? 700,
    tracking: s.tracking ?? "-0.03em",
    upper: s.upper ?? false,
    italic: s.italic ?? false,
    mark: s.mark ?? "none",
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
 * Tabla de marcas. El orden importa: gana la primera que coincide, así que las
 * reglas específicas ("canva edu") van antes que las generales ("canva").
 */
const BRANDS: Array<[RegExp, Brand]> = [
  // ── Streaming ────────────────────────────────────────────────────────────
  [
    /^netflix/,
    spec({
      colors: ["#E50914", "#B81D24", "#0A0507"],
      font: "condensed",
      weight: 700,
      upper: true,
      tracking: "0.02em",
    }),
  ],
  [
    /^disney/,
    spec({
      colors: ["#0063E5", "#0E1D62", "#00CFFF"],
      font: "script",
      weight: 400,
      mark: "arc",
      tracking: "0em",
    }),
  ],
  [
    /^hbo|^max\b/,
    spec({
      colors: ["#991EEB", "#4B1FA8", "#002BE7"],
      font: "display",
      weight: 700,
      mark: "twoLine",
      lines: ["HBO", "Max"],
    }),
  ],
  [
    /^prime video|^amazon prime/,
    spec({
      colors: ["#00A8E1", "#1A98FF", "#141F2B"],
      font: "display",
      weight: 600,
      mark: "smile",
      tracking: "-0.02em",
    }),
  ],
  [
    /^paramount/,
    spec({ colors: ["#0064FF", "#0037C1", "#0A1030"], font: "display", weight: 600, mark: "plus" }),
  ],
  [
    /^vix/,
    spec({
      colors: ["#FF4E00", "#FF0080", "#2A0A3C"],
      font: "display",
      weight: 700,
      italic: true,
      tracking: "-0.04em",
    }),
  ],
  [
    /^crunchyroll/,
    spec({
      colors: ["#F47521", "#FF6600", "#17181C"],
      font: "display",
      weight: 700,
      tracking: "-0.035em",
    }),
  ],
  [
    /^apple tv/,
    spec({
      colors: ["#5A5A62", "#A2AAAD", "#141416"],
      font: "display",
      weight: 500,
      mark: "plus",
      tracking: "-0.045em",
    }),
  ],
  [
    /^fox/,
    spec({
      colors: ["#0033A0", "#0A58CA", "#07091A"],
      font: "condensed",
      weight: 700,
      upper: true,
      tracking: "0.04em",
    }),
  ],
  [
    /^universal/,
    spec({
      colors: ["#FFC72C", "#8A6300", "#0E0E10"],
      ink: "#FFD65C",
      font: "display",
      weight: 600,
      mark: "plus",
      upper: true,
      tracking: "0.06em",
    }),
  ],
  [/^claro/, spec({ colors: ["#E4002B", "#FF3D3D", "#1A0006"], font: "display", weight: 700 })],
  [
    /^iptv/,
    spec({
      colors: ["#2DD4BF", "#10B981", "#062C26"],
      font: "condensed",
      weight: 600,
      upper: true,
      tracking: "0.12em",
    }),
  ],
  [/^viki/, spec({ colors: ["#00B9AE", "#BF0000", "#0B1418"], font: "display", weight: 700 })],
  [
    /^mubi/,
    spec({
      colors: ["#0A1AFF", "#0000CC", "#07070F"],
      font: "display",
      weight: 700,
      upper: true,
      tracking: "-0.02em",
    }),
  ],
  [
    /^kocowa/,
    spec({
      colors: ["#7C3AED", "#4C1D95", "#08060F"],
      font: "display",
      weight: 700,
      upper: true,
      tracking: "0.01em",
    }),
  ],
  [
    /^plex/,
    spec({
      colors: ["#E5A00D", "#CC7B19", "#1B1B1F"],
      font: "display",
      weight: 700,
      upper: true,
      tracking: "0.06em",
    }),
  ],
  [
    /^formula 1|^f1/,
    spec({
      colors: ["#E10600", "#FF1801", "#15151E"],
      font: "condensed",
      weight: 700,
      italic: true,
      upper: true,
      tracking: "-0.02em",
    }),
  ],
  [
    /^iqiyi/,
    spec({
      colors: ["#00BE06", "#00A854", "#06160A"],
      font: "display",
      weight: 700,
      tracking: "-0.02em",
    }),
  ],
  [
    /^mlb/,
    spec({
      colors: ["#0B3A7A", "#BF0D3E", "#041E42"],
      font: "condensed",
      weight: 700,
      upper: true,
      tracking: "0.03em",
    }),
  ],
  [
    /^peacock/,
    spec({
      colors: ["#FFFFFF", "#E6E6EA", "#0A0A0A"],
      ink: "#0A0A0A",
      font: "display",
      weight: 600,
      mark: "peacock",
      light: true,
      tracking: "-0.03em",
    }),
  ],
  [
    /^hidive/,
    spec({
      colors: ["#0091D5", "#00D4FF", "#060B14"],
      font: "condensed",
      weight: 700,
      upper: true,
      tracking: "0.08em",
    }),
  ],

  // ── Música ───────────────────────────────────────────────────────────────
  [
    /^spotify/,
    spec({
      colors: ["#1DB954", "#1ED760", "#0C1A10"],
      font: "display",
      weight: 700,
      tracking: "-0.045em",
    }),
  ],
  [
    /^youtube/,
    spec({
      colors: ["#FF0000", "#CC0000", "#0F0F0F"],
      font: "display",
      weight: 700,
      mark: "twoLine",
      lines: ["YouTube", "Premium"],
    }),
  ],
  [
    /^apple music/,
    spec({
      colors: ["#FA243C", "#FB5C74", "#14060A"],
      font: "display",
      weight: 500,
      tracking: "-0.045em",
    }),
  ],
  [
    /^amazon music/,
    spec({
      colors: ["#25D1DA", "#46C3D4", "#141F2B"],
      font: "display",
      weight: 600,
      tracking: "-0.03em",
    }),
  ],
  [
    /^tidal/,
    spec({
      colors: ["#33A9AC", "#0B3B3D", "#0B0B0D"],
      font: "display",
      weight: 500,
      upper: true,
      tracking: "0.22em",
    }),
  ],
  [
    /^deezer/,
    spec({
      colors: ["#A238FF", "#FF0092", "#00C7F2"],
      font: "display",
      weight: 700,
      tracking: "-0.03em",
    }),
  ],
  [
    /^qobuz/,
    spec({
      colors: ["#0070EF", "#003C82", "#070C16"],
      font: "display",
      weight: 600,
      tracking: "0.02em",
    }),
  ],

  // ── Diseño e IA ──────────────────────────────────────────────────────────
  [
    /^canva edu/,
    spec({
      colors: ["#00C4CC", "#3B82F6", "#0D0F1C"],
      font: "display",
      weight: 600,
      tracking: "-0.03em",
    }),
  ],
  [
    /^canva/,
    spec({
      colors: ["#7D2AE8", "#00C4CC", "#0D0F1C"],
      font: "display",
      weight: 600,
      tracking: "-0.03em",
    }),
  ],
  [
    /^chatgpt|^openai/,
    spec({
      colors: ["#10A37F", "#0D8A6A", "#07120F"],
      font: "display",
      weight: 600,
      tracking: "-0.02em",
    }),
  ],
  [
    /^claude|^anthropic/,
    spec({
      colors: ["#D97757", "#CC785C", "#1A1512"],
      font: "serif",
      weight: 400,
      tracking: "-0.01em",
    }),
  ],
  [
    /^gemini/,
    spec({
      colors: ["#4285F4", "#9B72CB", "#D96570"],
      font: "display",
      weight: 500,
      tracking: "-0.02em",
    }),
  ],
  [
    /^capcut/,
    spec({
      colors: ["#00E5D0", "#25F4EE", "#08100F"],
      font: "display",
      weight: 700,
      tracking: "-0.04em",
    }),
  ],
  [
    /^office|^microsoft 365/,
    spec({
      colors: ["#D83B01", "#185ABD", "#107C41"],
      font: "display",
      weight: 600,
      tracking: "-0.02em",
    }),
  ],
  [
    /^duolingo/,
    spec({
      colors: ["#58CC02", "#89E219", "#1CB0F6"],
      font: "display",
      weight: 700,
      tracking: "-0.03em",
    }),
  ],
  [
    /^picsart/,
    spec({
      colors: ["#C209C1", "#FF4181", "#7A00FF"],
      font: "display",
      weight: 700,
      tracking: "-0.03em",
    }),
  ],
  [
    /^scribd|^everand/,
    spec({
      colors: ["#1E7B85", "#0A4C54", "#071214"],
      font: "serif",
      weight: 400,
      tracking: "0em",
    }),
  ],
  [
    /^photoshop/,
    spec({
      colors: ["#31A8FF", "#00C8FF", "#001E36"],
      font: "display",
      weight: 600,
      tracking: "-0.02em",
    }),
  ],
  [
    /^adobe/,
    spec({
      colors: ["#FF0000", "#EC1C24", "#1A0000"],
      font: "display",
      weight: 700,
      tracking: "-0.03em",
    }),
  ],
  [
    /almacenamiento google|google drive|google one/,
    spec({
      colors: ["#4285F4", "#EA4335", "#FBBC04", "#34A853"],
      font: "display",
      weight: 500,
      tracking: "-0.02em",
    }),
  ],
  [
    /onedrive/,
    spec({
      colors: ["#0078D4", "#28A8EA", "#062033"],
      font: "display",
      weight: 500,
      tracking: "-0.02em",
    }),
  ],

  // ── Otros con marca ──────────────────────────────────────────────────────
  [
    /^pornhub/,
    spec({
      colors: ["#FF9000", "#F7A600", "#0A0A0A"],
      font: "display",
      weight: 700,
      tracking: "-0.03em",
    }),
  ],
  [
    /^brazzers/,
    spec({
      colors: ["#D9A441", "#8A5F13", "#0A0A0A"],
      ink: "#F5D48A",
      font: "serif",
      weight: 400,
      upper: true,
      tracking: "0.1em",
    }),
  ],
  [
    /^onlyfans/,
    spec({
      colors: ["#00AFF0", "#008CCF", "#04141F"],
      font: "display",
      weight: 600,
      tracking: "-0.03em",
    }),
  ],
  [
    /^surfshark/,
    spec({
      colors: ["#1EBFBF", "#178A8A", "#07171B"],
      font: "display",
      weight: 600,
      tracking: "-0.02em",
    }),
  ],
  [
    /^nordvpn|^nord/,
    spec({
      colors: ["#4687FF", "#2B6BE0", "#061024"],
      font: "display",
      weight: 600,
      tracking: "-0.02em",
    }),
  ],
  [
    /^expressvpn|^express/,
    spec({
      colors: ["#DA3940", "#A8262C", "#14090A"],
      font: "display",
      weight: 600,
      tracking: "-0.02em",
    }),
  ],
  [
    /^bitdefender/,
    spec({
      colors: ["#ED1C24", "#A80F15", "#12080A"],
      font: "display",
      weight: 600,
      tracking: "-0.02em",
    }),
  ],
  [
    /^avira/,
    spec({
      colors: ["#E4003C", "#A3002B", "#14060C"],
      font: "display",
      weight: 600,
      tracking: "-0.02em",
    }),
  ],
  [
    /discord/,
    spec({
      colors: ["#5865F2", "#EB459E", "#1B1D26"],
      font: "display",
      weight: 600,
      tracking: "-0.03em",
    }),
  ],
  [
    /free fire/,
    spec({
      colors: ["#F5811E", "#E7362B", "#150C05"],
      font: "condensed",
      weight: 700,
      italic: true,
      upper: true,
      tracking: "0.01em",
    }),
  ],
  [
    /robux|pavos|roblox|fortnite/,
    spec({
      colors: ["#E2231A", "#00A2FF", "#0B0B0E"],
      font: "display",
      weight: 700,
      tracking: "-0.03em",
    }),
  ],
  [
    /smart ?fit/,
    spec({
      colors: ["#FACC15", "#A87F00", "#111111"],
      ink: "#FFE066",
      font: "condensed",
      weight: 700,
      upper: true,
      tracking: "0.04em",
    }),
  ],
  [
    /^cine\b|cinepolis|cinemex/,
    spec({
      colors: ["#0B1E4B", "#E0245E", "#FFC72C"],
      font: "display",
      weight: 600,
      tracking: "-0.02em",
    }),
  ],
  [
    /metro monterrey|^transporte/,
    spec({
      colors: ["#00A96B", "#007A4D", "#04150E"],
      font: "condensed",
      weight: 600,
      upper: true,
      tracking: "0.06em",
    }),
  ],

  // ── Otros sin marca: identidad propia, nunca gris ───────────────────────
  [
    /pagos de servicios/,
    spec({ colors: ["#FBBF24", "#B45309", "#1B1204"], font: "display", weight: 600 }),
  ],
  [
    /compras con descuento|compras online/,
    spec({ colors: ["#F472B6", "#BE185D", "#1C0812"], font: "display", weight: 600 }),
  ],
  [
    /abonos|liquidacion de creditos/,
    spec({ colors: ["#C2A33B", "#7A6416", "#161206"], font: "display", weight: 600 }),
  ],
  [/recargas/, spec({ colors: ["#60A5FA", "#1D4ED8", "#080F22"], font: "display", weight: 600 })],
  [/comida/, spec({ colors: ["#00C16A", "#047857", "#04160F"], font: "display", weight: 600 })],
  [
    /hospedaje|boletos|viajes/,
    spec({ colors: ["#38BDF8", "#0369A1", "#04141E"], font: "display", weight: 600 }),
  ],
  [
    /seguro de autos/,
    spec({ colors: ["#4F8DF5", "#1E3A8A", "#070E20"], font: "display", weight: 600 }),
  ],
  [
    /videojuegos/,
    spec({ colors: ["#7B61FF", "#4C1D95", "#0C0718"], font: "display", weight: 600 }),
  ],
  [
    /peliculas|libros|pdf/,
    spec({ colors: ["#C4B5FD", "#6D28D9", "#0E0A1C"], font: "serif", weight: 400 }),
  ],
  [
    /paneles|metodos/,
    spec({ colors: ["#14B8A6", "#0F766E", "#041614"], font: "display", weight: 600 }),
  ],
  [
    /recuperacion de cuentas/,
    spec({ colors: ["#F97316", "#9A3412", "#180A03"], font: "display", weight: 600 }),
  ],
  [
    /numeros virtuales/,
    spec({ colors: ["#22D3EE", "#0E7490", "#04161B"], font: "display", weight: 600 }),
  ],
  [
    /bots/,
    spec({
      colors: ["#6EE7B7", "#047857", "#04160F"],
      font: "condensed",
      weight: 600,
      upper: true,
      tracking: "0.08em",
    }),
  ],
  [
    /seguidores|redes sociales/,
    spec({ colors: ["#F87171", "#B91C1C", "#1A0808"], font: "display", weight: 600 }),
  ],
];

/**
 * Paleta de Trámites por subcategoría. Antes eran 78 fichas del mismo gris, lo
 * que aplanaba toda la categoría; ahora cada tipo de documento tiene su tono,
 * separados en el círculo cromático para distinguirse de un vistazo y con la
 * misma saturación para que la categoría siga leyéndose como un sistema.
 */
const TRAMITE_PALETTE: Record<string, string[]> = {
  actas: ["#4F7CFF", "#2B4EAE", "#080D22"],
  sat: ["#22C55E", "#15803D", "#04160B"],
  salud: ["#06B6D4", "#0E7490", "#03151A"],
  educacion: ["#F59E0B", "#B45309", "#1A1103"],
  antecedentes: ["#A855F7", "#7E22CE", "#120722"],
  vehiculos: ["#EF4444", "#B91C1C", "#1A0707"],
  infonavit: ["#EC4899", "#BE185D", "#1A0713"],
  citas: ["#84CC16", "#4D7C0F", "#0E1503"],
};

/** Colores de las tarjetas de colección de "Otros" (agrupan varias fichas). */
const BUNDLE_PALETTE: Record<string, string[]> = {
  adultos: ["#FF9000", "#B45309", "#120A02"],
  "servicios-vpn": ["#1EBFBF", "#0F766E", "#04161A"],
};

const TRAMITE_FALLBACK = ["#64B5F6", "#1E5F9E", "#080F1C"];

const cache = new Map<string, Brand>();

export type BrandInput = {
  name: string;
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  /** `services.color` — respaldo cuando no hay marca conocida. */
  color?: string | null;
  /** Tarjeta de colección de "Otros" (agrupa varias fichas), no un servicio. */
  bundle?: boolean;
};

/** Identidad visual de un servicio: color de marca real y estilo del nombre. */
export function resolveBrand(input: BrandInput): Brand {
  const cacheKey = `${input.name}|${input.categorySlug ?? ""}|${input.subcategorySlug ?? ""}|${input.color ?? ""}|${input.bundle ? "b" : ""}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const brand = computeBrand(input);
  cache.set(cacheKey, brand);
  return brand;
}

function computeBrand({ name, categorySlug, subcategorySlug, color, bundle }: BrandInput): Brand {
  // Las colecciones de "Otros" tienen su propia identidad, no la del primer
  // servicio que contienen. Solo aplica a la tarjeta agrupada, nunca a las
  // fichas individuales que viven dentro (Pornhub, NordVPN…).
  if (bundle && subcategorySlug && BUNDLE_PALETTE[subcategorySlug] && categorySlug === "otros") {
    return spec({ colors: BUNDLE_PALETTE[subcategorySlug]!, font: "display", weight: 600 });
  }

  // Trámites: no son marcas, se colorean por tipo de documento. Dentro de cada
  // subcategoría se aplica una variación mínima derivada del nombre para que
  // una lista de trece actas no parezca trece rectángulos idénticos, sin salir
  // nunca del tono que identifica al grupo.
  if (categorySlug === "tramites") {
    const palette = (subcategorySlug && TRAMITE_PALETTE[subcategorySlug]) || TRAMITE_FALLBACK;
    const jitter = (hashOf(key(name)) % 9) / 100 - 0.04;
    return spec({
      colors: palette.map((c, i) => (i === 0 ? shade(c, jitter) : c)),
      font: "display",
      weight: 600,
      tracking: "-0.02em",
    });
  }

  const normalized = key(name);
  for (const [pattern, brand] of BRANDS) {
    if (pattern.test(normalized)) return brand;
  }

  // Sin marca conocida: se respeta el color elegido a mano en la base y se
  // deriva un degradado coherente a partir de él.
  const base = normalizeHex(color) ?? hashColor(normalized);
  return spec({
    colors: [base, shade(base, -0.35), shade(base, -0.82)],
    font: "display",
    weight: 600,
  });
}

// ── Utilidades de color ────────────────────────────────────────────────────

function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    const [r, g, b] = [v[1]!, v[2]!, v[3]!];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
}

function hashOf(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 100003;
  return h;
}

/** Tono estable derivado del nombre, para servicios nuevos sin marca conocida. */
function hashColor(seed: string): string {
  return hslToHex(hashOf(seed) % 360, 62, 58);
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * v);
  };
  return rgbToHex([f(0), f(8), f(4)]);
}

function hexToRgb(hex: string): [number, number, number] {
  const v = normalizeHex(hex) ?? "#808080";
  return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb
    .map((c) =>
      Math.max(0, Math.min(255, Math.round(c)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

/** Mezcla dos colores. `amount` 0 = a, 1 = b. */
export function mix(a: string, b: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
}

/** Aclara (amount > 0) u oscurece (amount < 0) un color. */
export function shade(hex: string, amount: number): string {
  return amount >= 0 ? mix(hex, "#FFFFFF", amount) : mix(hex, "#000000", -amount);
}

/** Luminancia relativa, para decidir si un color necesita tinta clara u oscura. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Color de superficie sobre el que se mezclan los degradados oscuros. */
const SURFACE = "#1E1E24";

/**
 * Mezcla un color hacia la superficie hasta alcanzar una luminancia objetivo.
 *
 * Es lo que permite que las 147 fichas usen su color real y aun así el nombre
 * se lea siempre: da igual que la marca sea el amarillo de Universal+ o el azul
 * marino de MLB, la tarjeta acaba en la misma banda de luminancia.
 */
function toLuminance(color: string, target: number): string {
  if (luminance(color) <= target) {
    // Ya es más oscuro que el objetivo: se aclara hacia el propio color puro.
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (luminance(mix(color, shade(color, 0.85), mid)) < target) lo = mid;
      else hi = mid;
    }
    return mix(color, shade(color, 0.85), lo);
  }
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (luminance(mix(color, SURFACE, mid)) > target) lo = mid;
    else hi = mid;
  }
  return mix(color, SURFACE, hi);
}

export type BrandSkin = {
  /** Fondo completo de la tarjeta. */
  background: string;
  /** Tinte para pastillas y recuadros sobre la tarjeta. */
  wash: string;
  /** Borde sutil teñido con la marca. */
  border: string;
  /** Brillo superior que da profundidad. */
  glow: string;
  /** Color del nombre. */
  ink: string;
  /** Sombra/halo del nombre para asegurar legibilidad. */
  inkShadow: string;
  /** Acento sólido para puntos, barras y detalles. */
  accent: string;
};

const skinCache = new Map<string, BrandSkin>();

/**
 * Traduce una marca a los estilos de la tarjeta: degradado con los colores
 * reales del logotipo (principal primero) llevado a una banda de luminancia
 * fija, para que la marca se reconozca sin comprometer la legibilidad ni el
 * conjunto neutro de la interfaz.
 */
export function brandSkin(brand: Brand, intensity: "card" | "hero" = "card"): BrandSkin {
  const cacheKey = `${brand.colors.join()}|${brand.ink}|${brand.light}|${intensity}`;
  const hit = skinCache.get(cacheKey);
  if (hit) return hit;

  const [c0 = "#8A8A93", c1 = c0, c2 = c1, c3] = brand.colors;
  const strong = intensity === "hero";

  let skin: BrandSkin;
  if (brand.light) {
    // Peacock: su marca es blanca sobre negro y se perdería contra el fondo de
    // la app, así que la tarjeta se invierte y las plumas ponen el color.
    skin = {
      background: `linear-gradient(155deg, ${c0} 0%, ${c1} 44%, ${mix(c2, "#4A4A52", 0.3)} 100%)`,
      wash: withAlpha("#FFFFFF", 0.5),
      border: withAlpha("#000000", 0.32),
      glow: `radial-gradient(120% 90% at 12% -10%, ${withAlpha("#FFFFFF", 0.85)}, transparent 70%)`,
      ink: brand.ink,
      inkShadow: `0 1px 0 ${withAlpha("#FFFFFF", 0.65)}`,
      accent: c2,
    };
  } else {
    const near = toLuminance(c0, strong ? 0.2 : 0.155);
    const mid = toLuminance(c1, strong ? 0.11 : 0.085);
    const far = toLuminance(c2, strong ? 0.05 : 0.04);
    const lift = shade(c0, luminance(c0) < 0.18 ? 0.5 : 0.18);
    skin = {
      background: c3
        ? `linear-gradient(150deg, ${near} 0%, ${mid} 38%, ${toLuminance(c3, 0.09)} 70%, ${far} 100%)`
        : `linear-gradient(150deg, ${near} 0%, ${mid} 52%, ${far} 100%)`,
      wash: withAlpha("#000000", 0.2),
      border: withAlpha(lift, 0.32),
      glow: `radial-gradient(125% 95% at 14% -14%, ${withAlpha(lift, strong ? 0.42 : 0.3)}, transparent 66%)`,
      ink: brand.ink,
      inkShadow: `0 2px 20px ${withAlpha(lift, 0.5)}`,
      accent: lift,
    };
  }

  skinCache.set(cacheKey, skin);
  return skin;
}

/** Acento sólido de un servicio (puntos, barras, resaltados). */
export function brandAccent(input: BrandInput): string {
  return brandSkin(resolveBrand(input)).accent;
}
