import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  getCatalog,
  type CatalogCategory,
  type CatalogService,
} from "@/lib/catalog.functions";
import { formatPrice } from "@/lib/format";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Comparador de Stock — Precios de streaming y trámites" },
      {
        name: "description",
        content:
          "Compara en un solo panel los precios de Netflix, Disney+, ViX, música, IA y trámites entre todos los grupos y vendedores.",
      },
      { property: "og:title", content: "Comparador de Stock — Precios de streaming y trámites" },
      {
        property: "og:description",
        content:
          "Todos los grupos y vendedores en un panel: precios ordenados de menor a mayor por app, duración y tipo de producto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getCatalog(),
  component: Index,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-muted-foreground">No se pudo cargar: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-10">Sin datos.</div>,
});

function Index() {
  const { categories } = Route.useLoaderData() as { categories: CatalogCategory[] };
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>(categories[0]?.slug ?? "streaming");

  const totals = useMemo(() => {
    const services = categories.flatMap((c) => c.services);
    return {
      services: services.length,
      offers: services.reduce((acc, s) => acc + s.offers, 0),
    };
  }, [categories]);

  const searching = query.trim().length > 1;
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searching) return [];
    return categories
      .flatMap((c) => c.services)
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.categoryName.toLowerCase().includes(q) ||
          (s.subcategoryName ?? "").toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [categories, query, searching]);

  const current = categories.find((c) => c.slug === active) ?? categories[0];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="grid-bg border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-11 sm:px-5 sm:py-16">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
            Panel de precios
          </p>
          <h1 className="mt-4 max-w-2xl text-[2rem] leading-[1.05] sm:text-5xl">
            Todo el stock de tus grupos, comparado en un solo lugar.
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
            Inteligencia de precios en tiempo real: cada servicio, cada vendedor y cada duración
            frente a frente, para que nunca pagues de más.
          </p>

          <div className="mt-7 max-w-xl">
            <div className="relative">
              <span
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              >
                ⌕
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar Netflix, Spotify, acta de nacimiento…"
                className="h-12 w-full rounded-2xl border border-input bg-surface/80 pl-10 pr-4 text-sm outline-none ring-0 transition-all placeholder:text-muted-foreground focus:border-border-strong focus:bg-surface-2"
              />
            </div>
            <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="tabular-nums">{totals.offers} ofertas</span>
              <span className="h-1 w-1 rounded-full bg-border-strong" aria-hidden />
              <span className="tabular-nums">{totals.services} servicios</span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-9 sm:px-5 sm:py-12">
        {searching ? (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground">
              {results.length} resultado{results.length === 1 ? "" : "s"} para “{query}”
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((s) => (
                <ServiceCard key={s.slug} service={s} showCategory />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
              <div className="flex w-max min-w-full flex-nowrap gap-2">
                {categories.map((c) => {
                  const isActive = c.slug === (current?.slug ?? "");
                  return (
                    <button
                      key={c.slug}
                      onClick={() => setActive(c.slug)}
                      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition-all duration-200 active:scale-[0.97] ${
                        isActive
                          ? "border-transparent bg-primary text-primary-foreground shadow-[0_8px_24px_-12px_rgba(255,255,255,0.6)]"
                          : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
                      }`}
                    >
                      {c.name}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                          isActive ? "bg-black/10" : "bg-surface-2"
                        }`}
                      >
                        {c.services.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {current ? <CategoryBlock services={current.services} /> : null}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function CategoryBlock({ services }: { services: CatalogService[] }) {
  const groups = new Map<string, CatalogService[]>();
  for (const s of services) {
    const key = s.subcategoryName ?? "";
    const list = groups.get(key) ?? [];
    list.push(s);
    groups.set(key, list);
  }

  return (
    <div className="mt-7 space-y-9">
      {[...groups.entries()].map(([label, list]) => (
        <section key={label || "general"}>
          {label ? (
            <h2 className="mb-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {label}
            </h2>
          ) : null}
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ServiceCard({
  service,
  showCategory = false,
}: {
  service: CatalogService;
  showCategory?: boolean;
}) {
  const accent = service.color ?? "#8b8b8b";
  return (
    <Link
      to="/servicio/$slug"
      params={{ slug: service.slug }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:border-border-strong hover:bg-surface-2 active:scale-[0.99]"
    >
      <span
        className="absolute inset-x-0 top-0 h-[2px] opacity-80 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight">{service.name}</h3>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            {showCategory ? `${service.categoryName} · ` : ""}
            {service.offers} oferta{service.offers === 1 ? "" : "s"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Desde</p>
          <p className="text-lg font-semibold tabular-nums">{formatPrice(service.minPrice)}</p>
        </div>
      </div>
    </Link>
  );
}
