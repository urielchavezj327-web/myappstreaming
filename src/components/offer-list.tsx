import type { StockOffer } from "@/lib/catalog.functions";
import { durationLabel, durationRank, formatPrice, productLabel, whatsappLink } from "@/lib/format";
import { MessageCircle } from "lucide-react";

const TYPE_ORDER = [
  "perfil",
  "completa",
  "individual",
  "familiar",
  "invitacion",
  "lote",
  "panel",
  "tramite",
  "otro",
];

export const typeRank = (t: string) => (TYPE_ORDER.indexOf(t) === -1 ? 50 : TYPE_ORDER.indexOf(t));

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

  const types = [...byType.keys()].sort((a, b) => typeRank(a) - typeRank(b));

  return (
    <div className="space-y-9">
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
            <div className="flex items-center gap-2.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}` }}
                aria-hidden
              />
              <h3 className="text-[15px] font-semibold tracking-tight">{productLabel(type)}</h3>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                {list.length}
              </span>
            </div>

            <div className="mt-4 space-y-5">
              {durations.map((key) => {
                const rows = (byDuration.get(key) ?? []).slice().sort((a, b) => {
                  if (a.price === null) return 1;
                  if (b.price === null) return -1;
                  return a.price - b.price;
                });
                return (
                  <div key={key}>
                    <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-faint">
                      {durationLabel(rows[0]?.months ?? null)}
                    </p>
                    <ul className="glass overflow-hidden rounded-2xl">
                      {rows.map((o, i) => (
                        <OfferRow
                          key={o.id}
                          offer={o}
                          best={i === 0 && o.price !== null && rows.length > 1}
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
    <section className="rise">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="t-title">{title}</h2>
        {subtitle ? <p className="text-[12px] text-faint">{subtitle}</p> : null}
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
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2/70">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[15px] font-medium tracking-tight">{title}</span>
          {best ? (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-success">
              Mejor precio
            </span>
          ) : null}
          {!offer.available ? (
            <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-faint">
              Agotado
            </span>
          ) : null}
        </div>
        {meta.length > 0 ? (
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            {meta.join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`tabular-nums ${
            offer.price === null
              ? "text-[13px] text-faint"
              : "text-[19px] font-semibold tracking-tight"
          }`}
        >
          {formatPrice(offer.price)}
        </span>
        {freeMarket && offer.group.phone ? (
          <a
            href={whatsappLink(
              offer.group.phone,
              `Hola, vi tu oferta de ${productLabel(offer.productType)} (${durationLabel(offer.months)}). ¿Sigue disponible?`,
            )}
            target="_blank"
            rel="noreferrer"
            aria-label="Contactar por WhatsApp"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
          </a>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Lista de ofertas de un vendedor: una categoría completa antes de la
 * siguiente, y dentro de cada categoría el orden fijo del catálogo.
 */
export function SellerOffers({ offers, freeMarket }: { offers: StockOffer[]; freeMarket: boolean }) {
  const sorted = offers.slice().sort((a, b) => {
    return (
      (a.categoryOrder ?? 99) - (b.categoryOrder ?? 99) ||
      (a.serviceOrder ?? 99) - (b.serviceOrder ?? 99) ||
      typeRank(a.productType) - typeRank(b.productType) ||
      durationRank(a.months) - durationRank(b.months) ||
      (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER)
    );
  });

  const byCategory = new Map<string, StockOffer[]>();
  for (const o of sorted) {
    const key = o.categoryName ?? "Otros";
    const list = byCategory.get(key) ?? [];
    list.push(o);
    byCategory.set(key, list);
  }

  return (
    <div className="space-y-7">
      {[...byCategory.entries()].map(([category, list]) => (
        <div key={category}>
          <p className="mb-2.5 t-label text-faint">{category}</p>
          <ul className="glass overflow-hidden rounded-2xl">
            {list.map((o) => (
              <li
                key={o.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2/70"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[15px] font-medium tracking-tight">{o.serviceName}</span>
                    {!o.available ? (
                      <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-faint">
                        Agotado
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {[productLabel(o.productType), durationLabel(o.months), o.detail]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`tabular-nums ${
                      o.price === null
                        ? "text-[13px] text-faint"
                        : "text-[19px] font-semibold tracking-tight"
                    }`}
                  >
                    {formatPrice(o.price)}
                  </span>
                  {freeMarket && o.group.phone ? (
                    <a
                      href={whatsappLink(
                        o.group.phone,
                        `Hola, vi tu oferta de ${o.serviceName ?? ""} (${durationLabel(o.months)}). ¿Sigue disponible?`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Contactar por WhatsApp"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95"
                    >
                      <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
