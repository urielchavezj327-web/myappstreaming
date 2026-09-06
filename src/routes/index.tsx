import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { memo, useEffect, useMemo, useState } from "react";
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
import { brandSkin, resolveBrand } from "@/lib/brands";
import { Wordmark } from "@/components/wordmark";
import { OfferGroups, SellerOffers } from "@/components/offer-list";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

type IndexSearch = { cat: string; q: string };
type Results = { services: SearchServiceResult[]; sellers: SearchSellerResult[] };

/**
 * Caché de búsquedas en memoria. Al volver de una ficha el buscador no se
 * vuelve a lanzar, así la lista aparece con su altura completa en el primer
 * frame y el navegador puede restaurar la posición exacta de scroll.
 */
const searchCache = new Map<string, Results>();

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    cat: typeof search["cat"] === "string" ? search["cat"] : "",
    q: typeof search["q"] === "string" ? search["q"].slice(0, 80) : "",
  }),
  head: () => ({
    meta: [
      { title: "Stock Index — Comparador de precios de stock digital" },
      {
        name: "description",
        content:
          "Compara en un solo panel los precios de Netflix, Disney+, ViX, música, IA y trámites entre todos los grupos y vendedores.",
      },
      { property: "og:title", content: "Stock Index — Comparador de precios" },
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
      categories: categories.length,
    };
  }, [categories]);

  const current = categories.find((c) => c.slug === cat) ?? categories[0];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="aurora border-b border-border">
        <div className="mx-auto max-w-6xl px-4 pb-9 pt-10 sm:px-6 sm:pb-12 sm:pt-14">
          <StockIndexTitle />

          <SearchField
            value={draft}
            onChange={setDraft}
            onClear={() => setDraft("")}
            busy={loading}
          />

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
                      type="button"
                      aria-pressed={isActive}
                      onClick={() =>
                        navigate({
                          search: (prev: IndexSearch) => ({ ...prev, cat: c.slug }),
                          replace: true,
                        })
                      }
                      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border px-4 py-2.5 text-[14px] transition-all duration-200 active:scale-[0.97] ${
                        isActive
                          ? "border-transparent bg-primary font-semibold text-primary-foreground shadow-[0_12px_30px_-16px_rgba(255,255,255,0.8)]"
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

/**
 * "Stock" en serif ligera y apagada, "Index" tal cual estaba: el peso visual
 * recae en Index. El bloque va ópticamente centrado — el tracking de "Index"
 * añade aire después de la última letra y se compensa con el margen negativo.
 */
function StockIndexTitle() {
  return (
    <h1 className="mb-7 flex items-baseline justify-center text-[2.3rem] leading-none sm:text-[3.4rem]">
      <span className="font-serif text-[0.78em] font-light tracking-[0.01em] text-faint">
        Stock
      </span>
      <span className="ml-[0.3em] -mr-[0.16em] font-display font-light italic tracking-[0.16em] text-muted-foreground">
        Index
      </span>
    </h1>
  );
}

function SearchField({
  value,
  onChange,
  onClear,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  busy: boolean;
}) {
  return (
    <div className="relative mx-auto max-w-3xl">
      <Search
        className={`pointer-events-none absolute left-5 top-1/2 z-10 h-6 w-6 -translate-y-1/2 transition-colors sm:left-6 sm:h-7 sm:w-7 ${
          busy ? "animate-pulse text-foreground" : "text-muted-foreground"
        }`}
        strokeWidth={2}
        aria-hidden
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Buscar servicios, vendedores o precios"
        placeholder="Busca cualquier servicio, vendedor o número…"
        className="glass elev h-16 w-full rounded-3xl pl-16 pr-14 text-[16px] outline-none transition-all placeholder:text-faint focus:border-border-strong sm:pl-[4.25rem] sm:text-[17px] [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Limpiar búsqueda"
          className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
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
    <div className="space-y-4" aria-hidden>
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
            <OfferGroups
              offers={s.offers}
              accent={
                brandSkin(
                  resolveBrand({
                    name: s.name,
                    categorySlug: s.categorySlug ?? null,
                    subcategorySlug: s.subcategorySlug ?? null,
                    color: s.color,
                  }),
                ).accent
              }
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
        <h2 className="mt-1 t-section">{seller.name}</h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {seller.kind === "venta_libre"
            ? (seller.phone ?? "Sin número publicado")
            : "Grupo interno"}{" "}
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

export function FilterChip({
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
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl border px-4 py-2.5 text-[14px] transition-all active:scale-[0.97] ${
        active
          ? "border-transparent bg-primary font-semibold text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${
          active ? "bg-black/10" : "bg-surface-2"
        }`}
      >
        {count}
      </span>
    </button>
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

  // Los nombres de trámites son largos ("No derechohabiente Isssemym"): en
  // mosaico de dos columnas se romperían en cuatro líneas, así que esa
  // categoría se presenta en filas de ancho completo.
  const asRows = category.slug === "tramites";

  return (
    <div className="mt-8 space-y-11">
      {groups.map(([label, list]) => (
        <section key={label || "general"} className="rise">
          {label ? (
            <div className="mb-4 flex items-center gap-3">
              <h2 className="t-label text-faint">{label}</h2>
              <span className="h-px flex-1 bg-border" aria-hidden />
              <span className="text-[11px] tabular-nums text-faint">{list.length}</span>
            </div>
          ) : null}
          <div className={asRows ? "grid gap-2.5" : "grid grid-cols-2 gap-3 lg:grid-cols-3"}>
            {list.map((s) => (
              <ServiceCard key={s.slug} service={s} variant={asRows ? "row" : "tile"} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const ServiceCard = memo(function ServiceCard({
  service,
  variant,
}: {
  service: CatalogService;
  variant: "tile" | "row";
}) {
  const isBundle = service.slug.startsWith(BUNDLE_PREFIX);
  const brand = resolveBrand({
    name: service.name,
    categorySlug: service.category,
    subcategorySlug: isBundle ? service.slug.slice(BUNDLE_PREFIX.length) : service.subcategory,
    color: service.color,
    bundle: isBundle,
  });
  const skin = brandSkin(brand);

  return (
    <Link
      to="/servicio/$slug"
      params={{ slug: service.slug }}
      style={
        {
          background: skin.background,
          borderColor: skin.border,
          "--wordmark-ink": skin.ink,
          "--wordmark-shadow": skin.inkShadow,
        } as React.CSSProperties
      }
      className={`group relative flex flex-col items-center justify-center overflow-hidden border text-center shadow-[0_18px_40px_-26px_rgba(0,0,0,0.9)] transition-transform duration-200 active:scale-[0.985] ${
        variant === "tile"
          ? "cv-tile aspect-[1/0.82] rounded-3xl p-4"
          : "min-h-[88px] rounded-2xl px-5 py-4"
      }`}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: skin.glow }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${skin.accent}, transparent)` }}
        aria-hidden
      />
      <span className="relative flex flex-1 items-center justify-center px-1">
        <Wordmark name={service.name} brand={brand} size={variant === "tile" ? "tile" : "row"} />
      </span>
      <span
        className="relative mt-2 text-[11px] tabular-nums tracking-wide"
        style={{ color: skin.ink, opacity: 0.72 }}
      >
        {service.offers} oferta{service.offers === 1 ? "" : "s"}
      </span>
    </Link>
  );
});
