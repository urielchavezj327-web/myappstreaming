// Comparación de teléfonos ignorando espacios, guiones, paréntesis y lada.
export const phoneDigits = (value: string) => value.replace(/\D/g, "");

// Quita ladas comunes (52 México, 1 EUA/Canadá) para comparar el número local.
export function localDigits(value: string) {
  let d = phoneDigits(value);
  if (d.length > 10 && d.startsWith("52")) d = d.slice(2);
  if (d.length > 10 && d.startsWith("1")) d = d.slice(1);
  return d;
}

// Una consulta es "de teléfono" cuando prácticamente solo trae dígitos.
export function phoneQueryDigits(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(trimmed)) return null;
  const d = localDigits(trimmed);
  return d.length >= 7 ? d : null;
}

export function phoneMatches(phone: string | null | undefined, queryDigits: string) {
  if (!phone) return false;
  const stored = localDigits(phone);
  if (!stored) return false;
  return stored.includes(queryDigits) || queryDigits.includes(stored);
}
