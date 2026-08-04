import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type GroupRow = {
  slug: string;
  name: string;
  kind: string;
  phone: string | null;
  parentGroup: string | null;
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
    supabase
      .from("groups")
      .select("id,slug,name,kind,phone,parent_group,sort_order")
      .order("sort_order"),
    supabase.from("stock_items").select("group_id"),
  ]);

  const counts = new Map<string, number>();
  for (const row of (stock.data ?? []) as Array<{ group_id: string }>) {
    counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
  }

  const rows: GroupRow[] = ((groups.data ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    kind: string;
    phone: string | null;
    parent_group: string | null;
  }>).map((g) => ({
    slug: g.slug,
    name: g.name,
    kind: g.kind,
    phone: g.phone,
    parentGroup: g.parent_group,
    offers: counts.get(g.id) ?? 0,
  }));

  return { groups: rows };
});
