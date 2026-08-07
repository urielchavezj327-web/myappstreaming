import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

type AdminSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "cs-admin",
    maxAge: 60 * 60 * 24 * 14,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function pinMatches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

async function requireUnlocked() {
  const session = await useSession<AdminSession>(sessionConfig());
  if (!session.data.unlocked) throw new Error("PIN requerido");
}

export const getAdminState = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  return { unlocked: session.data.unlocked === true };
});

export const unlockAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ pin: z.string().min(1).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PIN"];
    if (!expected) throw new Error("Falta configurar el PIN");
    if (!pinMatches(data.pin, expected)) return { ok: false as const };
    const session = await useSession<AdminSession>(sessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export type AdminOptions = {
  categories: Array<{ id: string; slug: string; name: string }>;
  services: Array<{ id: string; name: string; categoryId: string }>;
  groups: Array<{ id: string; name: string; kind: string; parentGroup: string | null }>;
};

export const getAdminOptions = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminOptions> => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [cats, services, groups] = await Promise.all([
      supabaseAdmin.from("categories").select("id,slug,name").order("sort_order"),
      supabaseAdmin.from("services").select("id,name,category_id").order("sort_order"),
      supabaseAdmin.from("groups").select("id,name,kind,parent_group").order("sort_order"),
    ]);
    return {
      categories: (cats.data ?? []).map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
      services: (services.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        categoryId: s.category_id,
      })),
      groups: (groups.data ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        kind: g.kind,
        parentGroup: g.parent_group,
      })),
    };
  },
);

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "vendedor"
  );
}

const offerSchema = z.object({
  serviceId: z.string().uuid(),
  productType: z.string().min(1).max(40),
  months: z.number().int().min(0).max(120).nullable(),
  price: z.number().min(0).max(1_000_000).nullable(),
  detail: z.string().max(200).nullable(),
});

const saveSchema = z.object({
  seller: z.union([
    z.object({ mode: z.literal("existing"), groupId: z.string().uuid() }),
    z.object({
      mode: z.literal("new"),
      name: z.string().trim().min(1).max(80),
      kind: z.enum(["interno", "venta_libre"]),
      phone: z.string().trim().max(40).nullable(),
      parentGroup: z.string().trim().max(80).nullable(),
    }),
  ]),
  offers: z.array(offerSchema).min(1).max(50),
});

export const saveStock = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let groupId: string;
    if (data.seller.mode === "existing") {
      groupId = data.seller.groupId;
    } else {
      const seller = data.seller;
      const { data: maxRow } = await supabaseAdmin
        .from("groups")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const inserted = await supabaseAdmin
        .from("groups")
        .insert({
          slug: `${slugify(seller.name)}-${Math.random().toString(36).slice(2, 7)}`,
          name: seller.name,
          kind: seller.kind,
          // Regla permanente: el teléfono solo se guarda para venta libre.
          phone: seller.kind === "venta_libre" ? (seller.phone || null) : null,
          parent_group: seller.kind === "venta_libre" ? (seller.parentGroup || null) : null,
          sort_order: ((maxRow?.sort_order as number | undefined) ?? 0) + 1,
        })
        .select("id")
        .single();
      if (inserted.error) throw new Error(inserted.error.message);
      groupId = inserted.data.id;
    }

    const rows = data.offers.map((o) => ({
      service_id: o.serviceId,
      group_id: groupId,
      product_type: o.productType,
      months: o.months,
      price: o.price,
      detail: o.detail,
      available: true,
    }));

    const res = await supabaseAdmin.from("stock_items").insert(rows);
    if (res.error) throw new Error(res.error.message);
    return { ok: true as const, inserted: rows.length };
  });

export type AdminOffer = {
  id: string;
  serviceName: string;
  groupName: string;
  productType: string;
  months: number | null;
  price: number | null;
  detail: string | null;
  available: boolean;
};

export const searchAdminOffers = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ q: z.string().max(80) }).parse(input))
  .handler(async ({ data }): Promise<{ offers: AdminOffer[] }> => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const term = data.q.trim();
    let serviceIds: string[] = [];
    let groupIds: string[] = [];

    if (term.length >= 2) {
      const [svc, grp] = await Promise.all([
        supabaseAdmin.from("services").select("id").ilike("name", `%${term}%`).limit(20),
        supabaseAdmin.from("groups").select("id").ilike("name", `%${term}%`).limit(20),
      ]);
      serviceIds = (svc.data ?? []).map((s) => s.id);
      groupIds = (grp.data ?? []).map((g) => g.id);
      if (serviceIds.length === 0 && groupIds.length === 0) return { offers: [] };
    }

    let query = supabaseAdmin
      .from("stock_items")
      .select("id,product_type,months,price,detail,available,services(name),groups(name)")
      .order("created_at", { ascending: false })
      .limit(80);

    if (term.length >= 2) {
      const filters: string[] = [];
      if (serviceIds.length) filters.push(`service_id.in.(${serviceIds.join(",")})`);
      if (groupIds.length) filters.push(`group_id.in.(${groupIds.join(",")})`);
      query = query.or(filters.join(","));
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const offers = (rows ?? []).map((row) => {
      const r = row as unknown as {
        id: string;
        product_type: string;
        months: number | null;
        price: number | null;
        detail: string | null;
        available: boolean;
        services: { name: string } | null;
        groups: { name: string } | null;
      };
      return {
        id: r.id,
        serviceName: r.services?.name ?? "—",
        groupName: r.groups?.name ?? "—",
        productType: r.product_type,
        months: r.months,
        price: r.price === null ? null : Number(r.price),
        detail: r.detail,
        available: r.available,
      };
    });
    return { offers };
  });

export const updateSeller = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(80),
        phone: z.string().trim().max(40).nullable(),
        parentGroup: z.string().trim().max(80).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const current = await supabaseAdmin
      .from("groups")
      .select("kind")
      .eq("id", data.id)
      .maybeSingle();
    const isFree = current.data?.kind === "venta_libre";
    const { error } = await supabaseAdmin
      .from("groups")
      .update({
        name: data.name,
        // Regla permanente: el teléfono y el grupo solo aplican a venta libre.
        phone: isFree ? (data.phone || null) : null,
        parent_group: isFree ? (data.parentGroup || null) : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteSeller = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const del = await supabaseAdmin.from("stock_items").delete().eq("group_id", data.id);
    if (del.error) throw new Error(del.error.message);
    const { error } = await supabaseAdmin.from("groups").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });


export const updateOffer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        price: z.number().min(0).max(1_000_000).nullable(),
        months: z.number().int().min(0).max(120).nullable(),
        detail: z.string().max(200).nullable(),
        available: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("stock_items")
      .update({
        price: data.price,
        months: data.months,
        detail: data.detail,
        available: data.available,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteOffer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("stock_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
