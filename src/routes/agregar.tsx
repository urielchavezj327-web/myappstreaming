import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";


import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  deleteOffer,
  getAdminOptions,
  getAdminState,
  lockAdmin,
  saveStock,
  searchAdminOffers,
  unlockAdmin,
  updateOffer,
  type AdminOffer,
  type AdminOptions,
} from "@/lib/admin.functions";

import { PRODUCT_LABELS, durationLabel, formatPrice, productLabel } from "@/lib/format";

export const Route = createFileRoute("/agregar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Agregar stock — Panel privado" },
      {
        name: "description",
        content:
          "Formulario privado para registrar vendedores y cargar sus ofertas de stock en el comparador.",
      },
      { property: "og:title", content: "Agregar stock — Panel privado" },
      { property: "og:description", content: "Panel privado de captura de stock." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AddStockPage,
});

const DURATIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Único" },
  { value: "0", label: "Permanente" },
  { value: "1", label: "1 mes" },
  { value: "2", label: "2 meses" },
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "Anual" },
  { value: "24", label: "2 años" },
];

type Row = {
  categoryId: string;
  serviceId: string;
  productType: string;
  months: string;
  price: string;
  detail: string;
};

const emptyRow = (categoryId: string): Row => ({
  categoryId,
  serviceId: "",
  productType: "perfil",
  months: "1",
  price: "",
  detail: "",
});

const inputCls =
  "h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm outline-none transition-colors focus:border-border-strong";
const labelCls = "mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground";

function AddStockPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const checkState = useServerFn(getAdminState);

  useEffect(() => {
    checkState()
      .then((r) => setUnlocked(r.unlocked))
      .catch(() => setUnlocked(false));
  }, [checkState]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-12">
        <p className="t-label text-faint">Panel privado</p>
        <h1 className="t-display mt-2">Agregar stock</h1>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Captura los datos del vendedor una sola vez y agrega todas sus ofertas en la misma carga.
        </p>
        {unlocked === null ? (
          <p className="mt-8 text-sm text-muted-foreground">Cargando…</p>
        ) : unlocked ? (
          <AdminPanel onLock={() => setUnlocked(false)} />
        ) : (
          <>
            <div className="mt-8 space-y-3" aria-hidden>
              <div className="skeleton h-28 rounded-2xl" />
              <div className="skeleton h-40 rounded-2xl" />
            </div>
            <PinModal onUnlocked={() => setUnlocked(true)} />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function PinModal({ onUnlocked }: { onUnlocked: () => void }) {
  const unlock = useServerFn(unlockAdmin);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <form
        className="glass elev rise w-full max-w-[320px] rounded-3xl p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(false);
          try {
            const res = await unlock({ data: { pin } });
            if (res.ok) onUnlocked();
            else setError(true);
          } catch {
            setError(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-faint" aria-hidden />
          <h2 className="text-[15px] font-semibold tracking-tight">Acceso restringido</h2>
        </div>
        <label className={labelCls} htmlFor="pin">
          PIN
        </label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoFocus
          autoComplete="current-password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className={inputCls}
        />
        {error ? <p className="mt-2 text-xs text-destructive">PIN incorrecto.</p> : null}
        <button
          type="submit"
          disabled={busy || pin.length === 0}
          className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}


function AdminPanel({ onLock }: { onLock: () => void }) {
  const loadOptions = useServerFn(getAdminOptions);
  const loadOffers = useServerFn(searchAdminOffers);
  const save = useServerFn(saveStock);
  const lock = useServerFn(lockAdmin);

  const [options, setOptions] = useState<AdminOptions | null>(null);
  const [recent, setRecent] = useState<AdminOffer[]>([]);
  const [offerQuery, setOfferQuery] = useState("");
  const [sellerMode, setSellerMode] = useState<"existing" | "new">("existing");
  const [groupId, setGroupId] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"interno" | "venta_libre">("venta_libre");
  const [phone, setPhone] = useState("");
  const [parentGroup, setParentGroup] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () =>
    loadOffers({ data: { q: offerQuery } })
      .then((r: { offers: AdminOffer[] }) => setRecent(r.offers))
      .catch(() => {});

  useEffect(() => {
    loadOptions().then((o) => {
      setOptions(o);
      const firstCat = o.categories[0]?.id ?? "";
      setRows([emptyRow(firstCat)]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      loadOffers({ data: { q: offerQuery } })
        .then((r: { offers: AdminOffer[] }) => setRecent(r.offers))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerQuery]);


  const servicesByCat = useMemo(() => {
    const map = new Map<string, AdminOptions["services"]>();
    for (const s of options?.services ?? []) {
      const list = map.get(s.categoryId) ?? [];
      list.push(s);
      map.set(s.categoryId, list);
    }
    return map;
  }, [options]);

  if (!options) return <p className="mt-8 text-sm text-muted-foreground">Cargando catálogo…</p>;

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const offers = rows
      .filter((r) => r.serviceId)
      .map((r) => ({
        serviceId: r.serviceId,
        productType: r.productType,
        months: r.months === "" ? null : Number(r.months),
        price: r.price.trim() === "" ? null : Number(r.price.replace(/[^0-9.]/g, "")),
        detail: r.detail.trim() === "" ? null : r.detail.trim(),
      }));
    if (offers.length === 0) {
      setStatus("Agrega al menos una oferta con servicio.");
      return;
    }
    setBusy(true);
    try {
      const seller =
        sellerMode === "existing"
          ? ({ mode: "existing", groupId } as const)
          : ({
              mode: "new",
              name: name.trim(),
              kind,
              phone: kind === "venta_libre" && phone.trim() ? phone.trim() : null,
              parentGroup:
                kind === "venta_libre" && parentGroup.trim() ? parentGroup.trim() : null,
            } as const);
      const res = await save({ data: { seller, offers } });
      setStatus(`Se agregaron ${res.inserted} ofertas.`);
      setRows([emptyRow(options.categories[0]?.id ?? "")]);
      const fresh = await loadOptions();
      setOptions(fresh);
      refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 space-y-10">
      <form onSubmit={submit} className="space-y-8">
        <section className="glass rounded-2xl p-4 sm:p-5">
          <h2 className="text-base font-semibold tracking-tight">Vendedor</h2>
          <div className="mt-4 flex gap-2">
            {(["existing", "new"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSellerMode(m)}
                className={`rounded-full border px-3.5 py-1.5 text-[12px] transition-all active:scale-95 ${
                  sellerMode === m
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {m === "existing" ? "Existente" : "Nuevo"}
              </button>
            ))}
          </div>

          {sellerMode === "existing" ? (
            <div className="mt-4">
              <label className={labelCls} htmlFor="grupo">
                Vendedor o grupo
              </label>
              <select
                id="grupo"
                required
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className={inputCls}
              >
                <option value="">Selecciona…</option>
                {options.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                    {g.parentGroup ? ` — ${g.parentGroup}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <label className={labelCls} htmlFor="nombre">
                  Nombre del vendedor
                </label>
                <input
                  id="nombre"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder="Vendedor A"
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="tipo-vendedor">
                  Tipo
                </label>
                <select
                  id="tipo-vendedor"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as "interno" | "venta_libre")}
                  className={inputCls}
                >
                  <option value="venta_libre">Venta libre</option>
                  <option value="interno">Grupo interno</option>
                </select>
              </div>
              {kind === "venta_libre" ? (
                <>
                  <div>
                    <label className={labelCls} htmlFor="grupo-padre">
                      Grupo de venta libre
                    </label>
                    <input
                      id="grupo-padre"
                      value={parentGroup}
                      onChange={(e) => setParentGroup(e.target.value)}
                      className={inputCls}
                      placeholder="Venta Libre Cherrycita"
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="tel">
                      Teléfono
                    </label>
                    <input
                      id="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputCls}
                      placeholder="55 1234 5678"
                    />
                  </div>
                </>
              ) : null}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Ofertas</h2>
            <button
              type="button"
              onClick={() =>
                setRows((prev) => [
                  ...prev,
                  emptyRow(prev[prev.length - 1]?.categoryId ?? options.categories[0]?.id ?? ""),
                ])
              }
              className="rounded-xl border border-border-strong px-3 py-1.5 text-[12px] transition-all active:scale-95"
            >
              + Fila
            </button>
          </div>

          {rows.map((row, i) => (
            <div key={i} className="glass rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Oferta {i + 1}
                </span>
                {rows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-[11px] text-destructive"
                  >
                    Quitar
                  </button>
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Categoría</label>
                  <select
                    value={row.categoryId}
                    onChange={(e) => setRow(i, { categoryId: e.target.value, serviceId: "" })}
                    className={inputCls}
                  >
                    {options.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Servicio</label>
                  <select
                    value={row.serviceId}
                    onChange={(e) => setRow(i, { serviceId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Selecciona…</option>
                    {(servicesByCat.get(row.categoryId) ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Tipo</label>
                  <select
                    value={row.productType}
                    onChange={(e) => setRow(i, { productType: e.target.value })}
                    className={inputCls}
                  >
                    {Object.entries(PRODUCT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Duración</label>
                  <select
                    value={row.months}
                    onChange={(e) => setRow(i, { months: e.target.value })}
                    className={inputCls}
                  >
                    {DURATIONS.map((d) => (
                      <option key={d.label} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Precio</label>
                  <input
                    inputMode="decimal"
                    value={row.price}
                    onChange={(e) => setRow(i, { price: e.target.value })}
                    className={inputCls}
                    placeholder="45"
                  />
                </div>
                <div>
                  <label className={labelCls}>Detalle</label>
                  <input
                    value={row.detail}
                    onChange={(e) => setRow(i, { detail: e.target.value })}
                    className={inputCls}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>
          ))}
        </section>

        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={busy}
            className="h-12 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar ofertas"}
          </button>
          <button
            type="button"
            onClick={async () => {
              await lock();
              onLock();
            }}
            className="h-12 rounded-xl border border-border px-4 text-sm text-muted-foreground"
          >
            Salir
          </button>
        </div>
      </form>

      <RecentOffers
        offers={recent}
        onChanged={refresh}
        query={offerQuery}
        onQuery={setOfferQuery}
      />
    </div>
  );
}

function RecentOffers({
  offers,
  onChanged,
  query,
  onQuery,
}: {
  offers: AdminOffer[];
  onChanged: () => void;
  query: string;
  onQuery: (v: string) => void;
}) {
  const update = useServerFn(updateOffer);
  const remove = useServerFn(deleteOffer);
  const [editing, setEditing] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);

  return (
    <section>
      <h2 className="border-b border-border pb-3 text-base font-semibold tracking-tight">
        Buscar y editar ofertas
      </h2>
      <div className="relative mt-4">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          aria-hidden
        />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          aria-label="Buscar ofertas"
          placeholder="Busca por servicio, vendedor o número…"
          className={`${inputCls} pl-11 pr-11`}
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {offers.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Sin ofertas para esa búsqueda.</p>
      ) : null}

      <ul className="glass mt-4 overflow-hidden rounded-2xl">
        {offers.map((o) => (
          <li key={o.id} className="border-b border-border px-4 py-3 last:border-b-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium">{o.serviceName}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {o.groupName} · {productLabel(o.productType)} · {durationLabel(o.months)}
                  {o.available ? "" : " · Agotado"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[15px] font-semibold tabular-nums">
                  {formatPrice(o.price)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(editing === o.id ? null : o.id);
                    setPrice(o.price === null ? "" : String(o.price));
                    setAvailable(o.available);
                  }}
                  className="rounded-lg border border-border px-2 py-1 text-[11px]"
                >
                  Editar
                </button>
              </div>
            </div>

            {editing === o.id ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-10 w-28 rounded-xl border border-input bg-surface-2 px-3 text-sm outline-none"
                  placeholder="Precio"
                />
                <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                  />
                  Disponible
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    await update({
                      data: {
                        id: o.id,
                        price: price.trim() === "" ? null : Number(price),
                        months: o.months,
                        detail: o.detail,
                        available,
                      },
                    });
                    setEditing(null);
                    onChanged();
                  }}
                  className="h-10 rounded-xl bg-primary px-3 text-[12px] font-semibold text-primary-foreground"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await remove({ data: { id: o.id } });
                    setEditing(null);
                    onChanged();
                  }}
                  className="h-10 rounded-xl border border-destructive px-3 text-[12px] text-destructive"
                >
                  Eliminar
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
