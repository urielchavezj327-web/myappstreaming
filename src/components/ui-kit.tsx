import { Search } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Piezas compartidas por todas las pantallas. Estaban duplicadas en la portada,
 * /grupos, la ficha de vendedor y el panel, cada copia con medidas ligeramente
 * distintas; tenerlas en un solo sitio es lo que mantiene la escala pareja.
 */

/** Pastilla de filtro con conteo. */
export function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border px-4.5 py-3 text-[15px] transition-all active:scale-[0.97] ${
        active
          ? "border-transparent bg-primary font-semibold text-primary-foreground shadow-[0_12px_30px_-16px_rgba(255,255,255,0.75)]"
          : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
      }`}
    >
      {label}
      {count !== undefined ? (
        <span
          className={`rounded-full px-2 py-0.5 text-[12px] tabular-nums ${
            active ? "bg-black/10" : "bg-surface-2"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

/** Encabezado de subsección con regla y conteo. */
export function SectionRule({ label, count }: { label: string; count?: number }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="t-label text-faint">{label}</h2>
      <span className="h-px flex-1 bg-border" aria-hidden />
      {count !== undefined ? (
        <span className="text-[12px] tabular-nums text-faint">{count}</span>
      ) : null}
    </div>
  );
}

/** Estado vacío con icono, título y pista. */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass mt-8 rounded-3xl px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
        <Search className="h-6 w-6 text-faint" />
      </div>
      <p className="mt-5 text-[17px] font-semibold tracking-tight">{title}</p>
      {hint ? <p className="mt-2 t-meta text-faint">{hint}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/** Botón principal de la app. */
export function PrimaryButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`h-13 rounded-xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/** Botón secundario, con borde. */
export function GhostButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`h-13 rounded-xl border border-border px-4 text-[15px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
