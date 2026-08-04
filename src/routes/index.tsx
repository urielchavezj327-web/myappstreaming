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
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Panel de precios
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-[1.05] sm:text-5xl">
            Todo el stock de tus grupos, comparado en un solo lugar.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            {totals.offers} precios de {totals.services} servicios, ordenados del más barato al más
            caro y separados por duración y tipo de producto.
          </p>

          <div className="mt-8 max-w-xl">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar Netflix, Spotify, acta de nacimiento…"
              className="h-12 w-full rounded-xl border border-input bg-surface px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-border-strong"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-12">
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
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setActive(c.slug)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    c.slug === (current?.slug ?? "")
                      ? "border-border-strong bg-primary text-primary-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.name}
                  <span className="ml-2 text-xs opacity-60">{c.services.length}</span>
                </button>
              ))}
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
    <div className="mt-8 space-y-10">
      {[...groups.entries()].map(([label, list]) => (
        <section key={label || "general"}>
          {label ? (
            <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </h2>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{service.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {showCategory ? `${service.categoryName} · ` : ""}
            {service.offers} oferta{service.offers === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Desde</p>
          <p className="text-lg font-semibold tabular-nums">{formatPrice(service.minPrice)}</p>
        </div>
      </div>
    </Link>
  );
}
