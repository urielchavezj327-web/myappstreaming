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
    const svc = await supabase
      .from("services")
      .select("id,slug,name,color,category_id,subcategory_id")
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

    const [cat, groups, stock] = await Promise.all([
      supabase.from("categories").select("slug,name").eq("id", service.category_id).maybeSingle(),
      pageAll<GroupRowDb>((from, to) =>
        supabase.from("groups").select("id,slug,name,kind,phone,parent_group,notes").range(from, to),
      ),
      pageAll<StockRowDb>((from, to) =>
        supabase
          .from("stock_items")
          .select("id,group_id,service_id,product_type,months,price,detail,available")
          .eq("service_id", service.id)
          .range(from, to),
      ),
    ]);

    const groupById = new Map(groups.map((g) => [g.id, g]));
    const offers: StockOffer[] = stock
      .map((row) => {
        const g = groupById.get(row.group_id);
        return g ? toOffer(row, g) : null;
      })
      .filter((o): o is StockOffer => o !== null);

    return {
      service: {
        slug: service.slug,
        name: service.name,
        color: service.color,
        category: (cat.data as { slug: string; name: string } | null)?.slug ?? "otros",
        categoryName: (cat.data as { slug: string; name: string } | null)?.name ?? "Otros",
      },
      offers,
    };
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

export const searchStock = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ q: z.string().max(80) }).parse(input))
  .handler(
    async ({
      data,
    }): Promise<{ services: SearchServiceResult[]; sellers: SearchSellerResult[] }> => {
      const q = normalize(data.q);
      if (q.length < 2) return { services: [], sellers: [] };
      const supabase = publicClient();

      const [catsRes, servicesRes, groups] = await Promise.all([
        supabase.from("categories").select("id,name"),
        supabase.from("services").select("id,slug,name,color,category_id").order("sort_order"),
        pageAll<GroupRowDb>((from, to) =>
          supabase
            .from("groups")
            .select("id,slug,name,kind,phone,parent_group,notes")
            .order("sort_order")
            .range(from, to),
        ),
      ]);

      const catById = new Map(
        ((catsRes.data ?? []) as Array<{ id: string; name: string }>).map((c) => [c.id, c.name]),
      );
      const allServices = (servicesRes.data ?? []) as Array<{
        id: string;
        slug: string;
        name: string;
        color: string | null;
        category_id: string;
      }>;

      const qDigits = digitsOf(data.q);
      const matchedServices = allServices.filter((s) => normalize(s.name).includes(q));
      const matchedGroups = groups.filter(
        (g) =>
          normalize(g.name).includes(q) ||
          normalize(g.parent_group ?? "").includes(q) ||
          (qDigits.length >= 6 && digitsOf(g.phone ?? "").includes(qDigits)),
      );

      const serviceIds = matchedServices.map((s) => s.id);
      const groupIds = matchedGroups.map((g) => g.id);
      if (serviceIds.length === 0 && groupIds.length === 0) return { services: [], sellers: [] };

      const [byService, byGroup] = await Promise.all([
        serviceIds.length
          ? pageAll<StockRowDb>((from, to) =>
              supabase
                .from("stock_items")
                .select("id,group_id,service_id,product_type,months,price,detail,available")
                .in("service_id", serviceIds.slice(0, 20))
                .range(from, to),
            )
          : Promise.resolve([]),
        groupIds.length
          ? pageAll<StockRowDb>((from, to) =>
              supabase
                .from("stock_items")
                .select("id,group_id,service_id,product_type,months,price,detail,available")
                .in("group_id", groupIds.slice(0, 20))
                .range(from, to),
            )
          : Promise.resolve([]),
      ]);

      const groupById = new Map(groups.map((g) => [g.id, g]));
      const serviceById = new Map(allServices.map((s) => [s.id, s]));

      const services: SearchServiceResult[] = matchedServices.slice(0, 20).map((s) => ({
        slug: s.slug,
        name: s.name,
        color: s.color,
        categoryName: catById.get(s.category_id) ?? "",
        offers: byService
          .filter((r) => r.service_id === s.id)
          .map((r) => {
            const g = groupById.get(r.group_id);
            return g ? toOffer(r, g) : null;
          })
          .filter((o): o is StockOffer => o !== null),
      }));

      const sellers: SearchSellerResult[] = matchedGroups.slice(0, 20).map((g) => ({
        slug: g.slug,
        name: g.name,
        kind: g.kind,
        phone: g.kind === "venta_libre" ? g.phone : null,
        parentGroup: g.parent_group,
        offers: byGroup
          .filter((r) => r.group_id === g.id)
          .map((r) => toOffer(r, g, serviceById.get(r.service_id)?.name ?? "—")),
      }));

      return { services, sellers };
    },
  );
