import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          search={{ cat: "", q: "" }}
          className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-white to-white/70 text-sm font-bold text-primary-foreground shadow-[0_8px_24px_-10px_rgba(255,255,255,0.55)]">
            U
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight">Uri</span>
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
            className="ml-1 flex items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 py-2 text-[13px] font-medium text-foreground transition-all hover:bg-surface-2 active:scale-95"
          >
            <span aria-hidden className="text-base leading-none">
              +
            </span>
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
