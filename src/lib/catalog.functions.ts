import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

// PostgREST corta en 1000 filas: hay que paginar para no perder ofertas.
export async function pageAll<T>(
  run: (from: number, to: number) => PromiseLike<{ data: unknown[] | null }>,
): Promise<T[]> {
  const size = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += size) {
    const { data } = await run(from, from + size - 1);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

export type CatalogService = {
  slug: string;
  name: string;
  color: string | null;
  category: string;
  categoryName: string;
  subcategory: string | null;
  subcategoryName: string | null;
  offers: number;
  minPrice: number | null;
};

export type CatalogCategory = {
  slug: string;
  name: string;
  services: CatalogService[];
};

type StockAggRow = { service_id: string; price: number | null };

// Las subcategorías de "Otros" se muestran como UNA sola tarjeta agrupada
// (ejemplo: Páginas para Adultos), con su propia ficha de detalle.
const BUNDLED_CATEGORIES = new Set(["otros"]);
export const BUNDLE_PREFIX = "col-";

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [cats, subs, services, stock] = await Promise.all([
    supabase.from("categories").select("id,slug,name,sort_order").order("sort_order"),
    supabase.from("subcategories").select("id,slug,name,sort_order").order("sort_order"),
    supabase
      .from("services")
      .select("id,slug,name,color,sort_order,category_id,subcategory_id")
      .order("sort_order"),
    pageAll<StockAggRow>((from, to) =>
      supabase.from("stock_items").select("service_id,price").range(from, to),
    ),
  ]);

  const catRows = (cats.data ?? []) as Array<{ id: string; slug: string; name: string }>;
  const subRows = (subs.data ?? []) as Array<{ id: string; slug: string; name: string }>;
  const catById = new Map(catRows.map((c) => [c.id, { slug: c.slug, name: c.name }]));
  const subById = new Map(subRows.map((s) => [s.id, s]));

  const agg = new Map<string, { offers: number; min: number | null }>();
  for (const row of stock) {
    const cur = agg.get(row.service_id) ?? { offers: 0, min: null };
    cur.offers += 1;
    if (row.price !== null) {
      const value = Number(row.price);
      cur.min = cur.min === null ? value : Math.min(cur.min, value);
    }
    agg.set(row.service_id, cur);
  }

  const byCategory = new Map<string, CatalogService[]>();
  const bundles = new Map<string, CatalogService>();

  for (const s of (services.data ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    color: string | null;
    category_id: string;
    subcategory_id: string | null;
  }>) {
    const cat = catById.get(s.category_id);
    if (!cat) continue;
    const sub = s.subcategory_id ? subById.get(s.subcategory_id) : undefined;
    const stats = agg.get(s.id) ?? { offers: 0, min: null };

    if (sub && BUNDLED_CATEGORIES.has(cat.slug)) {
      const key = `${cat.slug}:${sub.slug}`;
      const existing = bundles.get(key);
      if (existing) {
        existing.offers += stats.offers;
        existing.minPrice =
          stats.min === null
            ? existing.minPrice
            : existing.minPrice === null
              ? stats.min
              : Math.min(existing.minPrice, stats.min);
      } else {
        const card: CatalogService = {
          slug: `${BUNDLE_PREFIX}${sub.slug}`,
          name: sub.name,
          color: s.color,
          category: cat.slug,
          categoryName: cat.name,
          subcategory: null,
          subcategoryName: null,
          offers: stats.offers,
          minPrice: stats.min,
        };
        bundles.set(key, card);
        const list = byCategory.get(cat.slug) ?? [];
        list.push(card);
        byCategory.set(cat.slug, list);
      }
      continue;
    }

    const list = byCategory.get(cat.slug) ?? [];
    list.push({
      slug: s.slug,
      name: s.name,
      color: s.color,
      category: cat.slug,
      categoryName: cat.name,
      subcategory: sub?.slug ?? null,
      subcategoryName: sub?.name ?? null,
      offers: stats.offers,
      minPrice: stats.min,
    });
    byCategory.set(cat.slug, list);
  }

  const categories: CatalogCategory[] = catRows.map((c) => ({
    slug: c.slug,
    name: c.name,
    services: byCategory.get(c.slug) ?? [],
  }));

  return { categories };
});

export type StockOffer = {
  id: string;
  productType: string;
  months: number | null;
  price: number | null;
  detail: string | null;
  available: boolean;
  serviceName?: string;
  serviceSlug?: string;
  serviceOrder?: number;
  categorySlug?: string;
  categoryName?: string;
  categoryOrder?: number;
  group: {
    slug: string;
    name: string;
    kind: string;
    phone: string | null;
    parentGroup: string | null;
    variant: string | null;
  };
};

type GroupRowDb = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  phone: string | null;
  parent_group: string | null;
  notes: string | null;
};

type StockRowDb = {
  id: string;
  group_id: string;
  service_id: string;
  product_type: string;
  months: number | null;
  price: number | null;
  detail: string | null;
  available: boolean;
};

function toOffer(row: StockRowDb, g: GroupRowDb, serviceName?: string): StockOffer {
  return {
    id: row.id,
    productType: row.product_type,
    months: row.months,
    price: row.price === null ? null : Number(row.price),
    detail: row.detail,
    available: row.available,
    ...(serviceName ? { serviceName } : {}),
    group: {
      slug: g.slug,
      name: g.name,
      kind: g.kind,
      // Regla permanente: el teléfono solo existe para venta libre.
      phone: g.kind === "venta_libre" ? g.phone : null,
      parentGroup: g.parent_group,
      variant: g.notes,
    },
  };
}

export const getServiceDetail = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const isBundle = data.slug.startsWith(BUNDLE_PREFIX);

    let serviceIds: string[] = [];
    let serviceNameById = new Map<string, string>();
    let header: {
      slug: string;
      name: string;
      color: string | null;
      category: string;
      categoryName: string;
    };

    if (isBundle) {
      const subSlug = data.slug.slice(BUNDLE_PREFIX.length);
      const sub = await supabase
        .from("subcategories")
        .select("id,slug,name,category_id")
        .eq("slug", subSlug)
        .maybeSingle();
      if (!sub.data) return null;
      const subRow = sub.data as { id: string; name: string; category_id: string };
      const [cat, svcs] = await Promise.all([
        supabase.from("categories").select("slug,name").eq("id", subRow.category_id).maybeSingle(),
        supabase
          .from("services")
          .select("id,name,color,sort_order")
          .eq("subcategory_id", subRow.id)
          .order("sort_order"),
      ]);
      const rows = (svcs.data ?? []) as Array<{ id: string; name: string; color: string | null }>;
      serviceIds = rows.map((r) => r.id);
      serviceNameById = new Map(rows.map((r) => [r.id, r.name]));
      header = {
        slug: data.slug,
        name: subRow.name,
        color: rows[0]?.color ?? null,
        category: (cat.data as { slug: string } | null)?.slug ?? "otros",
        categoryName: (cat.data as { name: string } | null)?.name ?? "Otros",
      };
    } else {
      const svc = await supabase
        .from("services")
        .select("id,slug,name,color,category_id")
        .eq("slug", data.slug)
        .maybeSingle();
      if (!svc.data) return null;
      const service = svc.data as {
        id: string;
        slug: string;
        name: string;
        color: string | null;
        category_id: string;
      };
      const cat = await supabase
        .from("categories")
        .select("slug,name")
        .eq("id", service.category_id)
        .maybeSingle();
      serviceIds = [service.id];
      serviceNameById = new Map([[service.id, service.name]]);
      header = {
        slug: service.slug,
        name: service.name,
        color: service.color,
        category: (cat.data as { slug: string } | null)?.slug ?? "otros",
        categoryName: (cat.data as { name: string } | null)?.name ?? "Otros",
      };
    }

    if (serviceIds.length === 0) return { service: header, offers: [], bundle: isBundle };

    const [groups, stock] = await Promise.all([
      pageAll<GroupRowDb>((from, to) =>
        supabase.from("groups").select("id,slug,name,kind,phone,parent_group,notes").range(from, to),
      ),
      pageAll<StockRowDb>((from, to) =>
        supabase
          .from("stock_items")
          .select("id,group_id,service_id,product_type,months,price,detail,available")
          .in("service_id", serviceIds)
          .range(from, to),
      ),
    ]);

    const groupById = new Map(groups.map((g) => [g.id, g]));
    const offers: StockOffer[] = stock
      .map((row) => {
        const g = groupById.get(row.group_id);
        if (!g) return null;
        return toOffer(row, g, isBundle ? serviceNameById.get(row.service_id) : undefined);
      })
      .filter((o): o is StockOffer => o !== null);

    return { service: header, offers, bundle: isBundle };
  });

export type SearchServiceResult = {
  slug: string;
  name: string;
  color: string | null;
  categoryName: string;
  offers: StockOffer[];
};

export type SearchSellerResult = {
  slug: string;
  name: string;
  kind: string;
  phone: string | null;
  parentGroup: string | null;
  offers: StockOffer[];
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const digitsOf = (value: string) => value.replace(/\D/g, "");

const PRODUCT_TEXT: Record<string, string> = {
  perfil: "perfil",
  completa: "cuenta completa full",
  individual: "individual",
  familiar: "familiar",
  invitacion: "invitacion",
  lote: "lote",
  tramite: "tramite",
  panel: "panel",
  otro: "servicio",
};

function durationText(months: number | null) {
  if (months === null) return "unico";
  if (months === 0) return "permanente";
  if (months === 1) return "1 mes mensual";
  if (months === 12) return "12 anual 1 ano";
  if (months === 24) return "24 2 anos";
  return `${months} meses`;
}

export const searchStock = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ q: z.string().max(80) }).parse(input))
  .handler(
    async ({
      data,
    }): Promise<{ services: SearchServiceResult[]; sellers: SearchSellerResult[] }> => {
      const raw = normalize(data.q);
      // Búsqueda por teléfono: ignora espacios, guiones y lada (+52).
      const phoneQ = phoneQueryDigits(data.q);
      if (!phoneQ && raw.length < 2) return { services: [], sellers: [] };
      const tokens = phoneQ ? [] : raw.split(/\s+/).filter((t) => t.length > 0);
      if (!phoneQ && tokens.length === 0) return { services: [], sellers: [] };


      const supabase = publicClient();
      const [catsRes, servicesRes, groups, stock] = await Promise.all([
        supabase.from("categories").select("id,slug,name,sort_order").order("sort_order"),
        supabase
          .from("services")
          .select("id,slug,name,color,sort_order,category_id")
          .order("sort_order"),
        pageAll<GroupRowDb>((from, to) =>
          supabase
            .from("groups")
            .select("id,slug,name,kind,phone,parent_group,notes")
            .order("sort_order")
            .range(from, to),
        ),
        pageAll<StockRowDb>((from, to) =>
          supabase
            .from("stock_items")
            .select("id,group_id,service_id,product_type,months,price,detail,available")
            .range(from, to),
        ),
      ]);

      const catRows = (catsRes.data ?? []) as Array<{
        id: string;
        slug: string;
        name: string;
        sort_order: number;
      }>;
      const catById = new Map(catRows.map((c) => [c.id, c]));
      const allServices = (servicesRes.data ?? []) as Array<{
        id: string;
        slug: string;
        name: string;
        color: string | null;
        sort_order: number;
        category_id: string;
      }>;
      const serviceById = new Map(allServices.map((s) => [s.id, s]));
      const groupById = new Map(groups.map((g) => [g.id, g]));

      // Cada palabra se evalúa por separado: servicio + vendedor/grupo +
      // duración + tipo + descripción deben cumplirse todas a la vez.
      const matchesGroupToken = (g: GroupRowDb, token: string) => {
        const tokenDigits = digitsOf(token);
        if (tokenDigits.length >= 4 && digitsOf(g.phone ?? "").includes(tokenDigits)) return true;
        return (
          normalize(g.name).includes(token) || normalize(g.parent_group ?? "").includes(token)
        );
      };

      const groupTokenHit = tokens.some((t) => groups.some((g) => matchesGroupToken(g, t)));

      const matched: StockOffer[] = [];
      for (const row of stock) {
        const g = groupById.get(row.group_id);
        const s = serviceById.get(row.service_id);
        if (!g || !s) continue;
        const cat = catById.get(s.category_id);
        const haystack = normalize(
          [
            s.name,
            g.name,
            g.parent_group ?? "",
            g.notes ?? "",
            row.detail ?? "",
            PRODUCT_TEXT[row.product_type] ?? row.product_type,
            durationText(row.months),
            cat?.name ?? "",
          ].join(" "),
        );
        const ok = tokens.every(
          (t) => haystack.includes(t) || matchesGroupToken(g, t),
        );
        if (!ok) continue;
        const offer = toOffer(row, g, s.name);
        offer.serviceSlug = s.slug;
        offer.serviceOrder = s.sort_order;
        offer.categorySlug = cat?.slug ?? "otros";
        offer.categoryName = cat?.name ?? "Otros";
        offer.categoryOrder = cat?.sort_order ?? 99;
        matched.push(offer);
      }

      if (matched.length === 0) return { services: [], sellers: [] };

      if (groupTokenHit) {
        // Resultados por vendedor, ordenados por categoría y por la posición
        // fija del servicio dentro de esa categoría.
        const bySeller = new Map<string, StockOffer[]>();
        for (const o of matched) {
          const list = bySeller.get(o.group.slug) ?? [];
          list.push(o);
          bySeller.set(o.group.slug, list);
        }
        const sellers: SearchSellerResult[] = [...bySeller.entries()]
          .slice(0, 20)
          .map(([slug, offers]) => {
            const g = offers[0]!.group;
            return {
              slug,
              name: g.name,
              kind: g.kind,
              phone: g.phone,
              parentGroup: g.parentGroup,
              offers,
            };
          });
        return { services: [], sellers };
      }

      const byService = new Map<string, StockOffer[]>();
      for (const o of matched) {
        const key = o.serviceSlug ?? "";
        const list = byService.get(key) ?? [];
        list.push(o);
        byService.set(key, list);
      }
      const services: SearchServiceResult[] = [...byService.entries()]
        .sort((a, b) => {
          const sa = a[1][0]!;
          const sb = b[1][0]!;
          return (
            (sa.categoryOrder ?? 99) - (sb.categoryOrder ?? 99) ||
            (sa.serviceOrder ?? 99) - (sb.serviceOrder ?? 99)
          );
        })
        .slice(0, 20)
        .map(([slug, offers]) => {
          const svc = allServices.find((s) => s.slug === slug);
          return {
            slug,
            name: offers[0]!.serviceName ?? slug,
            color: svc?.color ?? null,
            categoryName: offers[0]!.categoryName ?? "",
            offers,
          };
        });

      return { services, sellers: [] };
    },
  );
