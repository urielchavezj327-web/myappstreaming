// Motor de búsqueda compartido: la portada y /agregar deben comportarse
// EXACTAMENTE igual. Cualquier cambio aquí aplica a los dos buscadores.
import { phoneMatches, phoneQueryDigits } from "./phone";

/**
 * Normaliza ignorando acentos, mayúsculas y símbolos (/, ¹, +, ·, etc.)
 * "C/V Libre Gaeta¹" -> "cv libre gaeta1"
 */
export function norm(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const PRODUCT_TEXT: Record<string, string> = {
  perfil: "perfil",
  completa: "cuenta completa full",
  individual: "individual",
  familiar: "familiar",
  invitacion: "invitacion",
  lote: "lote",
  tramite: "tramite",
  panel: "panel",
  otro: "servicio",
};

export function durationText(months: number | null) {
  if (months === null) return "unico";
  if (months === 0) return "permanente";
  if (months === 1) return "1 mes meses mensual";
  if (months === 6) return "6 meses semestral";
  if (months === 12) return "12 meses anual 1 ano";
  if (months === 24) return "24 meses 2 anos";
  if (months === 36) return "36 meses 3 anos";
  return `${months} meses`;
}

/**
 * Términos que nombran un TIPO DE PRODUCTO real, no una palabra suelta.
 *
 * Buscar "Netflix perfil" no debe traer cuentas completas cuyo detalle dice
 * "4 perfiles + infantil", ni "Netflix cuenta completa" debe traer lotes que
 * dicen "10 cuentas completas". Cuando uno de estos términos aparece en la
 * consulta se filtra por `product_type`, no por el texto del detalle.
 *
 * Solo entran perfil, cuenta completa y lote: son los tres tipos que se piden
 * por nombre. "panel", "familiar" o "invitación" aparecen dentro del detalle de
 * ofertas de todo tipo ("Disney completa con panel"), así que convertirlos en
 * filtro estricto rompería búsquedas legítimas.
 *
 * El orden importa: las frases largas se detectan antes que las cortas.
 */
const PRODUCT_PHRASES: Array<[string, string]> = [
  ["cuentas completas", "completa"],
  ["cuenta completa", "completa"],
  ["completas", "completa"],
  ["completa", "completa"],
  ["cuentas", "completa"],
  ["cuenta", "completa"],
  ["full", "completa"],
  ["perfiles", "perfil"],
  ["perfil", "perfil"],
  ["lotes", "lote"],
  ["lote", "lote"],
];

export type ParsedQuery = {
  empty: boolean;
  phone: string | null;
  /** Letras exactas pedidas: "Vendedor H" -> ["h"] */
  sellerLetters: string[];
  tokens: string[];
  /** Tipos de producto pedidos por nombre: "perfil", "completa", "lote". */
  productTypes: string[];
  /** Términos con los que se pidieron, para poder buscarlos también por nombre. */
  productTerms: string[];
};

export function parseQuery(raw: string): ParsedQuery {
  const phone = phoneQueryDigits(raw);
  if (phone)
    return {
      empty: false,
      phone,
      sellerLetters: [],
      tokens: [],
      productTypes: [],
      productTerms: [],
    };

  let text = norm(raw);
  const sellerLetters: string[] = [];
  // "vendedor h" se trata como coincidencia EXACTA de letra, nunca como
  // dos palabras sueltas (la "h" sola coincidiría con casi todo).
  text = text.replace(/\bvendedor(?:a)?\s+([a-z])\b/g, (_m, letter: string) => {
    sellerLetters.push(letter);
    return " ";
  });

  const productTypes: string[] = [];
  const productTerms: string[] = [];
  let padded = ` ${text} `;
  for (const [phrase, type] of PRODUCT_PHRASES) {
    if (!padded.includes(` ${phrase} `)) continue;
    padded = padded.split(` ${phrase} `).join(" ");
    productTerms.push(phrase);
    if (!productTypes.includes(type)) productTypes.push(type);
  }
  text = padded.trim();

  const tokens = text.split(/\s+/).filter((t) => t.length > 0);
  const empty =
    sellerLetters.length === 0 && productTypes.length === 0 && tokens.join("").length < 2;
  return { empty, phone: null, sellerLetters, tokens, productTypes, productTerms };
}

/**
 * Sinónimos de los documentos que se conocen por sus siglas. La ficha conserva
 * el nombre corto porque así se pide en la vida real ("NSS"), pero el buscador
 * también responde al nombre completo. Se aplican sobre el nombre del servicio
 * al construir el texto de búsqueda.
 */
const SYNONYMS: Array<[RegExp, string]> = [
  [/\bnss\b/, "numero de seguridad social imss"],
  [/\bcurp\b/, "clave unica de registro de poblacion"],
  [/constancia de situacion fiscal/, "csf rfc sat constancia fiscal"],
  [/cedula de identificacion fiscal/, "cif cedula fiscal sat"],
  [/localizacion de idcif/, "idcif identificador cedula identificacion fiscal"],
  [/\brepuve\b/, "registro publico vehicular consulta de auto robado"],
  [/\brnoa\b/, "registro nacional de obligaciones alimentarias deudor alimentario"],
  [/\bsindo\b/, "sistema de notificacion de documentos imss"],
  [/ds 160|ds160/, "formulario visa americana embajada"],
  [/carta de no antecedentes penales/, "antecedentes no penales constancia"],
  [/constancia de no derechohabiencia/, "no derechohabiente imss issste issemym vigencia"],
  [/receta medica/, "receta farmacia similares ahorro imss particular"],
  [
    /certificado de estudios/,
    "certificado primaria secundaria preparatoria universidad normal inea",
  ],
  [/estado de cuenta infonavit/, "saldo infonavit historico precalificacion"],
  [/opinion de cumplimiento/, "32d opinion positiva sat"],
  [/recibo de luz cfe/, "comprobante de domicilio luz"],
  [/recibo de nomina/, "comprobante de ingresos nomina"],
];

/** Texto extra de búsqueda para un servicio conocido por sus siglas. */
export function synonymsFor(serviceName: string): string {
  const key = norm(serviceName);
  let out = "";
  for (const [pattern, extra] of SYNONYMS) if (pattern.test(key)) out += ` ${extra}`;
  return out;
}

export type MatchTarget = {
  serviceName: string;
  categoryName: string;
  groupName: string;
  parentGroup: string | null;
  variant: string | null;
  phone: string | null;
  detail: string | null;
  productType: string;
  months: number | null;
};

/** Nombre normalizado del vendedor: "Vendedor H" -> letra "h". */
export function sellerLetterOf(groupName: string): string | null {
  const m = /^vendedor(?:a)?\s+([a-z])$/.exec(norm(groupName));
  return m ? m[1]! : null;
}

export function matchesQuery(t: MatchTarget, q: ParsedQuery): boolean {
  if (q.phone) return phoneMatches(t.phone, q.phone);

  if (q.sellerLetters.length > 0) {
    const letter = sellerLetterOf(t.groupName);
    if (!letter || !q.sellerLetters.includes(letter)) return false;
  }

  if (q.productTypes.length > 0 && !q.productTypes.includes(t.productType)) {
    // Excepción: el término puede formar parte de un nombre real
    // ("Recuperación de cuentas", "Paneles y Métodos"). Se busca en la
    // identidad de la oferta, nunca en el detalle.
    const identity = norm(
      [t.serviceName, t.categoryName, t.groupName, t.parentGroup ?? ""].join(" "),
    );
    if (!q.productTerms.some((term) => identity.includes(term))) return false;
  }

  if (q.tokens.length === 0) return q.sellerLetters.length > 0 || q.productTypes.length > 0;

  const haystack = norm(
    [
      t.serviceName,
      synonymsFor(t.serviceName),
      t.categoryName,
      t.groupName,
      t.parentGroup ?? "",
      t.variant ?? "",
      t.detail ?? "",
      PRODUCT_TEXT[t.productType] ?? t.productType,
      durationText(t.months),
    ].join(" "),
  );
  const phoneDigits = (t.phone ?? "").replace(/\D/g, "");

  return q.tokens.every((tok) => {
    if (haystack.includes(tok)) return true;
    if (/^\d{4,}$/.test(tok) && phoneMatches(t.phone, tok)) return true;
    if (/^\d{4,}$/.test(tok) && phoneDigits.includes(tok)) return true;
    return false;
  });
}

/**
 * Orden permanente de vendedores dentro de un grupo padre:
 * primero los que tienen nombre propio, después "Vendedor A, B, C…".
 */
export function sellerSortKey(name: string): [number, string] {
  const letter = sellerLetterOf(name);
  if (letter) return [1, letter];
  return [0, norm(name)];
}

export function compareSellers(a: string, b: string) {
  const [ra, ka] = sellerSortKey(a);
  const [rb, kb] = sellerSortKey(b);
  return ra - rb || ka.localeCompare(kb);
}

/**
 * Orden de los trámites por tipo de documento.
 *
 * Se apoya en las subcategorías reales de la base (`subcategories.sort_order`),
 * que ya describen el orden lógico: actas → SAT → salud → educación →
 * antecedentes → vehículos → Infonavit → citas. Así, al crear una subcategoría
 * nueva el orden se corrige solo, sin tocar código.
 *
 * Único ajuste sobre ese orden: "IMSS / ISSSTE y salud" mezcla dos cosas que se
 * consultan por separado, así que se parte en dos bloques — recetas y
 * certificados médicos antes de Educación, y NSS / semanas / AFORE después.
 */
const MEDICO =
  /receta|certificado medico|prueba|covid|antidoping|embarazo|vih|sifilis|urgencias|analisis|discapacidad/;

export function tramiteRank(
  serviceName: string,
  subcategorySlug: string | null | undefined,
  subcategoryOrder: number | null | undefined,
): number {
  if (!subcategorySlug) return 900;
  if (subcategorySlug === "salud") return MEDICO.test(norm(serviceName)) ? 25 : 45;
  const order = subcategoryOrder ?? 99;
  // Educación (4) queda entre los dos bloques de salud (25 y 45).
  return order <= 2 ? order * 10 : order === 4 ? 40 : order * 10;
}

/** Campos mínimos para ordenar una oferta dentro del listado de un vendedor. */
export type SortableOffer = {
  categorySlug?: string | undefined;
  categoryOrder?: number | undefined;
  serviceName?: string | undefined;
  serviceOrder?: number | undefined;
  subcategorySlug?: string | null | undefined;
  subcategoryOrder?: number | null | undefined;
};

/**
 * Posición de una oferta dentro de su categoría. Los trámites se agrupan por
 * tipo de documento; el resto conserva el orden del catálogo.
 */
export function serviceRankWithin(offer: SortableOffer): [number, number] {
  if (offer.categorySlug === "tramites") {
    return [
      tramiteRank(offer.serviceName ?? "", offer.subcategorySlug, offer.subcategoryOrder),
      offer.serviceOrder ?? 99,
    ];
  }
  return [0, offer.serviceOrder ?? 99];
}

export function compareOffersByService(a: SortableOffer, b: SortableOffer): number {
  const [ra, sa] = serviceRankWithin(a);
  const [rb, sb] = serviceRankWithin(b);
  return ra - rb || sa - sb || (a.serviceName ?? "").localeCompare(b.serviceName ?? "");
}
