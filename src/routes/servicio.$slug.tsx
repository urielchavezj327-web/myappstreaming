import { createFileRoute, Link, notFound, useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";

import { getServiceDetail, type StockOffer } from "@/lib/catalog.functions";
import { brandSkin, resolveBrand } from "@/lib/brands";
import { formatPrice } from "@/lib/format";
import { Wordmark } from "@/components/wordmark";
import { OfferSection } from "@/components/offer-list";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

type Detail = {
  service: {
    slug: string;
    name: string;
    color: string | null;
    category: string;
    categoryName: string;
    subcategory: string | null;
  };
  offers: StockOffer[];
  bundle?: boolean;
};

export const Route = createFileRoute("/servicio/$slug")({
  loader: async ({ params }) => {
    const data = (await getServiceDetail({ data: { slug: params.slug } })) as Detail | null;
    if (!data) throw notFound();
    return data;
  },
  // Volver al catálogo reutiliza esta ficha ya cargada, sin recargarla.
  staleTime: 5 * 60_000,
  head: ({ loaderData }) => {
    const name = (loaderData as Detail | undefined)?.service.name;
    if (!name) {
      return {
        meta: [{ title: "Servicio no encontrado" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${name} — precios comparados | Stockdex`;
    const description = `Todos los precios de ${name} ordenados de menor a mayor, separados por tipo de producto y duración.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ServicePage,
  errorComponent: ({ error }) => (
    <div className="p-10 t-meta text-muted-foreground">No se pudo cargar: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-10 t-meta text-muted-foreground">Ese servicio no existe.</div>
  ),
});

function ServicePage() {
  const { service, offers, bundle } = Route.useLoaderData() as Detail;
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const brand = resolveBrand({
    name: service.name,
    categorySlug: service.category,
    subcategorySlug: service.subcategory,
    color: service.color,
    bundle: Boolean(bundle),
  });
  const skin = brandSkin(brand, "hero");

  const internal = offers.filter((o) => o.group.kind === "interno");
  const free = offers.filter((o) => o.group.kind !== "interno");

  const summary = useMemo(() => {
    const priced = offers.filter((o) => o.price !== null).map((o) => o.price as number);
    return {
      min: priced.length ? Math.min(...priced) : null,
      max: priced.length ? Math.max(...priced) : null,
      sellers: new Set(offers.map((o) => o.group.slug)).size,
    };
  }, [offers]);

  // Cuando es una colección (ej. Páginas para Adultos), se separa por servicio.
  const bundleSections = new Map<string, StockOffer[]>();
  if (bundle) {
    for (const o of offers) {
      const key = o.serviceName ?? "—";
      bundleSections.set(key, [...(bundleSections.get(key) ?? []), o]);
    }
  }

  return (
    <div
      className="relative min-h-screen"
      style={
        { "--wordmark-ink": skin.ink, "--wordmark-shadow": skin.inkShadow } as React.CSSProperties
      }
    >
      {/*
        El color de la marca cubre la ficha entera, no solo el encabezado: se
        pinta como capa fija y se desvanece hacia el fondo de la app, de modo
        que la página completa queda teñida sin restar contraste a las listas.
      */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{ background: skin.background }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, var(--color-background) 74%, var(--color-background) 100%)",
          opacity: 0.92,
        }}
        aria-hidden
      />

      <SiteHeader />

      <header className="relative overflow-hidden">
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: skin.glow }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-4 pt-5 sm:px-6 sm:pt-7">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => router.history.back()}
              className="inline-flex items-center gap-2 text-[14px] transition-opacity hover:opacity-70"
              style={{ color: skin.ink, opacity: 0.78 }}
            >
              <ArrowLeft className="h-[18px] w-[18px]" /> Volver al catálogo
            </button>
          ) : (
            <Link
              to="/"
              search={{ cat: service.category, q: "" }}
              className="inline-flex items-center gap-2 text-[14px] transition-opacity hover:opacity-70"
              style={{ color: skin.ink, opacity: 0.78 }}
            >
              <ArrowLeft className="h-[18px] w-[18px]" /> Volver al catálogo
            </Link>
          )}

          <p className="mt-7 text-center t-label" style={{ color: skin.ink, opacity: 0.6 }}>
            {service.categoryName}
          </p>

          {/* El logotipo manda en la ficha: ocupa el ancho y nada compite con él. */}
          <div className="wordmark-box mt-4 flex justify-center pb-9">
            <Wordmark name={service.name} brand={brand} size="hero" />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 pb-10 sm:px-6">
        {offers.length > 0 ? (
          <SummaryBar
            min={summary.min}
            max={summary.max}
            offers={offers.length}
            sellers={summary.sellers}
            wash={skin.wash}
            ink={skin.ink}
            border={skin.border}
          />
        ) : null}

        <div className="mt-12 space-y-14">
          {offers.length === 0 ? (
            <div className="glass rounded-3xl px-6 py-16 text-center">
              <p className="text-[17px] font-semibold tracking-tight">
                Todavía no hay ofertas registradas aquí
              </p>
              <p className="mt-2 t-meta text-faint">
                En cuanto cargues stock de {service.name} aparecerá en esta ficha.
              </p>
              <Link
                to="/agregar"
                className="mt-6 inline-flex h-13 items-center rounded-xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground"
              >
                Agregar stock
              </Link>
            </div>
          ) : bundle ? (
            [...bundleSections.entries()].map(([name, list]) => (
              <section key={name} className="rise">
                <h2 className="border-b border-border pb-3 t-section">{name}</h2>
                <div className="mt-6 space-y-12">
                  <OfferSection
                    title="Mis Grupos"
                    offers={list.filter((o) => o.group.kind === "interno")}
                    accent={skin.accent}
                  />
                  <OfferSection
                    title="Vendedores de Venta Libre"
                    subtitle="Contacta directo por WhatsApp"
                    offers={list.filter((o) => o.group.kind !== "interno")}
                    accent={skin.accent}
                    freeMarket
                  />
                </div>
              </section>
            ))
          ) : (
            <>
              <OfferSection title="Mis Grupos" offers={internal} accent={skin.accent} />
              <OfferSection
                title="Vendedores de Venta Libre"
                subtitle="Contacta directo por WhatsApp"
                offers={free}
                accent={skin.accent}
                freeMarket
              />
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * Resumen de la ficha. El "Desde" vivía pegado al logotipo y le robaba el
 * ancho; aquí encabeza la lista de precios, que es donde se usa.
 */
function SummaryBar({
  min,
  max,
  offers,
  sellers,
  wash,
  ink,
  border,
}: {
  min: number | null;
  max: number | null;
  offers: number;
  sellers: number;
  wash: string;
  ink: string;
  border: string;
}) {
  const cells: Array<{ label: string; value: string; strong?: boolean }> = [
    { label: min === null ? "Precio" : "Desde", value: formatPrice(min), strong: true },
    ...(max !== null && max !== min ? [{ label: "Hasta", value: formatPrice(max) }] : []),
    { label: "Ofertas", value: String(offers) },
    { label: "Tiendas", value: String(sellers) },
  ];

  return (
    <div
      className="grid gap-px overflow-hidden rounded-2xl border"
      style={{
        borderColor: border,
        background: border,
        gridTemplateColumns: `repeat(${cells.length}, minmax(0,1fr))`,
      }}
    >
      {cells.map((c) => (
        <div
          key={c.label}
          className="min-w-0 px-2 py-3.5 text-center"
          style={{ background: wash, color: ink }}
        >
          <p
            className={`tabular-nums leading-none tracking-tight ${
              c.strong ? "text-[25px] font-bold" : "text-[19px] font-semibold"
            }`}
          >
            {c.value}
          </p>
          <p
            className="mt-1.5 truncate text-[10.5px] uppercase tracking-[0.12em]"
            style={{ opacity: 0.65 }}
          >
            {c.label}
          </p>
        </div>
      ))}
    </div>
  );
}
