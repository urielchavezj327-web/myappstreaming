import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import { pageAll } from "@/lib/catalog.functions";

export type GroupRow = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  phone: string | null;
  parentGroup: string | null;
  variant: string | null;
  offers: number;
};

export const getGroups = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
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

  const [groups, stock] = await Promise.all([
    pageAll<{
      id: string;
      slug: string;
      name: string;
      kind: string;
      phone: string | null;
      parent_group: string | null;
      notes: string | null;
    }>((from, to) =>
      supabase
        .from("groups")
        .select("id,slug,name,kind,phone,parent_group,notes,sort_order")
        .order("sort_order")
        .range(from, to),
    ),
    // PostgREST corta en 1000 filas: hay que paginar para contar todas las ofertas.
    pageAll<{ group_id: string }>((from, to) =>
      supabase.from("stock_items").select("group_id").range(from, to),
    ),
  ]);

  const counts = new Map<string, number>();
  for (const row of stock) {
    counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
  }

  const rows: GroupRow[] = groups.map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    kind: g.kind,
    // Regla permanente: el teléfono solo existe para venta libre.
    phone: g.kind === "venta_libre" ? g.phone : null,
    parentGroup: g.parent_group,
    variant: g.notes,
    offers: counts.get(g.id) ?? 0,
  }));

  return { groups: rows };
});
