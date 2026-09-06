import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

import { getSellerCatalog, type SearchSellerResult } from "@/lib/catalog.functions";
import { whatsappLink } from "@/lib/format";
import { SellerOffers } from "@/components/offer-list";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const Route = createFileRoute("/vendedor/$slug")({
  loader: async ({ params }) => {
    const seller = await getSellerCatalog({ data: { slug: params.slug } });
    if (!seller) throw notFound();
    return { seller };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.seller.name ?? "Vendedor";
    const title = `${name} — Stock completo`;
    const description = `Todas las ofertas publicadas de ${name}: precios por servicio, duración y tipo de producto.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SellerPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-muted-foreground">No se pudo cargar: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm">Este vendedor ya no existe.</div>,
});

function SellerPage() {
  const { seller } = Route.useLoaderData() as { seller: SearchSellerResult };
  const freeMarket = seller.kind === "venta_libre";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/grupos"
          className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Grupos y vendedores
        </Link>

        <header className="mt-4 border-b border-border pb-5">
          {seller.parentGroup ? <p className="t-label text-faint">{seller.parentGroup}</p> : null}
          <h1 className="mt-1.5 t-display">{seller.name}</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {freeMarket ? (seller.phone ?? "Sin número publicado") : "Grupo interno"} ·{" "}
            {seller.offers.length} ofertas
          </p>
          {freeMarket && seller.phone ? (
            <a
              href={whatsappLink(seller.phone, "Hola, vengo del comparador de precios.")}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2.2} /> WhatsApp
            </a>
          ) : null}
        </header>

        <div className="mt-7">
          {seller.offers.length > 0 ? (
            <SellerOffers offers={seller.offers} freeMarket={freeMarket} />
          ) : (
            <p className="text-sm text-muted-foreground">Este vendedor todavía no tiene stock.</p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
