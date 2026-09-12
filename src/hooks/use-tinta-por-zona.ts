import { useEffect, type RefObject } from "react";

/**
 * Tinta de página: blanca, oscura, o una de cada según la altura de pantalla.
 *
 * El corte va en % del alto de la CAPA DE FONDO, no de la página.
 */
export type TintaPagina =
  "blanca" | "oscura" | { arriba: "blanca" | "oscura"; abajo: "blanca" | "oscura"; corte: number };

export const TINTA = { blanca: "#FFFFFF", oscura: "#111111" } as const;

/**
 * Cambia la tinta de las letras que van directo sobre el fondo, según dónde
 * estén EN LA PANTALLA.
 *
 * El fondo está fijo a la pantalla, así que lo que una letra tiene detrás
 * depende de dónde esté en ese momento y no de dónde esté en la página. En
 * F1 TV un encabezado a media pantalla tiene blanco detrás y pide letra oscura;
 * ese mismo encabezado, scrolleado hasta abajo, tiene el rojo detrás y pide
 * letra blanca. Decidirla una sola vez para toda la página es justo lo que
 * dejaba «Mis Grupos» de Disney+ en Lc 18.
 *
 * Solo corre en las fichas de dos zonas. Las de una sola tinta se resuelven con
 * una variable CSS en la raíz y no necesitan JavaScript.
 */
export function useTintaPorZona(
  raiz: RefObject<HTMLElement | null>,
  capaFondo: RefObject<HTMLElement | null>,
  tinta: TintaPagina,
) {
  useEffect(() => {
    if (typeof tinta === "string" || !raiz.current || !capaFondo.current) return;
    const { corte } = tinta;
    const el = raiz.current;
    const capa = capaFondo.current;
    let frame = 0;

    const medir = () => {
      frame = 0;
      /*
        Se mide contra el rectángulo de la capa de fondo, no contra
        `window.innerHeight`: en Chrome de Android la barra de direcciones se
        esconde y aparece, `innerHeight` cambia, y la línea de corte se
        desfasaría del punto donde de verdad cambia el color.
      */
      const caja = capa.getBoundingClientRect();
      const linea = caja.top + caja.height * (corte / 100);
      const els = [...el.querySelectorAll<HTMLElement>("[data-tinta-pagina]")];
      // Primero LEER todas las posiciones…
      const zonas = els.map((e) => {
        const r = e.getBoundingClientRect();
        // Por el CENTRO: un rótulo que va cruzando el corte cambia de tinta
        // cuando ya pasó la mitad, así que nunca queda la mayor parte de la
        // letra sobre el color equivocado.
        return (r.top + r.bottom) / 2 < linea ? "arriba" : "abajo";
      });
      // …y luego ESCRIBIR, y solo lo que cambió. Alternar lectura y escritura
      // obliga al navegador a recalcular el diseño en cada lectura y traba el
      // scroll.
      els.forEach((e, i) => {
        if (e.dataset["zona"] !== zonas[i]) e.dataset["zona"] = zonas[i];
      });
    };

    // Como mucho una medición por cuadro, aunque el scroll dispare diez veces.
    const pedir = () => {
      if (!frame) frame = requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    // Cuando cargan o se filtran las ofertas, los elementos se mueven sin que
    // haya scroll. Sin esto se quedarían con la tinta vieja.
    const ro = new ResizeObserver(pedir);
    ro.observe(el);
    return () => {
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [raiz, capaFondo, tinta]);
}
