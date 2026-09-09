import { Link } from "@tanstack/react-router";
import { memo } from "react";

import { brandSkin, resolveBrand, type BrandInput } from "@/lib/brands";
import { Wordmark, type WordmarkSize } from "@/components/wordmark";

/**
 * Tarjeta de servicio del catálogo.
 *
 * La tarjeta *es* el logotipo: fondo, tinta y símbolo salen del logotipo real
 * de la marca (ver `brands.ts`). Encima van las dos capas que le dan cuerpo de
 * vidrio — el filo de luz superior y la sombra en capas — que son las mismas
 * de toda la app, así que una ficha de Netflix y un panel de ajustes se
 * reconocen como piezas del mismo sistema aunque no compartan color.
 *
 * `tile` es el mosaico de dos columnas; `row` es la fila ancha de los trámites,
 * cuyos nombres no caben en el mosaico.
 */
export const BrandCard = memo(function BrandCard({
  to,
  brandInput,
  name,
  offers,
  variant,
}: {
  to: string;
  brandInput: BrandInput;
  name: string;
  offers: number;
  variant: "tile" | "row";
}) {
  const brand = resolveBrand(brandInput);
  const skin = brandSkin(brand);
  const size: WordmarkSize = variant === "tile" ? "tile" : "row";

  return (
    <Link
      to="/servicio/$slug"
      params={{ slug: to }}
      aria-label={`${name}, ${offers} ofertas`}
      style={
        {
          background: skin.background,
          borderColor: skin.border,
          boxShadow: skin.relief,
          "--wordmark-ink": skin.ink,
          "--wordmark-shadow": skin.inkShadow,
          "--edge": skin.edge,
        } as React.CSSProperties
      }
      className={`wordmark-box lightedge tappable group relative isolate flex overflow-hidden border ${brand.paper ? "paper" : ""} transition-shadow sm:hover:-translate-y-0.5 ${
        variant === "tile"
          ? "cv-tile aspect-[1/0.86] flex-col items-center justify-center rounded-[1.65rem] px-2 pb-3 pt-4"
          : "flex-row items-center gap-3 rounded-[1.15rem] px-4 py-3.5"
      }`}
    >
      <span
        className={`relative flex min-w-0 items-center ${
          variant === "tile" ? "flex-1 justify-center self-stretch" : "flex-1"
        }`}
      >
        <Wordmark name={name} brand={brand} size={size} />
      </span>

      <span
        className={
          variant === "tile"
            ? "relative mt-2 text-[11.5px] font-semibold tabular-nums tracking-[0.08em]"
            : "relative shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold tabular-nums"
        }
        style={
          variant === "tile"
            ? { color: skin.meta }
            : { color: skin.meta, background: "rgba(255,255,255,0.07)" }
        }
      >
        {offers}
        <span className="ml-1 font-medium opacity-80">oferta{offers === 1 ? "" : "s"}</span>
      </span>
    </Link>
  );
});
