import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Lock, MessageCircle, Pencil, Trash2 } from "lucide-react";

import { getGroups, type GroupRow } from "@/lib/groups.functions";
import { whatsappLink } from "@/lib/format";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  deleteSeller,
  getAdminState,
  unlockAdmin,
  updateSeller,
} from "@/lib/admin.functions";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: () => getGroups(),
  component: GroupsPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-muted-foreground">No se pudo cargar: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-10">Sin grupos.</div>,
});

type Modal =
  | { kind: "edit"; row: GroupRow }
  | { kind: "delete"; row: GroupRow }
  | null;

function GroupsPage() {
  const { groups } = Route.useLoaderData() as { groups: GroupRow[] };
  const router = useRouter();
  const internal = groups.filter((g) => g.kind === "interno");
  const free = groups.filter((g) => g.kind !== "interno");
  const [modal, setModal] = useState<Modal>(null);

  // Los vendedores se agrupan bajo su grupo padre, en el orden del catálogo.
  const byParent = useMemo(() => {
    const map = new Map<string, GroupRow[]>();
    for (const g of free) {
      const key = g.parentGroup ?? "Sin grupo";
      const list = map.get(key) ?? [];
      list.push(g);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [free]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        <header>
          <h1 className="t-display">Grupos y vendedores</h1>
          <p className="mt-3 text-[13px] text-muted-foreground">
            {internal.length} grupos internos · {free.length} vendedores de venta libre
          </p>
        </header>

        <section>
          <h2 className="border-b border-border pb-3 t-title">Mis Grupos</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {internal.map((g) => (
              <SellerCard key={g.slug} row={g} onEdit={setModal} />
            ))}
          </div>
        </section>

        <section className="space-y-9">
          <h2 className="border-b border-border pb-3 t-title">Vendedores de Venta Libre</h2>
          {byParent.map(([parent, rows]) => (
            <div key={parent}>
              <p className="mb-3 t-label text-faint">{parent}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {rows.map((g) => (
                  <SellerCard key={g.slug} row={g} contact onEdit={setModal} />
                ))}
              </div>
            </div>
          ))}
        </section>
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

function SellerCard({
  row,
  contact = false,
  onEdit,
}: {
  row: GroupRow;
  contact?: boolean;
  onEdit: (m: Modal) => void;
}) {
  // Regla permanente: grupo/teléfono solo en venta libre.
  const meta: string[] = [];
  if (contact) meta.push(row.phone ?? "Sin número publicado");
  if (row.variant) meta.push(row.variant);
  meta.push(`${row.offers} ofertas`);

  return (
    <div className="glass rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold tracking-tight">{row.name}</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">{meta.join(" · ")}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            aria-label="Editar vendedor"
            onClick={() => onEdit({ kind: "edit", row })}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Eliminar vendedor"
            onClick={() => onEdit({ kind: "delete", row })}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {contact && row.phone ? (
        <a
          href={whatsappLink(row.phone, "Hola, vengo del comparador de precios.")}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2.2} /> WhatsApp
        </a>
      ) : null}
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-input bg-surface-2 px-3 text-sm outline-none transition-colors focus:border-border-strong";
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

  useMemo(() => {
    checkState()
      .then((r) => setUnlocked(r.unlocked))
      .catch(() => setUnlocked(false));
    return null;
  }, [checkState]);

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="glass elev rise w-full max-w-md rounded-3xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="t-title">
          {modal.kind === "edit" ? "Editar vendedor" : "Eliminar vendedor"}
        </h3>

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
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={inputCls}
            />
            {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={busy || !pin}
                className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Entrar
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
                className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
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
              Se eliminará <span className="text-foreground">{modal.row.name}</span> y sus{" "}
              {modal.row.offers} ofertas. Esta acción no se puede deshacer.
            </p>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="h-11 flex-1 rounded-xl bg-destructive text-sm font-semibold text-destructive-foreground disabled:opacity-50"
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
