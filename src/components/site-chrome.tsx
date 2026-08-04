import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            CS
          </span>
          <span className="text-sm font-semibold tracking-tight">Comparador de Stock</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Catálogo
          </Link>
          <Link
            to="/grupos"
            className="rounded-md px-3 py-1.5 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Grupos
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-10 text-xs text-muted-foreground">
        Precios de referencia recopilados de grupos y vendedores. Verifica disponibilidad antes de
        pagar.
      </div>
    </footer>
  );
}
