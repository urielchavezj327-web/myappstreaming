import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          search={{ cat: "", q: "" }}
          aria-label="Ir al catálogo"
          className="flex min-w-0 items-baseline gap-1.5 transition-opacity hover:opacity-80"
        >
          <span className="font-serif text-[19px] font-light leading-none text-faint">Stock</span>
          <span className="font-display text-[19px] font-light italic leading-none tracking-[0.1em] text-foreground">
            Index
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1 text-[13px] text-muted-foreground">
          <Link
            to="/"
            search={{ cat: "", q: "" }}
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-surface-2 text-foreground" }}
            className="rounded-xl px-3 py-2 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Catálogo
          </Link>
          <Link
            to="/grupos"
            activeProps={{ className: "bg-surface-2 text-foreground" }}
            className="rounded-xl px-3 py-2 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Grupos
          </Link>
          <Link
            to="/agregar"
            aria-label="Agregar stock"
            activeProps={{ className: "bg-surface-2 text-foreground" }}
            className="ml-1 flex items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] font-medium text-foreground transition-all hover:bg-surface-2 active:scale-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            <span className="hidden sm:inline">Agregar</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-10 text-[12px] leading-relaxed text-faint sm:px-6">
        Precios de referencia recopilados de grupos y vendedores. Verifica disponibilidad antes de
        pagar.
      </div>
    </footer>
  );
}
