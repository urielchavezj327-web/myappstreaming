import { useCallback, useEffect, useState } from "react";

/**
 * Vendedores favoritos.
 *
 * Viven en el propio dispositivo, no en la base: son una preferencia de quien
 * mira, no un dato del catálogo, y así funcionan sin tocar Supabase ni exigir
 * cuenta. Se guardan por `slug`, que es estable aunque se renombre el vendedor.
 */

const KEY = "stockdex:favoritos";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* sin almacenamiento: la preferencia dura lo que la sesión */
  }
}

/** Aviso a todas las listas abiertas cuando cambia un favorito. */
const EVENT = "stockdex:favoritos-cambio";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(read());
    const sync = () => setFavorites(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    const next = read();
    const at = next.indexOf(slug);
    if (at === -1) next.push(slug);
    else next.splice(at, 1);
    write(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  return { favorites, toggle, isFavorite };
}
