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
        {
          "--wordmark-ink": skin.ink,
          "--wordmark-shadow": skin.inkShadow,
          "--edge": skin.edge,
        } as React.CSSProperties
      }
    >
      {/*
        El color de la marca cubre la ficha entera. Antes se desvanecía al 74%
        y la página se partía en dos mitades: arriba la marca, abajo la app.
        Ahora la capa de marca es fija y el velo que la cubre nunca llega a ser
        opaco, así que el tono sigue presente hasta el pie sin restarle
        contraste a las listas de precios.
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
            "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--color-background) 62%, transparent) 38%, color-mix(in srgb, var(--color-background) 84%, transparent) 100%)",
        }}
        aria-hidden
      />

      <SiteHeader />

      <header className="relative">
        <div className="relative mx-auto max-w-3xl px-4 pt-4 sm:px-6 sm:pt-6">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => router.history.back()}
              className="tappable inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13.5px] font-medium"
              style={{
                color: skin.chrome,
                borderColor: skin.border,
                background: "rgba(255,255,255,0.07)",
              }}
            >
              <ArrowLeft className="h-4 w-4" /> Catálogo
            </button>
          ) : (
            <Link
              to="/"
              search={{ cat: service.category, q: "" }}
              className="tappable inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13.5px] font-medium"
              style={{
                color: skin.chrome,
                borderColor: skin.border,
                background: "rgba(255,255,255,0.07)",
              }}
            >
              <ArrowLeft className="h-4 w-4" /> Catálogo
            </Link>
          )}

          <p className="mt-10 text-center t-micro" style={{ color: skin.meta }}>
            {service.categoryName}
          </p>

          {/*
            El logotipo manda en la ficha. Ocupa todo el ancho útil y nada se
            le acerca: el precio bajó al resumen, que es donde se consulta.
          */}
          <div className="wordmark-box mx-auto mt-6 w-full max-w-[19rem] pb-14 sm:max-w-[24rem]">
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
            chrome={skin.chrome}
            meta={skin.meta}
            border={skin.border}
            accent={skin.accent}
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
 * Resumen de la ficha, en rejilla bento.
 *
 * Las cajas translúcidas son la pieza que mejor funciona de toda la app, así
 * que aquí mandan: «Desde» ocupa el doble de sitio, lleva el acento de la
 * marca y un cuerpo de 44 px, porque es el número por el que se entra a esta
 * pantalla. Los demás datos son contexto y quedan en una fila de tres.
 *
 * El texto va en blanco, no en el color de la marca: el tono de marca está en
 * el fondo, y repetirlo en las cifras dejaba los precios de Netflix rojos
 * sobre rojo.
 */
function SummaryBar({
  min,
  max,
  offers,
  sellers,
  chrome,
  meta,
  border,
  accent,
}: {
  min: number | null;
  max: number | null;
  offers: number;
  sellers: number;
  chrome: string;
  meta: string;
  border: string;
  accent: string;
}) {
  const rest: Array<{ label: string; value: string }> = [
    ...(max !== null && max !== min ? [{ label: "Hasta", value: formatPrice(max) }] : []),
    { label: "Ofertas", value: String(offers) },
    { label: "Tiendas", value: String(sellers) },
  ];

  return (
    <div className="space-y-2.5">
      <div
        className="lightedge relative overflow-hidden rounded-[1.5rem] border px-6 py-6"
        style={{
          borderColor: border,
          background: `linear-gradient(152deg, ${accent}33, rgba(255,255,255,0.045) 58%)`,
          color: chrome,
          boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.1), 0 20px 46px -26px ${accent}`,
        }}
      >
        <p className="t-micro" style={{ color: meta }}>
          {min === null ? "Precio" : "Desde"}
        </p>
        <p className="mt-2.5 t-price text-[2.9rem] leading-[0.9]">{formatPrice(min)}</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {rest.map((c) => (
          <div
            key={c.label}
            className="lightedge relative overflow-hidden rounded-[1.2rem] border px-3.5 py-4"
            style={{
              borderColor: border,
              background: "rgba(255,255,255,0.05)",
              color: chrome,
            }}
          >
            <p className="truncate t-micro" style={{ color: meta }}>
              {c.label}
            </p>
            <p className="mt-1.5 t-price text-[1.45rem] leading-none">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
