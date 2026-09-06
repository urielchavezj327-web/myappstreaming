import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { matchesQuery, norm, parseQuery } from "./search-core";
import {
  buildSearchResults,
  pageAll,
  type SearchSellerResult,
  type SearchServiceResult,
  type StockOffer,
} from "./catalog.functions";
import { resolveBrand } from "./brands";

type AdminSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    // Nombre nuevo: invalida cualquier sesión antigua de 14 días.
    name: "cs-admin-v2",
    // Sesión corta: el PIN se vuelve a pedir a las 2 horas.
    maxAge: 60 * 60 * 2,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function pinMatches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

async function requireUnlocked() {
  // `useSession` es la API de sesión de servidor de TanStack Start, no un hook
  // de React: la regla de hooks no aplica aquí.
  // eslint-disable-next-line react-hooks/rules-of-hooks
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
  subcategories: Array<{ id: string; slug: string; name: string; categoryId: string }>;
  services: Array<{ id: string; name: string; categoryId: string }>;
  groups: Array<{ id: string; name: string; kind: string; parentGroup: string | null }>;
};

export const getAdminOptions = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminOptions> => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [cats, subs, services, groups] = await Promise.all([
      supabaseAdmin.from("categories").select("id,slug,name").order("sort_order"),
      supabaseAdmin.from("subcategories").select("id,slug,name,category_id").order("sort_order"),
      supabaseAdmin.from("services").select("id,name,category_id").order("sort_order"),
      supabaseAdmin.from("groups").select("id,name,kind,parent_group").order("sort_order"),
    ]);
    return {
      categories: (cats.data ?? []).map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
      subcategories: (subs.data ?? []).map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        categoryId: s.category_id,
      })),
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
      const parent = seller.kind === "venta_libre" ? seller.parentGroup || null : null;

      // Regla permanente: un vendedor nuevo se inserta junto a los demás
      // vendedores de su mismo grupo padre, nunca al final de /grupos.
      let nextOrder: number;
      const { data: siblings } = await supabaseAdmin
        .from("groups")
        .select("sort_order")
        .eq("parent_group", parent ?? "")
        .order("sort_order", { ascending: false })
        .limit(1);
      const siblingMax = parent ? (siblings?.[0]?.sort_order as number | undefined) : undefined;

      if (siblingMax !== undefined) {
        nextOrder = siblingMax + 1;
        const { data: after } = await supabaseAdmin
          .from("groups")
          .select("id,sort_order")
          .gte("sort_order", nextOrder)
          .order("sort_order", { ascending: false });
        for (const row of after ?? []) {
          await supabaseAdmin
            .from("groups")
            .update({ sort_order: (row.sort_order as number) + 1 })
            .eq("id", row.id);
        }
      } else {
        const { data: maxRow } = await supabaseAdmin
          .from("groups")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        nextOrder = ((maxRow?.sort_order as number | undefined) ?? 0) + 1;
      }

      const inserted = await supabaseAdmin
        .from("groups")
        .insert({
          slug: `${slugify(seller.name)}-${Math.random().toString(36).slice(2, 7)}`,
          name: seller.name,
          kind: seller.kind,
          // Regla permanente: el teléfono solo se guarda para venta libre.
          phone: seller.kind === "venta_libre" ? seller.phone || null : null,
          parent_group: parent,
          sort_order: nextOrder,
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

/**
 * Alta de un servicio nuevo desde el panel.
 *
 * El color se resuelve con el mismo registro de marcas que pinta las fichas,
 * así que un servicio llamado "Claude" nace con el naranja de Anthropic y su
 * ficha queda idéntica al resto sin ningún paso extra.
 */
export const createService = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(60),
        categoryId: z.string().uuid(),
        subcategoryId: z.string().uuid().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const cat = await supabaseAdmin
      .from("categories")
      .select("slug")
      .eq("id", data.categoryId)
      .maybeSingle();
    if (!cat.data) throw new Error("Esa categoría no existe");

    let sub: { slug: string } | null = null;
    if (data.subcategoryId) {
      const res = await supabaseAdmin
        .from("subcategories")
        .select("slug,category_id")
        .eq("id", data.subcategoryId)
        .maybeSingle();
      if (!res.data || res.data.category_id !== data.categoryId) {
        throw new Error("Esa subcategoría no pertenece a la categoría elegida");
      }
      sub = { slug: res.data.slug };
    }

    // Nombre repetido dentro de la misma categoría: se avisa en vez de crear
    // una ficha duplicada que partiría las ofertas en dos.
    const existing = await supabaseAdmin
      .from("services")
      .select("name")
      .eq("category_id", data.categoryId);
    const clash = (existing.data ?? []).find((r) => norm(r.name) === norm(data.name));
    if (clash) throw new Error(`Ya existe "${clash.name}" en esa categoría`);

    let slug = slugify(data.name);
    const taken = await supabaseAdmin
      .from("services")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (taken.data) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const brand = resolveBrand({
      name: data.name,
      categorySlug: cat.data.slug,
      subcategorySlug: sub?.slug ?? null,
    });

    const { data: maxRow } = await supabaseAdmin
      .from("services")
      .select("sort_order")
      .eq("category_id", data.categoryId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = ((maxRow?.sort_order as number | undefined) ?? 0) + 1;

    const inserted = await supabaseAdmin
      .from("services")
      .insert({
        slug,
        name: data.name,
        color: brand.colors[0] ?? "#8A8A93",
        category_id: data.categoryId,
        subcategory_id: data.subcategoryId,
        sort_order: sortOrder,
      })
      .select("id,name,category_id")
      .single();
    if (inserted.error) throw new Error(inserted.error.message);

    return {
      id: inserted.data.id,
      name: inserted.data.name,
      categoryId: inserted.data.category_id,
    };
  });

/**
 * Buscador del panel. Usa EXACTAMENTE el mismo motor y el mismo agrupamiento
 * que la portada (`search-core` + `buildSearchResults`), para que los
 * resultados se vean y se ordenen igual en los dos sitios. Lo único propio del
 * panel es el filtro por categoría y que cada oferta trae su `id` para poder
 * editarla o borrarla en línea.
 */
export const searchAdminOffers = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ q: z.string().max(80), cat: z.string().max(40).optional() }).parse(input),
  )
  .handler(
    async ({
      data,
    }): Promise<{ services: SearchServiceResult[]; sellers: SearchSellerResult[] }> => {
      await requireUnlocked();
      const parsed = parseQuery(data.q);
      // Antes se devolvía todo el stock cargado cuando no había búsqueda; ahora
      // el panel arranca vacío, igual que la portada.
      if (parsed.empty) return { services: [], sellers: [] };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [catsRes, subsRes, servicesRes, groupsRes, stock] = await Promise.all([
        supabaseAdmin.from("categories").select("id,slug,name,sort_order").order("sort_order"),
        supabaseAdmin.from("subcategories").select("id,slug,sort_order"),
        supabaseAdmin
          .from("services")
          .select("id,slug,name,color,sort_order,category_id,subcategory_id")
          .order("sort_order"),
        supabaseAdmin
          .from("groups")
          .select("id,slug,name,kind,phone,parent_group,notes")
          .order("sort_order"),
        pageAll<{
          id: string;
          group_id: string;
          service_id: string;
          product_type: string;
          months: number | null;
          price: number | null;
          detail: string | null;
          available: boolean;
        }>((from, to) =>
          supabaseAdmin
            .from("stock_items")
            .select("id,group_id,service_id,product_type,months,price,detail,available")
            .range(from, to),
        ),
      ]);

      const catById = new Map((catsRes.data ?? []).map((c) => [c.id, c]));
      const subById = new Map((subsRes.data ?? []).map((s) => [s.id, s]));
      const svcById = new Map((servicesRes.data ?? []).map((s) => [s.id, s]));
      const groupById = new Map((groupsRes.data ?? []).map((g) => [g.id, g]));
      const groups = [...groupById.values()];

      const groupTokenHit =
        parsed.phone !== null ||
        parsed.sellerLetters.length > 0 ||
        parsed.tokens.some((t) =>
          groups.some((g) => norm(g.name).includes(t) || norm(g.parent_group ?? "").includes(t)),
        );

      const cat = data.cat?.trim() ?? "";
      const matched: StockOffer[] = [];
      for (const row of stock) {
        const g = groupById.get(row.group_id);
        const s = svcById.get(row.service_id);
        if (!g || !s) continue;
        const category = catById.get(s.category_id);
        if (cat && (category?.slug ?? "") !== cat) continue;
        const ok = matchesQuery(
          {
            serviceName: s.name,
            categoryName: category?.name ?? "",
            groupName: g.name,
            parentGroup: g.parent_group,
            variant: g.notes,
            phone: g.phone,
            detail: row.detail,
            productType: row.product_type,
            months: row.months,
          },
          parsed,
        );
        if (!ok) continue;

        const sub = s.subcategory_id ? subById.get(s.subcategory_id) : undefined;
        matched.push({
          id: row.id,
          productType: row.product_type,
          months: row.months,
          price: row.price === null ? null : Number(row.price),
          detail: row.detail,
          available: row.available,
          serviceName: s.name,
          serviceSlug: s.slug,
          serviceOrder: s.sort_order,
          categorySlug: category?.slug ?? "otros",
          categoryName: category?.name ?? "Otros",
          categoryOrder: category?.sort_order ?? 99,
          subcategorySlug: sub?.slug ?? null,
          subcategoryOrder: sub?.sort_order ?? null,
          group: {
            slug: g.slug,
            name: g.name,
            kind: g.kind,
            // Regla permanente: el teléfono solo existe para venta libre.
            phone: g.kind === "venta_libre" ? g.phone : null,
            parentGroup: g.parent_group,
            variant: g.notes,
          },
        });
      }

      const colorBySlug = new Map((servicesRes.data ?? []).map((s) => [s.slug, s.color]));
      return buildSearchResults(matched, groupTokenHit, colorBySlug, 12);
    },
  );

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
        phone: isFree ? data.phone || null : null,
        parent_group: isFree ? data.parentGroup || null : null,
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
