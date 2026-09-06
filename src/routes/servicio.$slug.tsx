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
    const title = `${name} — precios comparados por grupo`;
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
    <div className="p-10 text-sm text-muted-foreground">No se pudo cargar: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-sm text-muted-foreground">Ese servicio no existe.</div>
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
      sellers: new Set(offers.map((o) => o.group.slug)).size,
      priced: priced.length,
    };
  }, [offers]);

  // Cuando es una colección (ej. Páginas para Adultos), se separa por servicio.
  const bundleSections = new Map<string, StockOffer[]>();
  if (bundle) {
    for (const o of offers) {
      const key = o.serviceName ?? "—";
      const list = bundleSections.get(key) ?? [];
      list.push(o);
      bundleSections.set(key, list);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section
        className="relative overflow-hidden border-b border-border"
        style={
          {
            background: skin.background,
            "--wordmark-ink": skin.ink,
            "--wordmark-shadow": skin.inkShadow,
          } as React.CSSProperties
        }
      >
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: skin.glow }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-11">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => router.history.back()}
              className="inline-flex items-center gap-2 text-[13px] transition-opacity hover:opacity-70"
              style={{ color: skin.ink, opacity: 0.8 }}
            >
              <ArrowLeft className="h-4 w-4" /> Volver al catálogo
            </button>
          ) : (
            <Link
              to="/"
              search={{ cat: service.category, q: "" }}
              className="inline-flex items-center gap-2 text-[13px] transition-opacity hover:opacity-70"
              style={{ color: skin.ink, opacity: 0.8 }}
            >
              <ArrowLeft className="h-4 w-4" /> Volver al catálogo
            </Link>
          )}

          <p className="mt-6 text-center t-label" style={{ color: skin.ink, opacity: 0.62 }}>
            {service.categoryName}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Wordmark name={service.name} brand={brand} size="hero" />
            <div
              className="rounded-2xl border px-4 py-2 text-center"
              style={{ borderColor: skin.border, background: skin.wash }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: skin.ink, opacity: 0.65 }}
              >
                {summary.min === null ? "Precio" : "Desde"}
              </p>
              <p
                className="text-[24px] font-semibold tabular-nums leading-tight tracking-tight"
                style={{ color: skin.ink }}
              >
                {formatPrice(summary.min)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center" style={{ color: skin.ink }}>
            <HeroStat label="Ofertas" value={offers.length} wash={skin.wash} />
            <HeroStat label="Vendedores" value={summary.sellers} wash={skin.wash} />
            <HeroStat label="Venta libre" value={free.length} wash={skin.wash} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6 sm:py-12">
        {offers.length === 0 ? (
          <div className="glass rounded-3xl px-6 py-16 text-center">
            <p className="text-[15px] font-medium">Todavía no hay ofertas registradas aquí</p>
            <p className="mt-1.5 text-[13px] text-faint">
              En cuanto cargues stock de {service.name} aparecerá en esta ficha.
            </p>
            <Link
              to="/agregar"
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Agregar stock
            </Link>
          </div>
        ) : bundle ? (
          [...bundleSections.entries()].map(([name, list]) => (
            <section key={name} className="rise">
              <h2 className="border-b border-border pb-3 t-section">{name}</h2>
              <div className="mt-5 space-y-12">
                <OfferSection
                  title="Mis Grupos"
                  offers={list.filter((o) => o.group.kind === "interno")}
                  accent={skin.accent}
                />
                <OfferSection
                  title="Vendedores de Venta Libre"
                  subtitle="Contacta directo al vendedor por WhatsApp"
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
              subtitle="Contacta directo al vendedor por WhatsApp"
              offers={free}
              accent={skin.accent}
              freeMarket
            />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function HeroStat({ label, value, wash }: { label: string; value: number; wash: string }) {
  return (
    <div className="rounded-2xl px-2 py-2.5" style={{ background: wash }}>
      <p className="text-[19px] font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] opacity-65">{label}</p>
    </div>
  );
}
