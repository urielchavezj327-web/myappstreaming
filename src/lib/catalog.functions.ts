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

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [cats, subs, services, stock] = await Promise.all([
    supabase.from("categories").select("slug,name,sort_order").order("sort_order"),
    supabase.from("subcategories").select("id,slug,name,sort_order").order("sort_order"),
    supabase
      .from("services")
      .select("id,slug,name,color,sort_order,category_id,subcategory_id")
      .order("sort_order"),
    supabase.from("stock_items").select("service_id,price,available"),
  ]);

  const catRows = (cats.data ?? []) as Array<{ slug: string; name: string }>;
  const subRows = (subs.data ?? []) as Array<{ id: string; slug: string; name: string }>;
  const catById = new Map<string, { slug: string; name: string }>();
  const catBySlug = new Map<string, { slug: string; name: string }>();
  for (const c of catRows) catBySlug.set(c.slug, c);

  const rawCats = (await supabase.from("categories").select("id,slug,name")).data ?? [];
  for (const c of rawCats as Array<{ id: string; slug: string; name: string }>) {
    catById.set(c.id, { slug: c.slug, name: c.name });
  }
  const subById = new Map(subRows.map((s) => [s.id, s]));

  const agg = new Map<string, { offers: number; min: number | null }>();
  for (const row of (stock.data ?? []) as Array<{
    service_id: string;
    price: number | null;
    available: boolean;
  }>) {
    const cur = agg.get(row.service_id) ?? { offers: 0, min: null };
    cur.offers += 1;
    if (row.price !== null) {
      cur.min = cur.min === null ? Number(row.price) : Math.min(cur.min, Number(row.price));
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
  group: {
    slug: string;
    name: string;
    kind: string;
    phone: string | null;
    parentGroup: string | null;
    variant: string | null;
  };
};


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
      subcategory_id: string | null;
    };

    const [cat, groups, stock] = await Promise.all([
      supabase.from("categories").select("slug,name").eq("id", service.category_id).maybeSingle(),
      supabase.from("groups").select("id,slug,name,kind,phone,parent_group,notes"),
      supabase
        .from("stock_items")
        .select("id,group_id,product_type,months,price,detail,available")
        .eq("service_id", service.id),
    ]);

    const groupById = new Map(
      ((groups.data ?? []) as Array<{
        id: string;
        slug: string;
        name: string;
        kind: string;
        phone: string | null;
        parent_group: string | null;
        notes: string | null;
      }>).map((g) => [g.id, g]),
    );

    const offers: StockOffer[] = ((stock.data ?? []) as Array<{
      id: string;
      group_id: string;
      product_type: string;
      months: number | null;
      price: number | null;
      detail: string | null;
      available: boolean;
    }>)
      .map((row) => {
        const g = groupById.get(row.group_id);
        if (!g) return null;
        return {
          id: row.id,
          productType: row.product_type,
          months: row.months,
          price: row.price === null ? null : Number(row.price),
          detail: row.detail,
          available: row.available,
          group: {
            slug: g.slug,
            name: g.name,
            kind: g.kind,
            phone: g.phone,
            parentGroup: g.parent_group,
            variant: g.notes,
          },
        };
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
