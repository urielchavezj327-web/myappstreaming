import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Lock, MessageCircle, Pencil, Search, Star, Trash2, X } from "lucide-react";

import { getGroups, type GroupRow } from "@/lib/groups.functions";
import { whatsappLink } from "@/lib/format";
import { compareSellers, norm } from "@/lib/search-core";
import { useFavorites } from "@/lib/favorites";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { deleteSeller, getAdminState, unlockAdmin, updateSeller } from "@/lib/admin.functions";

export const Route = createFileRoute("/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos y vendedores — Stock Index" },
      {
        name: "description",
        content:
          "Directorio de grupos internos y vendedores de venta libre con su contacto de WhatsApp y número de ofertas publicadas.",
      },
      { property: "og:title", content: "Grupos y vendedores — Stock Index" },
      {
        property: "og:description",
        content: "Grupos internos y venta libre, con contacto directo por WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: () => getGroups(),
  // Al volver de "Ver stock" la página se pinta desde caché con su altura
  // completa, que es lo que permite recuperar la posición de scroll.
  staleTime: 5 * 60_000,
  component: GroupsPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-muted-foreground">No se pudo cargar: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-10">Sin grupos.</div>,
});

type Modal = { kind: "edit"; row: GroupRow } | { kind: "delete"; row: GroupRow } | null;

function GroupsPage() {
  const { groups } = Route.useLoaderData() as { groups: GroupRow[] };
  const router = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const { isFavorite, toggle } = useFavorites();
  const [filter, setFilter] = useState("");

  const query = norm(filter);
  const matches = (g: GroupRow) =>
    query.length === 0 ||
    norm(g.name).includes(query) ||
    norm(g.parentGroup ?? "").includes(query) ||
    (g.phone ?? "").replace(/\D/g, "").includes(query.replace(/\D/g, "")) ||
    false;

  // "Mis Grupos" conserva el orden que tiene en la base: es un orden propio
  // (MonShop primero) y no hay vendedores "A, B, C" que reordenar.
  const internal = useMemo(
    () => groups.filter((g) => g.kind === "interno" && matches(g)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, query],
  );

  const free = useMemo(() => groups.filter((g) => g.kind !== "interno"), [groups]);

  // Los vendedores se agrupan bajo su grupo padre, en el orden del catálogo, y
  // dentro de cada grupo con el orden permanente: primero los que tienen nombre
  // propio, después Vendedor A, B, C…
  const byParent = useMemo(() => {
    const map = new Map<string, GroupRow[]>();
    for (const g of free) {
      const key = g.parentGroup ?? "Sin grupo";
      const list = map.get(key) ?? [];
      list.push(g);
      map.set(key, list);
    }
    return [...map.entries()].map(
      ([parent, rows]) =>
        [parent, rows.slice().sort((a, b) => compareSellers(a.name, b.name))] as const,
    );
  }, [free]);

  const visibleParents = byParent
    .map(([parent, rows]) => [parent, rows.filter(matches)] as const)
    .filter(([, rows]) => rows.length > 0);

  const totalFree = free.length;
  const nothing = internal.length === 0 && visibleParents.length === 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="aurora border-b border-border">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-9 sm:px-6 sm:pb-10 sm:pt-12">
          <h1 className="text-center t-display">Grupos y vendedores</h1>
          <p className="mt-3 text-center text-[13px] text-muted-foreground">
            {groups.filter((g) => g.kind === "interno").length} grupos internos · {totalFree}{" "}
            vendedores de venta libre
          </p>

          <div className="relative mx-auto mt-6 max-w-2xl">
            <Search
              className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              type="search"
              aria-label="Filtrar vendedores o grupos"
              placeholder="Filtra por vendedor, grupo o teléfono…"
              className="glass h-14 w-full rounded-2xl pl-14 pr-12 text-[15px] outline-none transition-all placeholder:text-faint focus:border-border-strong [&::-webkit-search-cancel-button]:hidden"
            />
            {filter ? (
              <button
                type="button"
                onClick={() => setFilter("")}
                aria-label="Limpiar filtro"
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6 sm:py-14">
        {nothing ? (
          <div className="glass rounded-3xl px-6 py-14 text-center">
            <p className="text-[15px] font-medium">Sin resultados para “{filter}”</p>
            <p className="mt-1.5 text-[13px] text-faint">
              Prueba con el nombre del vendedor, su grupo o su teléfono.
            </p>
          </div>
        ) : null}

        {internal.length > 0 ? (
          <section>
            <GroupHeading title="Mis Grupos" count={internal.length} />
            <div className="grid gap-3 sm:grid-cols-2">
              {internal.map((g) => (
                <SellerCard
                  key={g.slug}
                  row={g}
                  onEdit={setModal}
                  favorite={isFavorite(g.slug)}
                  onToggleFavorite={() => toggle(g.slug)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {visibleParents.length > 0 ? (
          <section className="space-y-12">
            {visibleParents.map(([parent, rows]) => (
              <div key={parent}>
                <GroupHeading title={parent} count={rows.length} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {rows.map((g) => (
                    <SellerCard
                      key={g.slug}
                      row={g}
                      contact
                      onEdit={setModal}
                      favorite={isFavorite(g.slug)}
                      onToggleFavorite={() => toggle(g.slug)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </main>

      {modal ? (
        <SellerModal
          modal={modal}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            router.invalidate();
          }}
        />
      ) : null}

      <SiteFooter />
    </div>
  );
}

/**
 * Encabezado de grupo padre. Antes era una etiqueta pequeña y apagada que se
 * confundía con las tarjetas; ahora corta la página en secciones claras.
 */
function GroupHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-6 text-center">
      <div className="flex items-center gap-4">
        <span
          className="h-px flex-1 bg-gradient-to-r from-transparent to-border-strong"
          aria-hidden
        />
        <h2 className="t-section text-foreground">{title}</h2>
        <span
          className="h-px flex-1 bg-gradient-to-l from-transparent to-border-strong"
          aria-hidden
        />
      </div>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-faint">
        {count} vendedor{count === 1 ? "" : "es"}
      </p>
    </div>
  );
}

function SellerCard({
  row,
  contact = false,
  onEdit,
  favorite,
  onToggleFavorite,
}: {
  row: GroupRow;
  contact?: boolean;
  onEdit: (m: Modal) => void;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  // Regla permanente: grupo/teléfono solo en venta libre.
  const meta: string[] = [];
  if (contact) meta.push(row.phone ?? "Sin número publicado");
  if (row.variant) meta.push(row.variant);

  return (
    /*
     * La tarjeta entera es el enlace al stock: antes «Ver stock» era un botón
     * suelto que ocupaba una fila propia y doblaba la altura de cada vendedor,
     * con 56 de ellos en la página. Las acciones de dueño quedan encima, fuera
     * del área del enlace.
     */
    <div className="glass lightedge tappable relative rounded-[1.15rem]">
      <Link
        to="/vendedor/$slug"
        params={{ slug: row.slug }}
        className={`flex items-center gap-3 py-3.5 pl-3 ${contact ? "pr-[8.6rem]" : "pr-[6.6rem]"}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16.5px] font-semibold tracking-tight text-foreground">
            {row.name}
          </span>
          <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-[12.5px] text-faint">
            <span className="font-semibold tabular-nums text-muted-foreground">
              {row.offers} oferta{row.offers === 1 ? "" : "s"}
            </span>
            {meta.length > 0 ? <span className="truncate">{meta.join(" · ")}</span> : null}
          </span>
        </span>
      </Link>

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
        <button
          type="button"
          aria-label={
            favorite ? `Quitar ${row.name} de favoritos` : `Marcar ${row.name} como favorito`
          }
          aria-pressed={favorite}
          onClick={onToggleFavorite}
          className={`tappable flex h-9 w-8 items-center justify-center rounded-xl ${
            favorite ? "text-brand" : "text-faint hover:text-foreground"
          }`}
        >
          <Star className={`h-[17px] w-[17px] ${favorite ? "fill-brand" : ""}`} />
        </button>
        {contact && row.phone ? (
          <a
            href={whatsappLink(row.phone, "Hola, vengo del comparador de precios.")}
            target="_blank"
            rel="noreferrer"
            aria-label={`Escribir a ${row.name} por WhatsApp`}
            className="tappable ml-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-ink"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.3} />
          </a>
        ) : null}
        <button
          type="button"
          aria-label={`Editar ${row.name}`}
          onClick={() => onEdit({ kind: "edit", row })}
          className="tappable flex h-9 w-8 items-center justify-center rounded-xl text-faint hover:text-foreground"
        >
          <Pencil className="h-[17px] w-[17px]" />
        </button>
        <button
          type="button"
          aria-label={`Eliminar ${row.name}`}
          onClick={() => onEdit({ kind: "delete", row })}
          className="tappable flex h-9 w-8 items-center justify-center rounded-xl text-faint hover:text-destructive"
        >
          <Trash2 className="h-[17px] w-[17px]" />
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-input bg-surface-2 px-3 text-[16px] outline-none transition-colors focus:border-border-strong";
const labelCls = "mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-faint";

function SellerModal({
  modal,
  onClose,
  onDone,
}: {
  modal: NonNullable<Modal>;
  onClose: () => void;
  onDone: () => void;
}) {
  const checkState = useServerFn(getAdminState);
  const unlock = useServerFn(unlockAdmin);
  const update = useServerFn(updateSeller);
  const remove = useServerFn(deleteSeller);

  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [name, setName] = useState(modal.row.name);
  const [phone, setPhone] = useState(modal.row.phone ?? "");
  const [parentGroup, setParentGroup] = useState(modal.row.parentGroup ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // La sesión se revalida en el servidor cada vez que se abre el modal; si algo
  // falla, el estado por defecto es bloqueado.
  useEffect(() => {
    let alive = true;
    checkState()
      .then((r) => alive && setUnlocked(r.unlocked))
      .catch(() => alive && setUnlocked(false));
    return () => {
      alive = false;
    };
  }, [checkState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (modal.kind === "edit") {
        await update({
          data: {
            id: modal.row.id,
            name: name.trim(),
            phone: phone.trim() || null,
            parentGroup: parentGroup.trim() || null,
          },
        });
      } else {
        await remove({ data: { id: modal.row.id } });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="frost pop-in w-full max-w-md rounded-3xl p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={modal.kind === "edit" ? "Editar vendedor" : "Eliminar vendedor"}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="t-title">
            {modal.kind === "edit" ? "Editar vendedor" : "Eliminar vendedor"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {unlocked === null ? (
          <div className="skeleton mt-5 h-24 rounded-2xl" />
        ) : !unlocked ? (
          <form
            className="mt-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const res = await unlock({ data: { pin } });
                if (res.ok) setUnlocked(true);
                else setError("PIN incorrecto.");
              } catch {
                setError("PIN incorrecto.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className={labelCls} htmlFor="pin-grupos">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> PIN de acceso
              </span>
            </label>
            <input
              id="pin-grupos"
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={inputCls}
            />
            {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={busy || !pin}
                className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? "Verificando…" : "Entrar"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-xl border border-border px-4 text-sm text-muted-foreground"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : modal.kind === "edit" ? (
          <div className="mt-5 space-y-4">
            <div>
              <label className={labelCls} htmlFor="s-name">
                Nombre
              </label>
              <input
                id="s-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>
            {modal.row.kind === "venta_libre" ? (
              <>
                <div>
                  <label className={labelCls} htmlFor="s-parent">
                    Grupo de venta libre
                  </label>
                  <input
                    id="s-parent"
                    value={parentGroup}
                    onChange={(e) => setParentGroup(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="s-phone">
                    Teléfono
                  </label>
                  <input
                    id="s-phone"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </>
            ) : null}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || !name.trim()}
                onClick={submit}
                className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? "Guardando…" : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-xl border border-border px-4 text-sm text-muted-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Se eliminará <span className="font-semibold text-foreground">{modal.row.name}</span> y
              sus {modal.row.offers} ofertas. Esta acción no se puede deshacer.
            </p>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="h-11 flex-1 rounded-xl bg-destructive text-sm font-semibold text-destructive-foreground transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? "Eliminando…" : "Eliminar vendedor"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-xl border border-border px-4 text-sm text-muted-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
