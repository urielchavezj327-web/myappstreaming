export const PRODUCT_LABELS: Record<string, string> = {
  perfil: "Perfil",
  completa: "Cuenta completa",
  individual: "Individual",
  familiar: "Familiar",
  invitacion: "Invitación",
  lote: "Lote",
  tramite: "Trámite",
  otro: "Servicio",
};

export function productLabel(type: string) {
  return PRODUCT_LABELS[type] ?? type;
}

export function durationLabel(months: number | null) {
  if (months === null) return "Único";
  if (months === 0) return "Permanente";
  if (months === 1) return "1 mes";
  if (months === 12) return "Anual";
  if (months === 24) return "2 años";
  if (months === 36) return "3 años";
  return `${months} meses`;
}

export function durationRank(months: number | null) {
  if (months === null) return -1;
  if (months === 0) return 999;
  return months;
}

export function formatPrice(price: number | null) {
  if (price === null) return "A consultar";
  const value = Number(price);
  const decimals = value % 1 === 0 ? 0 : 2;
  return `$${new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)}`;
}

export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Antigüedad de una oferta, en palabras.
 *
 * Los precios de estos grupos cambian solos y sin avisar: lo que decide si
 * vale la pena escribirle a un vendedor no es solo el precio, sino desde
 * cuándo está ahí. Devuelve `null` cuando no hay fecha, para no pintar nada.
 */
export function freshness(iso: string | null | undefined): {
  label: string;
  /** `true` cuando el dato ya pide revisión (más de dos meses). */
  stale: boolean;
} | null {
  if (!iso) return null;
  // Postgres devuelve «2026-08-04 08:51:02.100991+00»: espacio en vez de «T» y
  // el desfase horario sin minutos, que `Date` no acepta tal cual.
  const normalized = iso
    .trim()
    .replace(" ", "T")
    .replace(/([+-]\d{2})$/, "$1:00");
  const ms = new Date(normalized).getTime();
  if (!Number.isFinite(ms)) return null;

  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days < 0) return null;

  const stale = days > 60;
  if (days === 0) return { label: "hoy", stale };
  if (days === 1) return { label: "ayer", stale };
  if (days < 7) return { label: `hace ${days} días`, stale };
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return { label: `hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`, stale };
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return { label: `hace ${months} ${months === 1 ? "mes" : "meses"}`, stale };
  }
  const years = Math.floor(days / 365);
  return { label: `hace ${years} ${years === 1 ? "año" : "años"}`, stale };
}
