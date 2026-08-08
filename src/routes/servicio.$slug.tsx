import { createFileRoute, Link, notFound, useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { getServiceDetail, type StockOffer } from "@/lib/catalog.functions";
import { OfferGroups, OfferSection } from "@/components/offer-list";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

type Detail = {
  service: {
    slug: string;
    name: string;
    color: string | null;
    category: string;
    categoryName: string;
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
  const accent = service.color ?? "#9a9aa2";
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const internal = offers.filter((o) => o.group.kind === "interno");
  const free = offers.filter((o) => o.group.kind !== "interno");

  // Volver conserva categoría y posición de scroll cuando hay historial.
  const back = (
    <button
      type="button"
      onClick={() => router.history.back()}
      className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Volver al catálogo
    </button>
  );

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

      <section className="relative overflow-hidden border-b border-border">
        <span
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ background: `radial-gradient(70% 120% at 0% 0%, ${accent}, transparent 65%)` }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12">
          {canGoBack ? (
            back
          ) : (
            <Link
              to="/"
              search={{ cat: service.category, q: "" }}
              className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Volver al catálogo
            </Link>
          )}
          <div className="mt-5 flex items-center gap-4">
            <span
              className="h-14 w-1.5 rounded-full"
              style={{ backgroundColor: accent, boxShadow: `0 0 24px ${accent}` }}
              aria-hidden
            />
            <div>
              <p className="t-label text-faint">{service.categoryName}</p>
              <h1 className="mt-1.5 t-display">{service.name}</h1>
            </div>
          </div>
          <p className="mt-4 text-[13px] text-muted-foreground">
            {offers.length} oferta{offers.length === 1 ? "" : "s"} · {internal.length} en grupos
            internos · {free.length} de venta libre
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6 sm:py-12">
        {offers.length === 0 ? (
          <p className="glass rounded-3xl px-6 py-14 text-center text-[15px] text-muted-foreground">
            Todavía no hay ofertas registradas aquí.
          </p>
        ) : bundle ? (
          [...bundleSections.entries()].map(([name, list]) => (
            <section key={name} className="rise">
              <h2 className="border-b border-border pb-3 t-title">{name}</h2>
              <div className="mt-5 space-y-12">
                <OfferSection
                  title="Mis Grupos"
                  offers={list.filter((o) => o.group.kind === "interno")}
                  accent={accent}
                />
                <OfferSection
                  title="Vendedores de Venta Libre"
                  subtitle="Contacta directo al vendedor por WhatsApp"
                  offers={list.filter((o) => o.group.kind !== "interno")}
                  accent={accent}
                  freeMarket
                />
              </div>
            </section>
          ))
        ) : (
          <>
            <OfferSection title="Mis Grupos" offers={internal} accent={accent} />
            <OfferSection
              title="Vendedores de Venta Libre"
              subtitle="Contacta directo al vendedor por WhatsApp"
              offers={free}
              accent={accent}
              freeMarket
            />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

export { OfferGroups };
