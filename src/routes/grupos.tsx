import { createFileRoute } from "@tanstack/react-router";

import { getGroups, type GroupRow } from "@/lib/groups.functions";
import { whatsappLink } from "@/lib/format";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const Route = createFileRoute("/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos y vendedores — Comparador de Stock" },
      {
        name: "description",
        content:
          "Directorio de grupos internos y vendedores de venta libre con su contacto de WhatsApp y número de ofertas publicadas.",
      },
      { property: "og:title", content: "Grupos y vendedores — Comparador de Stock" },
      {
        property: "og:description",
        content: "Grupos internos y venta libre, con contacto directo por WhatsApp.",
      },
    ],
  }),
  loader: () => getGroups(),
  component: GroupsPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-muted-foreground">No se pudo cargar: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-10">Sin grupos.</div>,
});

function GroupsPage() {
  const { groups } = Route.useLoaderData() as { groups: GroupRow[] };
  const internal = groups.filter((g) => g.kind === "interno");
  const free = groups.filter((g) => g.kind !== "interno");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-14 px-5 py-14">
        <div>
          <h1 className="text-3xl sm:text-4xl">Grupos y vendedores</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {internal.length} grupos internos y {free.length} anuncios de venta libre.
          </p>
        </div>
        <GroupList title="Grupos donde estoy dentro" rows={internal} />
        <GroupList title="Grupo de Venta Libre" rows={free} contact />
      </main>
      <SiteFooter />
    </div>
  );
}

function GroupList({
  title,
  rows,
  contact = false,
}: {
  title: string;
  rows: GroupRow[];
  contact?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <section>
      <h2 className="border-b border-border pb-3 text-xl">{title}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map((g) => (
          <div key={g.slug} className="rounded-xl border border-border bg-surface p-4">
            {g.parentGroup ? (
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {g.parentGroup}
              </p>
            ) : null}
            <h3 className="mt-1 text-base font-semibold">{g.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {g.phone ?? "Sin número publicado"} · {g.offers} ofertas
            </p>
            {contact && g.phone ? (
              <a
                href={whatsappLink(g.phone, "Hola, vengo del comparador de precios.")}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
