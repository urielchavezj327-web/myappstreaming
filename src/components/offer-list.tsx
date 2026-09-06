import { type ReactNode } from "react";
import { MessageCircle } from "lucide-react";

import type { StockOffer } from "@/lib/catalog.functions";
import { durationLabel, durationRank, formatPrice, productLabel, whatsappLink } from "@/lib/format";
import { compareOffersByService } from "@/lib/search-core";

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

/** Acción opcional por fila (el panel de /agregar inyecta aquí editar/borrar). */
export type OfferAction = (offer: StockOffer) => ReactNode;

export function OfferGroups({
  offers,
  accent,
  freeMarket = false,
  showService = false,
  action,
}: {
  offers: StockOffer[];
  accent: string;
  freeMarket?: boolean;
  showService?: boolean;
  action?: OfferAction;
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
                style={{ backgroundColor: accent, boxShadow: `0 0 14px ${accent}` }}
                aria-hidden
              />
              <h3 className="text-[16px] font-semibold tracking-tight">{productLabel(type)}</h3>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                {list.length}
              </span>
            </div>

            <div className="mt-4 space-y-5">
              {durations.map((key) => {
                const rows = (byDuration.get(key) ?? []).slice().sort(byPriceAsc);
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
                          {...(action ? { action } : {})}
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

/** Precio ascendente; las ofertas "A consultar" van al final. */
function byPriceAsc(a: StockOffer, b: StockOffer) {
  if (a.price === null) return 1;
  if (b.price === null) return -1;
  return a.price - b.price;
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
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
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
  action,
}: {
  offer: StockOffer;
  best: boolean;
  freeMarket: boolean;
  showService?: boolean;
  action?: OfferAction;
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
    <li className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-2/70">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5">
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
          <Price value={offer.price} />
          {freeMarket && offer.group.phone ? (
            <WhatsAppButton
              phone={offer.group.phone}
              message={`Hola, vi tu oferta de ${productLabel(offer.productType)} (${durationLabel(offer.months)}). ¿Sigue disponible?`}
            />
          ) : null}
        </div>
      </div>
      {action ? <div className="px-4 pb-3.5">{action(offer)}</div> : null}
    </li>
  );
}

export function Price({ value }: { value: number | null }) {
  return (
    <span
      className={
        value === null
          ? "rounded-lg bg-surface-2 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-faint"
          : "text-[19px] font-semibold tabular-nums tracking-tight"
      }
    >
      {formatPrice(value)}
    </span>
  );
}

export function WhatsAppButton({ phone, message }: { phone: string; message: string }) {
  return (
    <a
      href={whatsappLink(phone, message)}
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar por WhatsApp"
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95"
    >
      <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
    </a>
  );
}

/**
 * Lista de ofertas de un vendedor: una categoría completa antes de la
 * siguiente y, dentro de cada categoría, el orden fijo del catálogo. En
 * Trámites el orden lo marca el tipo de documento (actas, SAT, salud…), no el
 * `sort_order` del servicio, que solo ordena dentro de su propia subcategoría.
 */
export function SellerOffers({
  offers,
  freeMarket,
  action,
}: {
  offers: StockOffer[];
  freeMarket: boolean;
  action?: OfferAction;
}) {
  const sorted = offers.slice().sort((a, b) => {
    return (
      (a.categoryOrder ?? 99) - (b.categoryOrder ?? 99) ||
      compareOffersByService(a, b) ||
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
    <div className="space-y-8">
      {[...byCategory.entries()].map(([category, list]) => (
        <div key={category}>
          <div className="mb-3 flex items-center gap-3">
            <p className="t-label text-faint">{category}</p>
            <span className="h-px flex-1 bg-border" aria-hidden />
            <span className="text-[11px] tabular-nums text-faint">{list.length}</span>
          </div>
          <div className="space-y-4">
            {groupByService(list).map((group) => (
              <ServiceOfferGroup
                key={group.key}
                group={group}
                freeMarket={freeMarket}
                {...(action ? { action } : {})}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type ServiceGroup = { key: string; name: string; offers: StockOffer[] };

function groupByService(list: StockOffer[]): ServiceGroup[] {
  const out: ServiceGroup[] = [];
  for (const o of list) {
    const name = o.serviceName ?? "—";
    const last = out[out.length - 1];
    if (last && last.name === name) last.offers.push(o);
    else out.push({ key: `${name}-${out.length}`, name, offers: [o] });
  }
  return out;
}

function ServiceOfferGroup({
  group,
  freeMarket,
  action,
}: {
  group: ServiceGroup;
  freeMarket: boolean;
  action?: OfferAction;
}) {
  const durations = new Map<number, StockOffer[]>();
  for (const o of group.offers) {
    const key = durationRank(o.months);
    durations.set(key, [...(durations.get(key) ?? []), o]);
  }
  const keys = [...durations.keys()].sort((a, b) => a - b);
  // El subtítulo de duración solo aporta cuando hay más de una: en trámites
  // (todos "Único") sería ruido.
  const showDuration = keys.length > 1;

  return (
    <div>
      <p className="mb-1.5 text-[14px] font-semibold tracking-tight">{group.name}</p>
      <div className="space-y-2.5">
        {keys.map((key) => {
          const rows = (durations.get(key) ?? []).slice().sort(byPriceAsc);
          return (
            <div key={key}>
              {showDuration ? (
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
                  {durationLabel(rows[0]?.months ?? null)}
                </p>
              ) : null}
              <ul className="glass overflow-hidden rounded-2xl">
                {rows.map((o) => (
                  <SellerOfferRow
                    key={o.id}
                    offer={o}
                    freeMarket={freeMarket}
                    showDuration={!showDuration}
                    {...(action ? { action } : {})}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SellerOfferRow({
  offer,
  freeMarket,
  showDuration,
  action,
}: {
  offer: StockOffer;
  freeMarket: boolean;
  showDuration: boolean;
  action?: OfferAction;
}) {
  const meta = [
    productLabel(offer.productType),
    showDuration ? durationLabel(offer.months) : null,
    offer.detail,
  ].filter(Boolean);

  return (
    <li className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-2/70">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] leading-relaxed text-muted-foreground">
              {meta.join(" · ")}
            </span>
            {!offer.available ? (
              <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-faint">
                Agotado
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Price value={offer.price} />
          {freeMarket && offer.group.phone ? (
            <WhatsAppButton
              phone={offer.group.phone}
              message={`Hola, vi tu oferta de ${offer.serviceName ?? ""} (${durationLabel(offer.months)}). ¿Sigue disponible?`}
            />
          ) : null}
        </div>
      </div>
      {action ? <div className="px-4 pb-3">{action(offer)}</div> : null}
    </li>
  );
}
