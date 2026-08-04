import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { getServiceDetail, type StockOffer } from "@/lib/catalog.functions";
import { durationLabel, durationRank, formatPrice, productLabel, whatsappLink } from "@/lib/format";
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
        <div className="mx-auto max-w-6xl px-5 py-12">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Volver al catálogo
          </Link>
          <div className="mt-5 flex items-center gap-4">
            <span
              className="h-12 w-1.5 rounded-full"
              style={{ backgroundColor: accent }}
              aria-hidden
            />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {service.categoryName}
              </p>
              <h1 className="mt-1 text-3xl sm:text-4xl">{service.name}</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {offers.length} oferta{offers.length === 1 ? "" : "s"} · {internal.length} en grupos
            internos · {free.length} de venta libre
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-14 px-5 py-12">
        <OfferSection title="Grupos donde estoy dentro" offers={internal} accent={accent} />
        <OfferSection
          title="Grupo de Venta Libre"
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

function OfferSection({
  title,
  subtitle,
  offers,
  accent,
  freeMarket = false,
}: {
  title: string;
  subtitle?: string;
  offers: StockOffer[];
  accent: string;
  freeMarket?: boolean;
}) {
  if (offers.length === 0) return null;

  const byType = new Map<string, StockOffer[]>();
  for (const o of offers) {
    const list = byType.get(o.productType) ?? [];
    list.push(o);
    byType.set(o.productType, list);
  }

  const typeOrder = [
    "perfil",
    "completa",
    "individual",
    "familiar",
    "invitacion",
    "lote",
    "tramite",
    "otro",
  ];
  const types = [...byType.keys()].sort(
    (a, b) =>
      (typeOrder.indexOf(a) === -1 ? 50 : typeOrder.indexOf(a)) -
      (typeOrder.indexOf(b) === -1 ? 50 : typeOrder.indexOf(b)),
  );

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
        <h2 className="text-xl">{title}</h2>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>

      <div className="mt-6 space-y-10">
        {types.map((type) => {
          const list = byType.get(type) ?? [];
          const byDuration = new Map<number, StockOffer[]>();
          for (const o of list) {
            const rank = durationRank(o.months);
            const arr = byDuration.get(rank) ?? [];
            arr.push(o);
            byDuration.set(rank, arr);
          }
          const durations = [...byDuration.keys()].sort((a, b) => a - b);

          return (
            <div key={type}>
              <h3 className="text-sm font-semibold" style={{ color: accent }}>
                {productLabel(type)}
              </h3>
              <div className="mt-4 space-y-6">
                {durations.map((rank) => {
                  const rows = (byDuration.get(rank) ?? []).slice().sort((a, b) => {
                    if (a.price === null) return 1;
                    if (b.price === null) return -1;
                    return a.price - b.price;
                  });
                  return (
                    <div key={rank}>
                      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {durationLabel(rows[0]?.months ?? null)}
                      </p>
                      <ul className="overflow-hidden rounded-xl border border-border">
                        {rows.map((o, i) => (
                          <OfferRow
                            key={o.id}
                            offer={o}
                            best={i === 0 && o.price !== null}
                            freeMarket={freeMarket}
                          />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OfferRow({
  offer,
  best,
  freeMarket,
}: {
  offer: StockOffer;
  best: boolean;
  freeMarket: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{offer.group.name}</span>
          {best ? (
            <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success-foreground">
              Mejor precio
            </span>
          ) : null}
          {!offer.available ? (
            <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              Agotado
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {freeMarket && offer.group.parentGroup ? `${offer.group.parentGroup} · ` : ""}
          {offer.group.phone ?? "Sin número publicado"}
          {offer.detail ? ` · ${offer.detail}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold tabular-nums">{formatPrice(offer.price)}</span>
        {freeMarket && offer.group.phone ? (
          <a
            href={whatsappLink(
              offer.group.phone,
              `Hola, vi tu oferta de ${productLabel(offer.productType)} (${durationLabel(offer.months)}). ¿Sigue disponible?`,
            )}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            WhatsApp
          </a>
        ) : null}
      </div>
    </li>
  );
}
