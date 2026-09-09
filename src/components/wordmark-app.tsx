/**
 * Logotipo de la aplicación.
 *
 * "Stockdex" — de *stock* e *índice*. Una sola palabra con el peso partido en
 * dos: el bloque sólido nombra la materia y el trazo fino la convierte en un
 * índice. El punto de plata sobre la «i» invisible es lo que la ata al resto
 * del sistema.
 */
export function AppWordmark({ size = "hero" }: { size?: "hero" | "bar" }) {
  if (size === "bar") {
    return (
      <span className="flex items-baseline leading-none">
        <span className="font-display text-[21px] font-extrabold tracking-[-0.055em] text-foreground">
          Stock
        </span>
        <span className="font-display text-[21px] font-extralight tracking-[-0.02em] text-muted-foreground">
          dex
        </span>
        <span
          className="ml-1 h-[6px] w-[6px] self-end rounded-full bg-brand"
          style={{ marginBottom: "3px", boxShadow: "0 0 12px var(--brand-glow)" }}
          aria-hidden
        />
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="flex items-baseline justify-center leading-[0.88]">
        <span className="font-display text-[clamp(3.4rem,17vw,5.6rem)] font-extrabold tracking-[-0.06em] text-foreground">
          Stock
        </span>
        <span className="font-display text-[clamp(3.4rem,17vw,5.6rem)] font-extralight tracking-[-0.03em] text-muted-foreground">
          dex
        </span>
      </h1>

      {/* La barra de acento: la firma del producto, no un separador. */}
      <span
        className="mt-4 h-[3px] w-[clamp(4.5rem,20vw,7rem)] rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, var(--brand), transparent)",
          boxShadow: "0 0 24px var(--brand-glow)",
        }}
        aria-hidden
      />

      <p className="mt-5 max-w-[19rem] text-balance text-[17px] leading-snug text-muted-foreground sm:max-w-none sm:text-[19px]">
        Compara y encuentra tu mejor precio
      </p>
    </div>
  );
}
