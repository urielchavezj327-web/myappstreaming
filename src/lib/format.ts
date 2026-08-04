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
  return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}`;
}

export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
