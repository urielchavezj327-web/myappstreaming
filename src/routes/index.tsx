import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import {
  getCatalog,
  searchStock,
  type CatalogCategory,
  type CatalogService,
  type SearchSellerResult,
  type SearchServiceResult,
} from "@/lib/catalog.functions";
import { formatPrice } from "@/lib/format";
import { OfferGroups } from "@/components/offer-list";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

type IndexSearch = { cat: string; q: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    cat: typeof search["cat"] === "string" ? search["cat"] : "",
    q: typeof search["q"] === "string" ? search["q"].slice(0, 80) : "",
  }),
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
  const { cat, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const runSearch = useServerFn(searchStock);

  const [draft, setDraft] = useState(q);
  const [results, setResults] = useState<{
    services: SearchServiceResult[];
    sellers: SearchSellerResult[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setDraft(q), [q]);

  const searching = q.trim().length > 1;

  useEffect(() => {
    if (!searching) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    runSearch({ data: { q } })
      .then((r) => {
        if (!cancelled) setResults(r);
      })
      .catch(() => {
        if (!cancelled) setResults({ services: [], sellers: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, searching, runSearch]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (draft !== q) navigate({ search: (prev) => ({ ...prev, q: draft }), replace: true });
    }, 320);
    return () => clearTimeout(id);
  }, [draft, q, navigate]);

  const totals = useMemo(() => {
    const services = categories.flatMap((c) => c.services);
    return {
      services: services.length,
      offers: services.reduce((acc, s) => acc + s.offers, 0),
    };
  }, [categories]);

  const current = categories.find((c) => c.slug === cat) ?? categories[0];

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
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Buscar ViX, Spotify, acta, o un número de vendedor…"
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
          <SearchResults results={results} loading={loading} query={q} />
        ) : (
          <>
            <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
              <div className="flex w-max min-w-full flex-nowrap gap-2">
                {categories.map((c) => {
                  const isActive = c.slug === (current?.slug ?? "");
                  return (
                    <button
                      key={c.slug}
                      onClick={() =>
                        navigate({ search: (prev) => ({ ...prev, cat: c.slug }), replace: true })
                      }
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

function SearchResults({
  results,
  loading,
  query,
}: {
  results: { services: SearchServiceResult[]; sellers: SearchSellerResult[] } | null;
  loading: boolean;
  query: string;
}) {
  if (loading && !results) {
    return <p className="text-sm text-muted-foreground">Buscando “{query}”…</p>;
  }
  const services = results?.services ?? [];
  const sellers = results?.sellers ?? [];
  if (services.length === 0 && sellers.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin resultados para “{query}”.</p>;
  }

  return (
    <div className="space-y-12">
      {services.map((s) => (
        <section key={s.slug}>
          <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {s.categoryName}
              </p>
              <h2 className="mt-0.5 truncate text-lg sm:text-xl">{s.name}</h2>
            </div>
            <Link
              to="/servicio/$slug"
              params={{ slug: s.slug }}
              className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Ver ficha →
            </Link>
          </div>
          <div className="mt-5">
            <OfferGroups offers={s.offers} accent={s.color ?? "#8b8b8b"} />
          </div>
        </section>
      ))}

      {sellers.map((v) => (
        <section key={v.slug}>
          <div className="border-b border-border pb-3">
            {v.parentGroup ? (
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {v.parentGroup}
              </p>
            ) : null}
            <h2 className="mt-0.5 text-lg sm:text-xl">{v.name}</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {v.kind === "venta_libre" ? (v.phone ?? "Sin número publicado") : "Grupo interno"} ·{" "}
              {v.offers.length} ofertas
            </p>
          </div>
          <div className="mt-5">
            <OfferGroups
              offers={v.offers}
              accent="#8b8b8b"
              freeMarket={v.kind === "venta_libre"}
              showService
            />
          </div>
        </section>
      ))}
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

function ServiceCard({ service }: { service: CatalogService }) {
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
