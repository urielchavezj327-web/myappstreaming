import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Preferencias de quien mira la página. Se guardan en el propio dispositivo y
 * se aplican como atributos en `<html>`, así que el CSS hace todo el trabajo y
 * no hay que re-renderizar el catálogo para cambiarlas.
 */

export type ViewSettings = {
  /** Cuerpo de texto general. */
  text: "normal" | "grande";
  /** Aire entre elementos. */
  density: "comoda" | "compacta";
  /** Fuerza del color de marca en las tarjetas. */
  color: "vivo" | "suave";
};

const DEFAULTS: ViewSettings = { text: "normal", density: "comoda", color: "vivo" };
const KEY = "stockdex:view";

export function readViewSettings(): ViewSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ViewSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function applyViewSettings(s: ViewSettings) {
  const el = document.documentElement;
  el.dataset["text"] = s.text;
  el.dataset["density"] = s.density;
  el.dataset["color"] = s.color;
}

/** Script en línea que aplica las preferencias antes del primer pintado. */
export const VIEW_SETTINGS_BOOTSTRAP = `try{var s=JSON.parse(localStorage.getItem('${KEY}')||'{}');var d=document.documentElement;d.dataset.text=s.text||'normal';d.dataset.density=s.density||'comoda';d.dataset.color=s.color||'vivo';}catch(e){}`;

const OPTIONS: Array<{
  key: keyof ViewSettings;
  label: string;
  hint: string;
  choices: Array<{ value: string; label: string }>;
}> = [
  {
    key: "text",
    label: "Tamaño de texto",
    hint: "Sube el cuerpo de toda la app sin romper la composición.",
    choices: [
      { value: "normal", label: "Normal" },
      { value: "grande", label: "Grande" },
    ],
  },
  {
    key: "density",
    label: "Densidad",
    hint: "Compacta muestra más servicios por pantalla.",
    choices: [
      { value: "comoda", label: "Cómoda" },
      { value: "compacta", label: "Compacta" },
    ],
  },
  {
    key: "color",
    label: "Color de marca",
    hint: "Suave apaga los degradados de las tarjetas.",
    choices: [
      { value: "vivo", label: "Vivo" },
      { value: "suave", label: "Suave" },
    ],
  },
];

export function ViewSettingsSheet({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<ViewSettings>(DEFAULTS);

  useEffect(() => {
    setSettings(readViewSettings());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = (key: keyof ViewSettings, value: string) => {
    const next = { ...settings, [key]: value } as ViewSettings;
    setSettings(next);
    applyViewSettings(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* sin almacenamiento: la preferencia dura lo que la sesión */
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
        aria-label="Preferencias de vista"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="t-title">Preferencias</h2>
            <p className="mt-1 t-meta text-faint">Se guardan solo en este dispositivo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {OPTIONS.map((option) => (
            <div key={option.key}>
              <p className="text-[15px] font-semibold tracking-tight">{option.label}</p>
              <p className="mt-0.5 t-meta text-faint">{option.hint}</p>
              <div className="mt-3 flex gap-2">
                {option.choices.map((choice) => {
                  const active = settings[option.key] === choice.value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update(option.key, choice.value)}
                      className={`h-12 flex-1 rounded-xl border text-[15px] transition-all active:scale-[0.98] ${
                        active
                          ? "border-brand/45 bg-brand/15 font-bold text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14)]"
                          : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                      }`}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
