import { Link } from "@tanstack/react-router";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { AppWordmark } from "@/components/wordmark-app";
import { ViewSettingsSheet } from "@/components/view-settings";

const navLink =
  "rounded-xl px-3.5 py-2.5 text-[15px] transition-colors hover:bg-surface-2 hover:text-foreground";

/**
 * `style` va en el propio `<header>`, no en un envoltorio: la barra es
 * `sticky`, y un `div` alrededor la encierra en su propia altura y deja de
 * pegarse al bajar. Lo usa la ficha para darle los tonos de SU zona, que no
 * siempre son los del cuerpo.
 */
export function SiteHeader({ style }: { style?: React.CSSProperties }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header // Sin desenfoque: el filtro emborronaba el color de la ficha justo debajo del
      // encabezado y dejaba una banda turbia entre la barra y el logotipo.
      className="sticky top-0 z-40 border-b border-border bg-[var(--chrome-bg,var(--background))]"
      style={style}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          search={{ cat: "", q: "" }}
          aria-label="Ir al catálogo"
          className="flex min-w-0 items-center transition-opacity hover:opacity-80"
        >
          <AppWordmark size="bar" />
        </Link>

        <nav className="flex shrink-0 items-center gap-1 text-muted-foreground">
          <Link
            to="/"
            search={{ cat: "", q: "" }}
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-surface-2 text-foreground" }}
            className={`hidden sm:block ${navLink}`}
          >
            Catálogo
          </Link>
          <Link
            to="/grupos"
            activeProps={{ className: "bg-surface-2 text-foreground" }}
            className={navLink}
          >
            Grupos
          </Link>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Preferencias de vista"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" />
          </button>
          <Link
            to="/agregar"
            aria-label="Panel privado"
            activeProps={{ className: "bg-surface-2 text-foreground" }}
            className="ml-0.5 flex h-10 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3.5 text-[15px] font-medium text-foreground transition-all hover:bg-surface-2 active:scale-95"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
            <span className="hidden sm:inline">Agregar</span>
          </Link>
        </nav>
      </div>

      {settingsOpen ? <ViewSettingsSheet onClose={() => setSettingsOpen(false)} /> : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    // Antes eran 96 px de aire entre el final del contenido y el pie: en el
    // celular se leía como que la página se había acabado dos veces.
    <footer className="mt-10 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-3 px-4 py-7 sm:px-6">
        <p className="t-meta max-w-md text-faint">
          Precios de referencia recopilados de grupos y vendedores de WhatsApp. Verifica
          disponibilidad y precio con el vendedor antes de pagar.
        </p>
        <p className="text-[13px] text-faint">Stockdex</p>
      </div>
    </footer>
  );
}
