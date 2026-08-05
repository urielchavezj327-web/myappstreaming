import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-[0_6px_20px_-8px_rgba(255,255,255,0.5)]">
            U
          </span>
          <span className="truncate text-sm font-semibold tracking-tight">Uri</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-surface-2 text-foreground" }}
            className="rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Catálogo
          </Link>
          <Link
            to="/grupos"
            activeProps={{ className: "bg-surface-2 text-foreground" }}
            className="rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Grupos
          </Link>
          <Link
            to="/agregar"
            aria-label="Agregar stock"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl border border-border-strong bg-surface text-base text-foreground transition-colors hover:bg-surface-2"
          >
            +
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-8 text-[11px] leading-relaxed text-muted-foreground sm:px-5">
        Precios de referencia recopilados de grupos y vendedores. Verifica disponibilidad antes de
        pagar.
      </div>
    </footer>
  );
}
