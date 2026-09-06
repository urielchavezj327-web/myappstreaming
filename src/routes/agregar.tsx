import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Lock, LogOut, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { OfferGroups, SellerOffers } from "@/components/offer-list";
import { Wordmark } from "@/components/wordmark";
import { brandSkin, resolveBrand } from "@/lib/brands";
import {
  createService,
  deleteOffer,
  getAdminOptions,
  getAdminState,
  lockAdmin,
  saveStock,
  searchAdminOffers,
  unlockAdmin,
  updateOffer,
  type AdminOptions,
} from "@/lib/admin.functions";
import type { SearchSellerResult, SearchServiceResult, StockOffer } from "@/lib/catalog.functions";
import { PRODUCT_LABELS } from "@/lib/format";

export const Route = createFileRoute("/agregar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel privado — Stock Index" },
      {
        name: "description",
        content:
          "Formulario privado para registrar vendedores y cargar sus ofertas de stock en el comparador.",
      },
      { property: "og:title", content: "Panel privado — Stock Index" },
      { property: "og:description", content: "Panel privado de captura de stock." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AddStockPage,
});

// La base tiene ofertas de 4, 5, 9, 18 y 36 meses que antes no se podían
// capturar porque no estaban en esta lista.
const DURATIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Único" },
  { value: "0", label: "Permanente" },
  { value: "1", label: "1 mes" },
  { value: "2", label: "2 meses" },
  { value: "3", label: "3 meses" },
  { value: "4", label: "4 meses" },
  { value: "5", label: "5 meses" },
  { value: "6", label: "6 meses" },
  { value: "9", label: "9 meses" },
  { value: "12", label: "Anual" },
  { value: "18", label: "18 meses" },
  { value: "24", label: "2 años" },
  { value: "36", label: "3 años" },
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
  "h-12 w-full rounded-xl border border-input bg-surface px-3 text-[16px] outline-none transition-colors focus:border-border-strong";
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
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Captura los datos del vendedor una sola vez y agrega todas sus ofertas en la misma carga.
        </p>
        {unlocked === null ? (
          <div className="mt-8 space-y-3" aria-hidden>
            <div className="skeleton h-28 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
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
    <div className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <form
        className="frost pop-in w-full max-w-[340px] rounded-3xl p-6"
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
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2">
            <Lock className="h-4 w-4 text-faint" aria-hidden />
          </span>
          <h2 className="text-[16px] font-semibold tracking-tight">Acceso restringido</h2>
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
          className="mt-4 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
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
  const [results, setResults] = useState<{
    services: SearchServiceResult[];
    sellers: SearchSellerResult[];
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [offerQuery, setOfferQuery] = useState("");
  const [offerCat, setOfferCat] = useState("");
  const [sellerMode, setSellerMode] = useState<"existing" | "new">("existing");
  const [groupId, setGroupId] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"interno" | "venta_libre">("venta_libre");
  const [phone, setPhone] = useState("");
  const [parentGroup, setParentGroup] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const active = offerQuery.trim().length > 1;

  const refresh = useCallback(() => {
    if (!active) {
      setResults(null);
      return;
    }
    setSearching(true);
    loadOffers({ data: { q: offerQuery, cat: offerCat } })
      .then(setResults)
      .catch(() => setResults({ services: [], sellers: [] }))
      .finally(() => setSearching(false));
  }, [active, loadOffers, offerQuery, offerCat]);

  useEffect(() => {
    loadOptions().then((o) => {
      setOptions(o);
      setRows([emptyRow(o.categories[0]?.id ?? "")]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setTimeout(refresh, 300);
    return () => clearTimeout(id);
  }, [refresh]);

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

  const onServiceCreated = (
    service: { id: string; name: string; categoryId: string },
    i: number,
  ) => {
    setOptions((prev) => (prev ? { ...prev, services: [...prev.services, service] } : prev));
    setRow(i, { serviceId: service.id });
  };

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
      setStatus({ tone: "error", text: "Agrega al menos una oferta con servicio." });
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
              parentGroup: kind === "venta_libre" && parentGroup.trim() ? parentGroup.trim() : null,
            } as const);
      const res = await save({ data: { seller, offers } });
      setStatus({
        tone: "ok",
        text: `Se agregaron ${res.inserted} oferta${res.inserted === 1 ? "" : "s"}.`,
      });
      setRows([emptyRow(options.categories[0]?.id ?? "")]);
      setOptions(await loadOptions());
      refresh();
    } catch (err) {
      setStatus({
        tone: "error",
        text: err instanceof Error ? err.message : "No se pudo guardar.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 space-y-12">
      <form onSubmit={submit} className="space-y-8">
        <section className="glass rounded-2xl p-4 sm:p-5">
          <h2 className="t-title">Vendedor</h2>
          <div className="mt-4 flex gap-2">
            {(["existing", "new"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSellerMode(m)}
                aria-pressed={sellerMode === m}
                className={`rounded-full border px-4 py-2 text-[13px] transition-all active:scale-95 ${
                  sellerMode === m
                    ? "border-transparent bg-primary font-semibold text-primary-foreground"
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
                      list="grupos-padre"
                      value={parentGroup}
                      onChange={(e) => setParentGroup(e.target.value)}
                      className={inputCls}
                      placeholder="C/V Libre Gaeta¹"
                    />
                    {/* Sugerir los grupos que ya existen evita crear duplicados
                        por una tilde o un espacio de más. */}
                    <datalist id="grupos-padre">
                      {[...new Set(options.groups.map((g) => g.parentGroup).filter(Boolean))].map(
                        (p) => (
                          <option key={p as string} value={p as string} />
                        ),
                      )}
                    </datalist>
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
            <h2 className="t-title">Ofertas</h2>
            <button
              type="button"
              onClick={() =>
                setRows((prev) => [
                  ...prev,
                  emptyRow(prev[prev.length - 1]?.categoryId ?? options.categories[0]?.id ?? ""),
                ])
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-strong px-3.5 py-2 text-[13px] transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> Fila
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
                    className="text-[12px] text-destructive"
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
                  <NewServiceBox
                    options={options}
                    categoryId={row.categoryId}
                    onCreated={(svc) => onServiceCreated(svc, i)}
                  />
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
                    placeholder="Vacío = A consultar"
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

        {status ? (
          <p
            className={`rounded-xl px-3.5 py-2.5 text-sm ${
              status.tone === "ok"
                ? "bg-success/12 text-success"
                : "bg-destructive/12 text-destructive"
            }`}
            role="status"
          >
            {status.text}
          </p>
        ) : null}

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
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </form>

      <AdminSearch
        query={offerQuery}
        onQuery={setOfferQuery}
        categories={options.categories}
        cat={offerCat}
        onCat={setOfferCat}
        results={results}
        loading={searching}
        active={active}
        onChanged={refresh}
      />
    </div>
  );
}

/**
 * Alta de servicio nuevo. Va fuera del desplegable de Servicio, como una acción
 * aparte, para no amontonarla con Categoría / Tipo / Duración / Precio.
 */
function NewServiceBox({
  options,
  categoryId,
  onCreated,
}: {
  options: AdminOptions;
  categoryId: string;
  onCreated: (svc: { id: string; name: string; categoryId: string }) => void;
}) {
  const create = useServerFn(createService);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = options.categories.find((c) => c.id === categoryId);
  const subs = options.subcategories.filter((s) => s.categoryId === categoryId);

  const preview = useMemo(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return null;
    const brand = resolveBrand({
      name: trimmed,
      categorySlug: category?.slug ?? null,
      subcategorySlug: subs.find((s) => s.id === subcategoryId)?.slug ?? null,
    });
    return { brand, skin: brandSkin(brand) };
  }, [value, category?.slug, subcategoryId, subs]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Crear servicio nuevo
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-dashed border-border-strong bg-surface-2/40 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Servicio nuevo en {category?.name ?? "—"}
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          aria-label="Cancelar"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <input
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        placeholder="Nombre del servicio (ej. Claude)"
        className={`${inputCls} mt-2.5`}
      />

      {subs.length > 0 ? (
        <select
          value={subcategoryId}
          onChange={(e) => setSubcategoryId(e.target.value)}
          className={`${inputCls} mt-2.5`}
        >
          <option value="">Sin subcategoría</option>
          {subs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      ) : null}

      {preview ? (
        <div
          className="mt-3 flex h-24 items-center justify-center rounded-2xl border"
          style={
            {
              background: preview.skin.background,
              borderColor: preview.skin.border,
              "--wordmark-ink": preview.skin.ink,
              "--wordmark-shadow": preview.skin.inkShadow,
            } as React.CSSProperties
          }
        >
          <Wordmark name={value.trim()} brand={preview.brand} size="row" />
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      <button
        type="button"
        disabled={busy || value.trim().length < 2}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const svc = await create({
              data: {
                name: value.trim(),
                categoryId,
                subcategoryId: subcategoryId || null,
              },
            });
            onCreated(svc);
            setValue("");
            setSubcategoryId("");
            setOpen(false);
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear.");
          } finally {
            setBusy(false);
          }
        }}
        className="mt-3 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? "Creando…" : "Crear y seleccionar"}
      </button>
    </div>
  );
}

/**
 * Buscador del panel. Presenta los resultados igual que la portada — grupo
 * padre, vendedor, teléfono, total y ofertas agrupadas — y añade la edición en
 * línea de cada oferta.
 */
function AdminSearch({
  query,
  onQuery,
  categories,
  cat,
  onCat,
  results,
  loading,
  active,
  onChanged,
}: {
  query: string;
  onQuery: (v: string) => void;
  categories: AdminOptions["categories"];
  cat: string;
  onCat: (v: string) => void;
  results: { services: SearchServiceResult[]; sellers: SearchSellerResult[] } | null;
  loading: boolean;
  active: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  const action = useCallback(
    (offer: StockOffer) =>
      editing === offer.id ? (
        <OfferEditor
          offer={offer}
          onDone={() => {
            setEditing(null);
            onChanged();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(offer.id)}
          className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Editar
        </button>
      ),
    [editing, onChanged],
  );

  const services = results?.services ?? [];
  const sellers = results?.sellers ?? [];
  const empty = active && !loading && services.length === 0 && sellers.length === 0;

  return (
    <section>
      <h2 className="border-b border-border pb-3 t-title">Buscar y editar ofertas</h2>

      <div className="relative mt-5">
        <Search
          className={`pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 ${
            loading ? "animate-pulse text-foreground" : "text-muted-foreground"
          }`}
          aria-hidden
        />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          type="search"
          aria-label="Buscar ofertas"
          placeholder="Busca por servicio, vendedor o número…"
          className="glass h-14 w-full rounded-2xl pl-14 pr-12 text-[16px] outline-none transition-all placeholder:text-faint focus:border-border-strong [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Las pastillas solo aparecen cuando ya hay búsqueda, igual que en la portada. */}
      {active ? (
        <div className="no-scrollbar -mx-4 mt-3.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max min-w-full flex-nowrap gap-2">
            {[{ id: "", slug: "", name: "Todas" }, ...categories].map((c) => {
              const isActive = cat === c.slug;
              return (
                <button
                  key={c.slug || "todas"}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onCat(isActive && c.slug ? "" : c.slug)}
                  className={`shrink-0 whitespace-nowrap rounded-2xl border px-4 py-2.5 text-[14px] transition-colors ${
                    isActive
                      ? "border-transparent bg-primary font-semibold text-primary-foreground"
                      : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {!active ? (
        <p className="mt-5 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-faint">
          Escribe para buscar una oferta, un vendedor o un teléfono.
        </p>
      ) : loading && !results ? (
        <div className="mt-5 space-y-3" aria-hidden>
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
        </div>
      ) : empty ? (
        <p className="mt-5 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-faint">
          Sin ofertas para “{query}”.
        </p>
      ) : (
        <div className="mt-7 space-y-12">
          {services.map((s) => (
            <section key={s.slug}>
              <div className="border-b border-border pb-3">
                <p className="t-label text-faint">{s.categoryName}</p>
                <h3 className="mt-1 t-section">{s.name}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {s.offers.length} oferta{s.offers.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="mt-5">
                <OfferGroups
                  offers={s.offers}
                  accent={
                    brandSkin(
                      resolveBrand({
                        name: s.name,
                        categorySlug: s.categorySlug ?? null,
                        subcategorySlug: s.subcategorySlug ?? null,
                        color: s.color,
                      }),
                    ).accent
                  }
                  showService={false}
                  action={action}
                />
              </div>
            </section>
          ))}

          {sellers.map((v) => (
            <section key={v.slug}>
              <div className="border-b border-border pb-3">
                {v.parentGroup ? <p className="t-label text-faint">{v.parentGroup}</p> : null}
                <h3 className="mt-1 t-section">{v.name}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {v.kind === "venta_libre" ? (v.phone ?? "Sin número publicado") : "Grupo interno"}{" "}
                  · {v.offers.length} oferta{v.offers.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="mt-5">
                <SellerOffers
                  offers={v.offers}
                  freeMarket={v.kind === "venta_libre"}
                  action={action}
                />
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function OfferEditor({
  offer,
  onDone,
  onCancel,
}: {
  offer: StockOffer;
  onDone: () => void;
  onCancel: () => void;
}) {
  const update = useServerFn(updateOffer);
  const remove = useServerFn(deleteOffer);
  const [price, setPrice] = useState(offer.price === null ? "" : String(offer.price));
  const [months, setMonths] = useState(offer.months === null ? "" : String(offer.months));
  const [detail, setDetail] = useState(offer.detail ?? "");
  const [available, setAvailable] = useState(offer.available);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-1 rounded-2xl border border-border-strong bg-surface-2/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-11 w-28 rounded-xl border border-input bg-surface px-3 text-[16px] outline-none"
          placeholder="Precio"
          aria-label="Precio"
        />
        <select
          value={months}
          onChange={(e) => setMonths(e.target.value)}
          className="h-11 w-32 rounded-xl border border-input bg-surface px-2 text-[15px] outline-none"
          aria-label="Duración"
        >
          {DURATIONS.map((d) => (
            <option key={d.label} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <input
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={200}
          className="h-11 min-w-[11rem] flex-1 rounded-xl border border-input bg-surface px-3 text-[16px] outline-none"
          placeholder="Detalle (garantía, restricciones…)"
          aria-label="Detalle"
        />
        <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          Disponible
        </label>
      </div>

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await update({
                data: {
                  id: offer.id,
                  price: price.trim() === "" ? null : Number(price),
                  months: months === "" ? null : Number(months),
                  detail: detail.trim() === "" ? null : detail.trim(),
                  available,
                },
              });
              onDone();
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo guardar.");
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-xl border border-border px-3.5 text-[13px] text-muted-foreground"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await remove({ data: { id: offer.id } });
              onDone();
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo eliminar.");
              setBusy(false);
            }
          }}
          className="ml-auto inline-flex h-11 items-center gap-1.5 rounded-xl border border-destructive px-3.5 text-[13px] text-destructive disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" /> Eliminar
        </button>
      </div>
    </div>
  );
}
