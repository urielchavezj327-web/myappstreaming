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

export type ParsedQuery = {
  empty: boolean;
  phone: string | null;
  /** Letras exactas pedidas: "Vendedor H" -> ["h"] */
  sellerLetters: string[];
  tokens: string[];
};

export function parseQuery(raw: string): ParsedQuery {
  const phone = phoneQueryDigits(raw);
  if (phone) return { empty: false, phone, sellerLetters: [], tokens: [] };

  let text = norm(raw);
  const sellerLetters: string[] = [];
  // "vendedor h" se trata como coincidencia EXACTA de letra, nunca como
  // dos palabras sueltas (la "h" sola coincidiría con casi todo).
  text = text.replace(/\bvendedor(?:a)?\s+([a-z])\b/g, (_m, letter: string) => {
    sellerLetters.push(letter);
    return " ";
  });

  const tokens = text.split(/\s+/).filter((t) => t.length > 0);
  const empty = sellerLetters.length === 0 && tokens.join("").length < 2;
  return { empty, phone: null, sellerLetters, tokens };
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

  if (q.tokens.length === 0) return q.sellerLetters.length > 0;

  const haystack = norm(
    [
      t.serviceName,
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
 * Orden lógico de trámites por tipo de documento:
 * actas (nacimiento, divorcio, matrimonio) → CSF/RFC → recetas →
 * certificados escolares → constancias → identificaciones → resto.
 */
const TRAMITE_RULES: Array<[RegExp, number]> = [
  [/acta.*nacimiento|nacimiento/, 10],
  [/acta.*divorcio|divorcio/, 11],
  [/acta.*matrimonio|matrimonio/, 12],
  [/acta.*defuncion|defuncion/, 13],
  [/acta/, 14],
  [/curp/, 19],
  [/csf|constancia.*fiscal|rfc|sat/, 20],
  [/receta|medic/, 30],
  [/certificado.*(primaria|secundaria|prepa|bachi|escolar|estudios)|certificado/, 40],
  [/kardex|historial.*academico|titulo|cedula/, 41],
  [/constancia/, 50],
  [/ine|identificacion|pasaporte|licencia/, 60],
  [/nomina|recibo|comprobante.*domicilio|comprobante/, 70],
  [/imss|nss|afore|infonavit/, 80],
];

export function tramiteRank(serviceName: string, detail: string | null) {
  const text = norm(`${serviceName} ${detail ?? ""}`);
  for (const [re, rank] of TRAMITE_RULES) if (re.test(text)) return rank;
  return 900;
}
