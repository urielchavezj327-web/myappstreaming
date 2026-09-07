import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import {
  BUNDLE_PREFIX,
  getCatalog,
  searchStock,
  type CatalogCategory,
  type CatalogService,
  type SearchSellerResult,
  type SearchServiceResult,
} from "@/lib/catalog.functions";
import { brandAccent } from "@/lib/brands";
import { AppWordmark } from "@/components/wordmark-app";
import { BrandCard } from "@/components/brand-card";
import { OfferGroups, SellerOffers } from "@/components/offer-list";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { EmptyState, FilterChip, SectionRule } from "@/components/ui-kit";

type IndexSearch = { cat: string; q: string };
type Results = { services: SearchServiceResult[]; sellers: SearchSellerResult[] };

/**
 * Caché de búsquedas en memoria. Al volver de una ficha el buscador no se
 * vuelve a lanzar, así la lista aparece con su altura completa en el primer
 * frame y se puede restaurar la posición exacta de scroll.
 */
const searchCache = new Map<string, Results>();

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    cat: typeof search["cat"] === "string" ? search["cat"] : "",
    q: typeof search["q"] === "string" ? search["q"].slice(0, 80) : "",
  }),
  head: () => ({
    meta: [
      { title: "Stockdex — Índice de precios de stock digital" },
      {
        name: "description",
        content:
          "Compara en un solo panel los precios de Netflix, Disney+, ViX, música, IA y trámites entre todos los grupos y vendedores.",
      },
      { property: "og:title", content: "Stockdex — Índice de precios" },
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
  // Al volver atrás se reutiliza el catálogo ya cargado: la página se pinta
  // completa de inmediato y no se pierde la posición de scroll.
  staleTime: 5 * 60_000,
  component: Index,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-md p-10 text-center text-[15px] text-muted-foreground">
      No se pudo cargar: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10">Sin datos.</div>,
});

function Index() {
  const { categories } = Route.useLoaderData() as { categories: CatalogCategory[] };
  const { cat, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const runSearch = useServerFn(searchStock);

  const [draft, setDraft] = useState(q);
  const [results, setResults] = useState<Results | null>(() => searchCache.get(q.trim()) ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setDraft(q), [q]);

  const searching = q.trim().length > 1;

  useEffect(() => {
    if (!searching) {
      setResults(null);
      return;
    }
    const cached = searchCache.get(q.trim());
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    runSearch({ data: { q } })
      .then((r) => {
        searchCache.set(q.trim(), r);
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
      if (draft !== q)
        navigate({ search: (prev: IndexSearch) => ({ ...prev, q: draft }), replace: true });
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
  const nf = new Intl.NumberFormat("es-MX");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="aurora border-b border-border">
        <div className="mx-auto max-w-3xl px-4 pb-9 pt-11 sm:px-6 sm:pb-12 sm:pt-16">
          <AppWordmark />

          <div className="relative mx-auto mt-10">
            <Search
              className={`pointer-events-none absolute left-5 top-1/2 z-10 h-6 w-6 -translate-y-1/2 transition-colors sm:left-6 sm:h-7 sm:w-7 ${
                loading ? "animate-pulse text-foreground" : "text-muted-foreground"
              }`}
              strokeWidth={2}
              aria-hidden
            />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Buscar servicios, vendedores o precios"
              placeholder="Servicio, vendedor o teléfono…"
              className="frost h-[4.5rem] w-full rounded-[1.6rem] pl-16 pr-14 text-[17px] outline-none transition-all placeholder:text-faint focus:border-brand/60 focus:shadow-[var(--shadow-lift),0_0_0_4px_var(--brand-glow)] sm:pl-[4.5rem] sm:text-[18px] [&::-webkit-search-cancel-button]:hidden"
            />
            {draft ? (
              <button
                type="button"
                onClick={() => setDraft("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          {/*
            Los tres contadores ocupaban una banda entera sobre el catálogo y
            empujaban las tarjetas fuera de pantalla. La misma información cabe
            en una línea discreta.
          */}
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center text-[13.5px] text-faint">
            <Count value={nf.format(totals.offers)} label="ofertas" />
            <span aria-hidden>·</span>
            <Count value={nf.format(totals.services)} label="servicios" />
            <span aria-hidden>·</span>
            <Count value={String(categories.length)} label="categorías" />
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {searching ? (
          <SearchResults results={results} loading={loading} query={q} />
        ) : (
          <>
            <nav
              aria-label="Categorías"
              className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
            >
              <div className="flex w-max min-w-full flex-nowrap gap-2.5">
                {categories.map((c) => (
                  <FilterChip
                    key={c.slug}
                    active={c.slug === (current?.slug ?? "")}
                    onClick={() =>
                      navigate({
                        search: (prev: IndexSearch) => ({ ...prev, cat: c.slug }),
                        replace: true,
                      })
                    }
                    label={c.name}
                    count={c.services.length}
                  />
                ))}
              </div>
            </nav>

            {current && current.services.length > 0 ? (
              <CategoryBlock key={current.slug} category={current} />
            ) : (
              <EmptyState title="Esta categoría todavía no tiene stock" />
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

/** Un contador: la cifra en tono pleno, la palabra en terciario. */
function Count({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-display text-[15px] font-bold tabular-nums text-muted-foreground">
        {value}
      </span>
      {label}
    </span>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-28 rounded-2xl" />
      ))}
    </div>
  );
}

function SearchResults({
  results,
  loading,
  query,
}: {
  results: Results | null;
  loading: boolean;
  query: string;
}) {
  if (loading && !results) return <SearchSkeleton />;

  const services = results?.services ?? [];
  const sellers = results?.sellers ?? [];
  if (services.length === 0 && sellers.length === 0) {
    return (
      <EmptyState
        title={`Sin resultados para “${query}”`}
        hint="Prueba con menos palabras, el nombre del servicio, el vendedor o su teléfono."
      />
    );
  }

  return (
    <div className="space-y-14">
      {services.map((s) => (
        <section key={s.slug} className="rise">
          <div className="flex items-end justify-between gap-3 border-b border-border pb-3.5">
            <div className="min-w-0">
              <p className="t-label text-faint">{s.categoryName}</p>
              <h2 className="mt-1.5 truncate t-section">{s.name}</h2>
            </div>
            <Link
              to="/servicio/$slug"
              params={{ slug: s.slug }}
              className="shrink-0 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver ficha →
            </Link>
          </div>
          <div className="mt-6">
            <OfferGroups
              offers={s.offers}
              accent={brandAccent({
                name: s.name,
                categorySlug: s.categorySlug ?? null,
                subcategorySlug: s.subcategorySlug ?? null,
                color: s.color,
              })}
            />
          </div>
        </section>
      ))}

      {sellers.map((v) => (
        <SellerResult key={v.slug} seller={v} />
      ))}
    </div>
  );
}

function SellerResult({ seller }: { seller: SearchSellerResult }) {
  const [category, setCategory] = useState<string>("");

  const categories = useMemo(() => {
    const map = new Map<string, { name: string; order: number; count: number }>();
    for (const o of seller.offers) {
      const key = o.categorySlug ?? "otros";
      const cur = map.get(key);
      if (cur) cur.count += 1;
      else
        map.set(key, { name: o.categoryName ?? "Otros", order: o.categoryOrder ?? 99, count: 1 });
    }
    return [...map.entries()].sort((a, b) => a[1].order - b[1].order);
  }, [seller.offers]);

  const visible = category
    ? seller.offers.filter((o) => (o.categorySlug ?? "otros") === category)
    : seller.offers;

  return (
    <section className="rise">
      <div className="border-b border-border pb-4">
        {seller.parentGroup ? <p className="t-label text-faint">{seller.parentGroup}</p> : null}
        <h2 className="mt-1.5 t-section">{seller.name}</h2>
        <p className="mt-2 t-meta text-muted-foreground">
          {seller.kind === "venta_libre" ? (seller.phone ?? "Sin número publicado") : "Mis Grupos"}{" "}
          · {seller.offers.length} ofertas
        </p>
      </div>

      {categories.length > 1 ? (
        <div className="no-scrollbar -mx-4 mt-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max min-w-full flex-nowrap gap-2.5">
            <FilterChip
              active={category === ""}
              onClick={() => setCategory("")}
              label="Todo"
              count={seller.offers.length}
            />
            {categories.map(([slug, info]) => (
              <FilterChip
                key={slug}
                active={category === slug}
                onClick={() => setCategory(slug)}
                label={info.name}
                count={info.count}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <SellerOffers offers={visible} freeMarket={seller.kind === "venta_libre"} />
      </div>
    </section>
  );
}

function CategoryBlock({ category }: { category: CatalogCategory }) {
  const groups = useMemo(() => {
    const map = new Map<string, CatalogService[]>();
    for (const s of category.services) {
      const key = s.subcategoryName ?? "";
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [category.services]);

  // Los nombres de trámites son largos ("Constancia de no derechohabiencia"):
  // en mosaico de dos columnas se romperían en cuatro líneas, así que esa
  // categoría se presenta en filas anchas.
  const asRows = category.slug === "tramites";

  return (
    <div className="mt-9 space-y-12">
      {groups.map(([label, list]) => (
        <section key={label || "general"} className="rise">
          {label ? <SectionRule label={label} count={list.length} /> : null}
          <div
            className={
              asRows
                ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                : "grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            }
          >
            {list.map((s) => {
              const isBundle = s.slug.startsWith(BUNDLE_PREFIX);
              return (
                <BrandCard
                  key={s.slug}
                  to={s.slug}
                  name={s.name}
                  offers={s.offers}
                  variant={asRows ? "row" : "tile"}
                  brandInput={{
                    name: s.name,
                    categorySlug: s.category,
                    subcategorySlug: isBundle ? s.slug.slice(BUNDLE_PREFIX.length) : s.subcategory,
                    color: s.color,
                    bundle: isBundle,
                  }}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
