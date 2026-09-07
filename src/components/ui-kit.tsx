import { Search } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Piezas compartidas por todas las pantallas. Estaban duplicadas en la portada,
 * /grupos, la ficha de vendedor y el panel, cada copia con medidas ligeramente
 * distintas; tenerlas en un solo sitio es lo que mantiene la escala pareja.
 *
 * Todas hablan el mismo idioma que las tarjetas de marca: vidrio traslúcido,
 * filo de luz arriba, sombra en capas y respuesta al toque.
 */

/**
 * Pastilla de filtro.
 *
 * El estado activo no cambia solo el fondo: sube de peso, enciende el acento
 * de la app, gana un halo y el contador pasa a ser un bloque sólido. Así se
 * distingue de un vistazo cuál está puesta, incluso de reojo mientras se
 * desliza la tira.
 */
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
      className={`tappable group flex h-[3.1rem] shrink-0 items-center gap-2.5 whitespace-nowrap rounded-2xl border pl-4.5 pr-3 text-[15px] ${
        active
          ? "border-brand/45 bg-brand/15 font-bold text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_10px_30px_-16px_var(--brand-glow)]"
          : "glass font-medium text-muted-foreground hover:border-border-strong hover:text-foreground"
      }`}
    >
      {label}
      {count !== undefined ? (
        <span
          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-lg px-1.5 text-[12px] font-bold tabular-nums transition-colors ${
            active ? "bg-brand text-brand-ink" : "bg-surface-2 text-faint"
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
    <div className="glass lightedge mt-8 rounded-[1.75rem] px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-2">
        <Search className="h-7 w-7 text-faint" />
      </div>
      <p className="mt-6 t-subtitle">{title}</p>
      {hint ? <p className="mx-auto mt-2 max-w-sm t-meta text-faint">{hint}</p> : null}
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}

/** Botón principal: el acento de la app, sólido y con halo. */
export function PrimaryButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`tappable inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[15px] font-bold text-brand-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_10px_28px_-12px_var(--brand-glow)] disabled:opacity-45 disabled:shadow-none ${className}`}
    >
      {children}
    </button>
  );
}

/** Botón secundario: el mismo vidrio que las tarjetas. */
export function GhostButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`glass tappable inline-flex h-13 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold text-muted-foreground hover:border-border-strong hover:text-foreground disabled:opacity-45 ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Botón de acción destacada con línea de apoyo, para las acciones que abren un
 * panel entero («Crear servicio nuevo»). Ocupa el ancho porque es una decisión,
 * no un enlace suelto.
 */
export function ActionCard({
  icon,
  title,
  hint,
  ...rest
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="glass lightedge tappable flex w-full items-center gap-3.5 rounded-2xl px-4 py-4 text-left hover:border-brand/40"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink shadow-[0_8px_22px_-10px_var(--brand-glow)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-bold tracking-tight text-foreground">
          {title}
        </span>
        {hint ? <span className="mt-0.5 block text-[13px] text-faint">{hint}</span> : null}
      </span>
    </button>
  );
}
