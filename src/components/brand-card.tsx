import { Link } from "@tanstack/react-router";
import { memo } from "react";

import { brandSkin, resolveBrand, type BrandInput } from "@/lib/brands";
import { Wordmark, type WordmarkSize } from "@/components/wordmark";

/**
 * Tarjeta de servicio del catálogo. El logotipo va centrado y dimensionado
 * para llenar la tarjeta (ver `Wordmark`), sobre el degradado con los colores
 * reales de la marca.
 *
 * `tile` es el mosaico de dos columnas; `row` es la fila ancha que usan los
 * trámites, cuyos nombres son demasiado largos para el mosaico.
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
          "--wordmark-ink": skin.ink,
          "--wordmark-shadow": skin.inkShadow,
        } as React.CSSProperties
      }
      className={`wordmark-box group relative flex flex-col items-center justify-center overflow-hidden border text-center shadow-[0_20px_44px_-28px_rgba(0,0,0,0.95)] transition-transform duration-200 active:scale-[0.985] sm:hover:-translate-y-0.5 ${
        variant === "tile"
          ? "cv-tile aspect-[1/0.82] rounded-[1.6rem] p-4"
          : "rounded-2xl px-5 py-5"
      }`}
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{ background: skin.glow }}
        aria-hidden
      />
      {skin.sheen ? (
        <span
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: skin.sheen }}
          aria-hidden
        />
      ) : null}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${skin.accent}, transparent)` }}
        aria-hidden
      />

      <span className="relative flex flex-1 items-center justify-center px-1">
        <Wordmark name={name} brand={brand} size={size} />
      </span>
      <span
        className="relative mt-2.5 text-[12.5px] font-medium tabular-nums tracking-wide"
        style={{ color: skin.ink, opacity: 0.78 }}
      >
        {offers} oferta{offers === 1 ? "" : "s"}
      </span>
    </Link>
  );
});
