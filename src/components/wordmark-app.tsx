/**
 * Logotipo de la aplicación.
 *
 * "Stockdex" — de *stock* e *index*. Una sola palabra, con el peso partido en
 * dos: el bloque sólido nombra la materia y el trazo fino la convierte en un
 * índice. Debajo, una regla en degradado que lo asienta como marca y no como
 * un simple encabezado.
 */
export function AppWordmark({ size = "hero" }: { size?: "hero" | "bar" }) {
  if (size === "bar") {
    return (
      <span className="flex items-baseline leading-none">
        <span className="font-display text-[21px] font-extrabold tracking-[-0.05em] text-foreground">
          Stock
        </span>
        <span className="font-display text-[21px] font-extralight tracking-[-0.02em] text-muted-foreground">
          dex
        </span>
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="flex items-baseline justify-center leading-[0.92]">
        <span className="font-display text-[clamp(3.1rem,15vw,5.2rem)] font-extrabold tracking-[-0.055em] text-foreground">
          Stock
        </span>
        <span className="font-display text-[clamp(3.1rem,15vw,5.2rem)] font-extralight tracking-[-0.025em] text-muted-foreground">
          dex
        </span>
      </h1>
      <span
        className="mt-3 h-px w-[clamp(9rem,42vw,15rem)] rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-border-strong) 25%, var(--color-foreground) 50%, var(--color-border-strong) 75%, transparent)",
          opacity: 0.55,
        }}
        aria-hidden
      />
      <p className="mt-3 text-[13.5px] uppercase tracking-[0.28em] text-faint">Índice de precios</p>
    </div>
  );
}
