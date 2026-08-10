import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { memo, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import {
  getCatalog,
  searchStock,
  type CatalogCategory,
  type CatalogService,
  type SearchSellerResult,
  type SearchServiceResult,
} from "@/lib/catalog.functions";
import { formatPrice } from "@/lib/format";
import { OfferGroups, SellerOffers } from "@/components/offer-list";
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
    <div className="mx-auto max-w-md p-10 text-center text-sm text-muted-foreground">
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
      categories: categories.length,
    };
  }, [categories]);

  const current = categories.find((c) => c.slug === cat) ?? categories[0];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="aurora border-b border-border">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14">
          <h1 className="mb-7 text-center font-display text-[2.3rem] leading-none sm:text-[3.4rem]">
            <span className="font-semibold tracking-[0.02em]">Stock</span>
            <span className="ml-[0.35em] font-light italic tracking-[0.16em] text-muted-foreground">
              Index
            </span>
          </h1>
          <div className="relative mx-auto max-w-3xl">
            <Search
              className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground sm:left-6 sm:h-7 sm:w-7"
              strokeWidth={2}
              aria-hidden
            />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Buscar servicios, vendedores o precios"
              placeholder="Busca cualquier servicio, vendedor o número…"
              className="glass elev h-16 w-full rounded-3xl pl-16 pr-14 text-[16px] outline-none transition-all placeholder:text-faint focus:border-border-strong sm:pl-[4.25rem] sm:text-[17px]"
            />

            {draft ? (
              <button
                type="button"
                onClick={() => setDraft("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <dl className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-2.5">
            <Stat label="Ofertas" value={totals.offers} />
            <Stat label="Servicios" value={totals.services} />
            <Stat label="Categorías" value={totals.categories} />
          </dl>
        </div>

      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {searching ? (
          <SearchResults results={results} loading={loading} query={q} />
        ) : (
          <>
            <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              <div className="flex w-max min-w-full flex-nowrap gap-2">
                {categories.map((c) => {
                  const isActive = c.slug === (current?.slug ?? "");
                  return (
                    <button
                      key={c.slug}
                      onClick={() =>
                        navigate({
                          search: (prev: IndexSearch) => ({ ...prev, cat: c.slug }),
                          replace: true,
                        })
                      }
                      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border px-4 py-2.5 text-[14px] transition-all duration-200 active:scale-[0.97] ${
                        isActive
                          ? "border-transparent bg-primary font-medium text-primary-foreground shadow-[0_10px_28px_-14px_rgba(255,255,255,0.7)]"
                          : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
                      }`}
                    >
                      {c.name}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${
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

            {current && current.services.length > 0 ? (
              <CategoryBlock key={current.slug} services={current.services} />
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl px-3.5 py-3">
      <dd className="text-[22px] font-semibold tabular-nums tracking-tight sm:text-[26px]">
        {new Intl.NumberFormat("es-MX").format(value)}
      </dd>
      <dt className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-faint">{label}</dt>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="glass mt-8 rounded-3xl px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2">
        <Search className="h-5 w-5 text-faint" />
      </div>
      <p className="mt-4 text-[15px] font-medium">{title}</p>
      {hint ? <p className="mt-1.5 text-[13px] text-faint">{hint}</p> : null}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-24 rounded-2xl" />
      ))}
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
          <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
            <div className="min-w-0">
              <p className="t-label text-faint">{s.categoryName}</p>
              <h2 className="mt-1 truncate t-title">{s.name}</h2>
            </div>
            <Link
              to="/servicio/$slug"
              params={{ slug: s.slug }}
              className="shrink-0 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver ficha →
            </Link>
          </div>
          <div className="mt-5">
            <OfferGroups offers={s.offers} accent={s.color ?? "#9a9aa2"} />
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
        map.set(key, {
          name: o.categoryName ?? "Otros",
          order: o.categoryOrder ?? 99,
          count: 1,
        });
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
        <h2 className="mt-1 t-title">{seller.name}</h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {seller.kind === "venta_libre" ? (seller.phone ?? "Sin número publicado") : "Grupo interno"}{" "}
          · {seller.offers.length} ofertas
        </p>
      </div>

      {categories.length > 1 ? (
        <div className="no-scrollbar -mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max min-w-full flex-nowrap gap-2">
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

      <div className="mt-5">
        <SellerOffers offers={visible} freeMarket={seller.kind === "venta_libre"} />
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl border px-3.5 py-2 text-[13px] transition-all active:scale-[0.97] ${
        active
          ? "border-transparent bg-primary font-medium text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
          active ? "bg-black/10" : "bg-surface-2"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function CategoryBlock({ services }: { services: CatalogService[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, CatalogService[]>();
    for (const s of services) {
      const key = s.subcategoryName ?? "";
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [services]);

  return (
    <div className="mt-8 space-y-10">
      {[...groups.entries()].map(([label, list]) => (
        <section key={label || "general"} className="rise">
          {label ? <h2 className="mb-3.5 t-label text-faint">{label}</h2> : null}
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

const ServiceCard = memo(function ServiceCard({ service }: { service: CatalogService }) {
  const accent = service.color ?? "#9a9aa2";
  return (
    <Link
      to="/servicio/$slug"
      params={{ slug: service.slug }}
      className="glass card-cv group relative overflow-hidden rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_28px_60px_-30px_rgba(0,0,0,0.95)] active:scale-[0.99]"
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-25 transition-opacity duration-300 group-hover:opacity-45"
        style={{ background: `radial-gradient(120% 100% at 0% 0%, ${accent}, transparent 70%)` }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
        aria-hidden
      />
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold tracking-tight">{service.name}</h3>
          <p className="mt-1 truncate text-[12px] text-muted-foreground">
            {service.offers} oferta{service.offers === 1 ? "" : "s"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Desde</p>
          <p className="text-[21px] font-semibold tabular-nums tracking-tight">
            {formatPrice(service.minPrice)}
          </p>
        </div>
      </div>
    </Link>
  );
}
