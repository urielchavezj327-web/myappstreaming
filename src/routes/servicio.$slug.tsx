import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { getServiceDetail, type StockOffer } from "@/lib/catalog.functions";
import { OfferSection } from "@/components/offer-list";
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
  const { service, offers } = Route.useLoaderData() as Detail;
  const accent = service.color ?? "#8b8b8b";

  const internal = offers.filter((o) => o.group.kind === "interno");
  const free = offers.filter((o) => o.group.kind !== "interno");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-border" style={{ backgroundColor: `${accent}12` }}>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-12">
          <Link
            to="/"
            search={{ cat: service.category, q: "" }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Volver al catálogo
          </Link>
          <div className="mt-5 flex items-center gap-4">
            <span
              className="h-12 w-1.5 rounded-full"
              style={{ backgroundColor: accent }}
              aria-hidden
            />
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {service.categoryName}
              </p>
              <h1 className="mt-1 text-[1.9rem] sm:text-4xl">{service.name}</h1>
            </div>
          </div>
          <p className="mt-4 text-[12px] text-muted-foreground">
            {offers.length} oferta{offers.length === 1 ? "" : "s"} · {internal.length} en grupos
            internos · {free.length} de venta libre
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-5 sm:py-12">
        <OfferSection title="Mis Grupos" offers={internal} accent={accent} />
        <OfferSection
          title="Vendedores de Venta Libre"
          subtitle="Contacta directo al vendedor por WhatsApp"
          offers={free}
          accent={accent}
          freeMarket
        />
      </main>

      <SiteFooter />
    </div>
  );
}
