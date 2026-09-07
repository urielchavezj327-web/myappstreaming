import { createFileRoute, Link, notFound, useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { getSellerCatalog, type SearchSellerResult } from "@/lib/catalog.functions";
import { whatsappLink } from "@/lib/format";
import { SellerOffers } from "@/components/offer-list";
import { FilterChip } from "@/components/ui-kit";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const Route = createFileRoute("/vendedor/$slug")({
  loader: async ({ params }) => {
    const seller = await getSellerCatalog({ data: { slug: params.slug } });
    if (!seller) throw notFound();
    return { seller };
  },
  staleTime: 5 * 60_000,
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
  notFoundComponent: () => (
    <div className="p-10 text-sm text-muted-foreground">Este vendedor ya no existe.</div>
  ),
});

function SellerPage() {
  const { seller } = Route.useLoaderData() as { seller: SearchSellerResult };
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const freeMarket = seller.kind === "venta_libre";
  const [category, setCategory] = useState("");

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
    <div className="min-h-screen">
      <SiteHeader />

      <section className="aurora border-b border-border">
        <div className="mx-auto max-w-4xl px-4 pb-8 pt-7 sm:px-6 sm:pb-10 sm:pt-9">
          {/*
            Volver con history.back() en lugar de un enlace: un <Link> empuja una
            entrada nueva al historial y /grupos se montaría desde arriba,
            perdiendo la posición de scroll.
          */}
          {canGoBack ? (
            <button
              type="button"
              onClick={() => router.history.back()}
              className="inline-flex items-center gap-2 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-[18px] w-[18px]" /> Grupos y vendedores
            </button>
          ) : (
            <Link
              to="/grupos"
              className="inline-flex items-center gap-2 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-[18px] w-[18px]" /> Grupos y vendedores
            </Link>
          )}

          <header className="mt-5 text-center">
            {seller.parentGroup ? (
              <p className="t-label text-faint">{seller.parentGroup}</p>
            ) : (
              <p className="t-label text-faint">Grupo interno</p>
            )}
            <h1 className="mt-2 t-display">{seller.name}</h1>
            <p className="mt-3 t-meta text-muted-foreground">
              {freeMarket ? (seller.phone ?? "Sin número publicado") : "Mis Grupos"} ·{" "}
              {seller.offers.length} oferta{seller.offers.length === 1 ? "" : "s"}
            </p>
            {freeMarket && seller.phone ? (
              <a
                href={whatsappLink(seller.phone, "Hola, vengo del comparador de precios.")}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand text-brand-ink font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_10px_28px_-12px_var(--brand-glow)] transition-all active:scale-[0.98] disabled:opacity-45 disabled:shadow-none px-5 py-3 text-[15px]"
              >
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2.2} /> WhatsApp
              </a>
            ) : null}
          </header>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {categories.length > 1 ? (
          <div className="no-scrollbar -mx-4 mb-7 overflow-x-auto px-4 sm:mx-0 sm:px-0">
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

        {seller.offers.length > 0 ? (
          <SellerOffers offers={visible} freeMarket={freeMarket} />
        ) : (
          <div className="glass rounded-3xl px-6 py-14 text-center">
            <p className="text-[17px] font-semibold tracking-tight">
              Este vendedor todavía no tiene stock
            </p>
            <p className="mt-2 t-meta text-faint">
              Cárgalo desde el panel y aparecerá aquí al instante.
            </p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
