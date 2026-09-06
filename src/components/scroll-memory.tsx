import { useLocation } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

/**
 * Memoria de scroll por entrada del historial.
 *
 * Al volver de la ficha de un vendedor o de un servicio la página aparecía
 * desde arriba. Tres cosas hay que resolver a la vez, y por eso no basta con
 * un `scrollTo` al montar:
 *
 *  1. El router hace su propio salto al inicio unos milisegundos DESPUÉS de
 *     que la vista se monta, así que la posición hay que sostenerla durante
 *     una ventana corta, no aplicarla una sola vez.
 *  2. Mientras se restaura, esos saltos disparan eventos de scroll que se
 *     guardaban encima de la posición buena. Una guarda los ignora.
 *  3. Si el documento todavía no alcanzó su altura final, el navegador recorta
 *     la posición; se reintenta hasta que la altura da.
 */

const PREFIX = "stock-index:scroll:";
/** Duración de la ventana en la que se sostiene la posición restaurada. */
const RESTORE_MS = 900;

/** Copia en memoria: sobrevive a la navegación del cliente sin tocar disco. */
const positions = new Map<string, number>();

type LocationState = { key?: string; __TSR_key?: string };

function entryKey(href: string, state: unknown): string {
  const s = (state ?? {}) as LocationState;
  return s.key ?? s.__TSR_key ?? href;
}

function readStored(key: string): number | null {
  const cached = positions.get(key);
  if (cached !== undefined) return cached;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    // Modo privado o almacenamiento bloqueado: se pierde la memoria de scroll,
    // pero la navegación sigue funcionando igual.
    return null;
  }
}

function store(key: string, value: number) {
  positions.set(key, value);
  try {
    sessionStorage.setItem(PREFIX + key, String(value));
  } catch {
    /* sin persistencia disponible */
  }
}

export function ScrollMemory() {
  const location = useLocation();
  const key = entryKey(location.href, location.state);

  // Se lee en fase de render, en cuanto cambia la entrada del historial, para
  // que ningún evento de scroll posterior pueda pisar el valor guardado.
  const target = useMemo(() => readStored(key) ?? 0, [key]);

  const keyRef = useRef(key);
  keyRef.current = key;
  const restoringUntil = useRef(0);

  // Guardar la posición de la entrada actual mientras se hace scroll.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    let frame = 0;
    const onScroll = () => {
      if (Date.now() < restoringUntil.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (Date.now() < restoringUntil.current) return;
        store(keyRef.current, Math.round(window.scrollY));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Restaurar al entrar en una entrada del historial.
  useLayoutEffect(() => {
    if (typeof window === "undefined" || target <= 0) return;

    const until = Date.now() + RESTORE_MS;
    restoringUntil.current = until;

    let raf = 0;
    const hold = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      const wanted = Math.min(target, max);
      if (Math.abs(window.scrollY - wanted) > 2) window.scrollTo(0, wanted);
      if (Date.now() < until) raf = requestAnimationFrame(hold);
      else restoringUntil.current = 0;
    };
    hold();

    return () => {
      cancelAnimationFrame(raf);
      restoringUntil.current = 0;
    };
  }, [key, target]);

  return null;
}
