import type { StockOffer } from "@/lib/catalog.functions";
import { durationLabel, durationRank, formatPrice, productLabel, whatsappLink } from "@/lib/format";

const TYPE_ORDER = [
  "perfil",
  "completa",
  "individual",
  "familiar",
  "invitacion",
  "lote",
  "tramite",
  "otro",
];

export function OfferGroups({
  offers,
  accent,
  freeMarket = false,
  showService = false,
}: {
  offers: StockOffer[];
  accent: string;
  freeMarket?: boolean;
  showService?: boolean;
}) {
  const byType = new Map<string, StockOffer[]>();
  for (const o of offers) {
    const list = byType.get(o.productType) ?? [];
    list.push(o);
    byType.set(o.productType, list);
  }

  const rank = (t: string) => (TYPE_ORDER.indexOf(t) === -1 ? 50 : TYPE_ORDER.indexOf(t));
  const types = [...byType.keys()].sort((a, b) => rank(a) - rank(b));

  return (
    <div className="space-y-8">
      {types.map((type) => {
        const list = byType.get(type) ?? [];
        const byDuration = new Map<number, StockOffer[]>();
        for (const o of list) {
          const key = durationRank(o.months);
          const arr = byDuration.get(key) ?? [];
          arr.push(o);
          byDuration.set(key, arr);
        }
        const durations = [...byDuration.keys()].sort((a, b) => a - b);

        return (
          <div key={type}>
            <h3 className="text-[13px] font-semibold" style={{ color: accent }}>
              {productLabel(type)}
            </h3>
            <div className="mt-3 space-y-5">
              {durations.map((key) => {
                const rows = (byDuration.get(key) ?? []).slice().sort((a, b) => {
                  if (a.price === null) return 1;
                  if (b.price === null) return -1;
                  return a.price - b.price;
                });
                return (
                  <div key={key}>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {durationLabel(rows[0]?.months ?? null)}
                    </p>
                    <ul className="overflow-hidden rounded-xl border border-border">
                      {rows.map((o, i) => (
                        <OfferRow
                          key={o.id}
                          offer={o}
                          best={i === 0 && o.price !== null}
                          freeMarket={freeMarket || o.group.kind === "venta_libre"}
                          showService={showService}
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
  );
}

export function OfferSection({
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
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
        <h2 className="text-lg sm:text-xl">{title}</h2>
        {subtitle ? <p className="text-[11px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="mt-5">
        <OfferGroups offers={offers} accent={accent} freeMarket={freeMarket} />
      </div>
    </section>
  );
}

export function OfferRow({
  offer,
  best,
  freeMarket,
  showService = false,
}: {
  offer: StockOffer;
  best: boolean;
  freeMarket: boolean;
  showService?: boolean;
}) {
  // Regla permanente: el grupo, el teléfono y el aviso "Sin número publicado"
  // solo se muestran en venta libre. En grupos internos nunca aplican.
  const meta: string[] = [];
  if (freeMarket) {
    if (offer.group.parentGroup) meta.push(offer.group.parentGroup);
    meta.push(offer.group.phone ?? "Sin número publicado");
    if (offer.group.variant) meta.push(offer.group.variant);
  } else if (offer.group.variant) {
    meta.push(offer.group.variant);
  }
  if (offer.detail) meta.push(offer.detail);

  const title = showService ? (offer.serviceName ?? offer.group.name) : offer.group.name;
  if (showService) meta.unshift(offer.group.name);

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-surface px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[14px] font-medium tracking-tight">{title}</span>
          {best ? (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-success">
              Mejor precio
            </span>
          ) : null}
          {!offer.available ? (
            <span className="rounded-full border border-border-strong px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              Agotado
            </span>
          ) : null}
        </div>
        {meta.length > 0 ? (
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {meta.join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="text-[17px] font-semibold tabular-nums">{formatPrice(offer.price)}</span>
        {freeMarket && offer.group.phone ? (
          <a
            href={whatsappLink(
              offer.group.phone,
              `Hola, vi tu oferta de ${productLabel(offer.productType)} (${durationLabel(offer.months)}). ¿Sigue disponible?`,
            )}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
          >
            WhatsApp
          </a>
        ) : null}
      </div>
    </li>
  );
}
