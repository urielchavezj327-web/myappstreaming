/**
 * Símbolos de marca.
 *
 * Cada ficha lleva el icono real de su marca recreado en vector encima del
 * nombre, como hace Peacock. Nada de imágenes: son trazos, así que heredan el
 * color de la tinta del logotipo, escalan sin pesar y no piden red.
 *
 * Todos se dibujan sobre un lienzo de 100×100 y en `currentColor`, salvo los
 * que en el logotipo original son multicolor (Peacock, Google, Microsoft), que
 * llevan sus colores fijos porque ahí el color *es* la marca.
 */

export type SymbolId =
  | "netflix"
  | "paramount"
  | "peacock"
  | "apple"
  | "primeSmile"
  | "crunchyroll"
  | "plex"
  | "f1"
  | "mlb"
  | "universal"
  | "claroSwoosh"
  | "iptv"
  | "spotify"
  | "appleMusic"
  | "youtubePlay"
  | "amazonMusicNote"
  | "deezerBars"
  | "qobuz"
  | "adobeA"
  | "canvaC"
  | "capcut"
  | "openai"
  | "geminiSpark"
  | "microsoft"
  | "googleDrive"
  | "onedrive"
  | "duolingoOwl"
  | "scribd"
  | "picsart"
  | "discord"
  | "flame"
  | "shield"
  | "sharkFin"
  | "umbrella"
  | "pin"
  | "playCircle"
  | "infinity"
  | "dumbbell"
  | "bag"
  | "card"
  | "phone"
  | "cutlery"
  | "plane"
  | "carShield"
  | "gamepad"
  | "book"
  | "bot"
  | "users"
  | "hash"
  | "key"
  | "grid"
  | "ticket"
  | "train"
  | "coins"
  | "seal"
  | "receipt"
  | "medicalCross"
  | "idCard"
  | "gradCap"
  | "fingerprint"
  | "car"
  | "house"
  | "calendar";

/** Trazo estándar: grueso suficiente para leerse a 28 px en celular. */
const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
const F = { fill: "currentColor" } as const;

const SHAPES: Record<SymbolId, React.ReactNode> = {
  // ── Streaming ──────────────────────────────────────────────────────────
  /** La N de Netflix: dos columnas y la diagonal que las une. */
  netflix: (
    <>
      <path d="M22 6h17l39 88H61z" {...F} opacity={0.55} />
      <rect x="22" y="6" width="17" height="88" {...F} />
      <rect x="61" y="6" width="17" height="88" {...F} />
    </>
  ),
  /** Montaña de Paramount con su arco de estrellas. */
  paramount: (
    <>
      <path
        d="M50 12 L84 84 H16 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <path d="M50 12 L67 48 Q50 40 33 48 Z" {...F} opacity={0.9} />
      {[
        [50, 4],
        [33.5, 7.2],
        [18.8, 15.4],
        [66.5, 7.2],
        [81.2, 15.4],
        [26, 10.4],
        [74, 10.4],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={2.6} {...F} />
      ))}
    </>
  ),
  /** Abanico de seis plumas del pavo real de NBC. */
  peacock: (
    <>
      {[
        ["#FBB711", -75],
        ["#F37021", -45],
        ["#CC004C", -15],
        ["#6460AA", 15],
        ["#0089D0", 45],
        ["#0DB14B", 75],
      ].map(([color, angle], i) => (
        <path
          key={i}
          d="M50 86 C 40 66, 40 40, 50 16 C 60 40, 60 66, 50 86 Z"
          fill={color as string}
          transform={`rotate(${angle} 50 88)`}
        />
      ))}
    </>
  ),
  /** Manzana de Apple. */
  apple: (
    <>
      <path
        d="M72 55c0-11 8-16 8.5-16.4C75.7 31.5 68 30.6 65.3 30.4c-6-.6-11.7 3.5-14.7 3.5-3 0-7.7-3.4-12.7-3.3-6.5.1-12.5 3.8-15.9 9.6-6.8 11.8-1.7 29.2 4.9 38.8 3.2 4.7 7 10 12 9.8 4.8-.2 6.6-3.1 12.4-3.1s7.4 3.1 12.5 3c5.2-.1 8.4-4.8 11.6-9.5 3.6-5.4 5.1-10.7 5.2-11-.1-.1-10-3.8-10.1-15.2z"
        {...F}
      />
      <path
        d="M62.6 24c2.6-3.2 4.4-7.6 3.9-12-3.8.2-8.4 2.5-11.1 5.7-2.4 2.8-4.6 7.3-4 11.6 4.3.3 8.6-2.1 11.2-5.3z"
        {...F}
      />
    </>
  ),
  /** La sonrisa-flecha de Amazon bajo «prime video». */
  primeSmile: (
    <>
      <path
        d="M8 62 C 30 82, 70 82, 92 62"
        fill="none"
        stroke="currentColor"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <path
        d="M92 62 L79 57 M92 62 L84 74"
        fill="none"
        stroke="currentColor"
        strokeWidth={9}
        strokeLinecap="round"
      />
    </>
  ),
  /**
   * Crunchyroll: la espiral que sale del círculo. Con el hueco recortado como
   * media luna el símbolo se leía como una luna, no como su marca.
   */
  crunchyroll: (
    <>
      <path d="M62 12 A 40 40 0 1 0 88 50 A 24 24 0 1 1 62 26 A 22 22 0 0 0 62 12 Z" {...F} />
      <circle cx="72" cy="19" r="9" {...F} />
    </>
  ),
  /** Galón de Plex. */
  plex: (
    <path
      d="M32 12 L66 50 L32 88"
      fill="none"
      stroke="currentColor"
      strokeWidth={13}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  /**
   * F1: las barras de velocidad de la marca. La «F» de espacio negativo del
   * logotipo real se vuelve ilegible a 34 px, así que se conserva el rasgo que
   * sí sobrevive al tamaño: el escalonado en cuña.
   */
  f1: (
    <g transform="skewX(-16)">
      <path d="M20 24 h64 l-10 15 H30 Z" {...F} />
      <path d="M14 46 h58 l-10 15 H24 Z" {...F} opacity={0.78} />
      <path d="M8 68 h44 l-10 15 H18 Z" {...F} opacity={0.5} />
    </g>
  ),
  /** Pelota de béisbol con sus costuras. */
  mlb: (
    <>
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth={8} />
      <path
        d="M26 20 C 36 34, 36 66, 26 80"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d="M74 20 C 64 34, 64 66, 74 80"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d="M31 32 l-8 3 M31 45 l-9 1 M31 58 l-9-1 M31 69 l-8-3"
        stroke="currentColor"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      <path
        d="M69 32 l8 3 M69 45 l9 1 M69 58 l9-1 M69 69 l8-3"
        stroke="currentColor"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
    </>
  ),
  /** Globo de Universal con su anillo. */
  universal: (
    <>
      <circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" strokeWidth={6} />
      <ellipse
        cx="50"
        cy="50"
        rx="33"
        ry="13"
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        opacity={0.75}
      />
      <ellipse
        cx="50"
        cy="50"
        rx="14"
        ry="33"
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        opacity={0.75}
      />
      <path
        d="M6 62 C 30 78, 70 78, 94 62"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
      />
    </>
  ),
  /** Arco de Claro. */
  claroSwoosh: (
    <path
      d="M18 74 C 22 32, 78 32, 82 74"
      fill="none"
      stroke="currentColor"
      strokeWidth={13}
      strokeLinecap="round"
    />
  ),
  /** IPTV no es una marca: pantalla y ondas de señal. */
  iptv: (
    <>
      <rect
        x="18"
        y="40"
        width="64"
        height="44"
        rx="7"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
      />
      <path d="M50 40 L50 26" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      <path
        d="M30 24 A 28 28 0 0 1 70 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d="M20 12 A 44 44 0 0 1 80 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinecap="round"
        opacity={0.5}
      />
    </>
  ),

  // ── Música ─────────────────────────────────────────────────────────────
  spotify: (
    <>
      <circle cx="50" cy="50" r="44" {...F} />
      <g fill="none" stroke="var(--symbol-hole, #000)" strokeLinecap="round">
        <path d="M26 38 C 44 32, 64 34, 78 42" strokeWidth={10} />
        <path d="M30 54 C 45 49, 61 51, 73 57" strokeWidth={8.5} />
        <path d="M33 68 C 45 64, 57 65, 67 70" strokeWidth={7} />
      </g>
    </>
  ),
  appleMusic: (
    <>
      <path
        d="M74 16 L40 25 v43"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <path
        d="M74 16 v43"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <ellipse cx="28" cy="70" rx="14" ry="11" {...F} />
      <ellipse cx="62" cy="61" rx="14" ry="11" {...F} />
    </>
  ),
  youtubePlay: (
    <>
      <rect x="4" y="20" width="92" height="60" rx="17" {...F} />
      <path d="M41 37 L68 50 L41 63 Z" fill="var(--symbol-hole, #000)" />
    </>
  ),
  amazonMusicNote: (
    <>
      <path
        d="M66 20 L38 28 v36"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <ellipse cx="28" cy="66" rx="12" ry="10" {...F} />
      <path
        d="M12 82 C 32 94, 68 94, 88 82"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d="M88 82 L77 79 M88 82 L82 91"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinecap="round"
        opacity={0.85}
      />
    </>
  ),
  /** Ecualizador de Deezer. */
  deezerBars: (
    <>
      {[
        [10, [72]],
        [33, [48, 72]],
        [56, [24, 48, 72]],
        [79, [24, 48, 72]],
      ].flatMap(([x, ys]) =>
        (ys as number[]).map((y) => (
          <rect key={`${x}-${y}`} x={x as number} y={y} width="16" height="13" rx="3" {...F} />
        )),
      )}
      <rect x="56" y="6" width="16" height="13" rx="3" {...F} opacity={0.55} />
    </>
  ),
  /** La «q» de Qobuz. El asta baja recta a la derecha: con la cola en diagonal
      el símbolo se leía como una lupa. */
  qobuz: (
    <>
      <circle cx="44" cy="46" r="28" fill="none" stroke="currentColor" strokeWidth={11} />
      <path
        d="M72 30 V92"
        fill="none"
        stroke="currentColor"
        strokeWidth={11}
        strokeLinecap="round"
      />
    </>
  ),

  // ── Diseño e IA ────────────────────────────────────────────────────────
  /** La A de Adobe. */
  adobeA: (
    <>
      <path d="M38 14 L14 86 h16 l7-22h20l-8-22 -8 22" {...F} />
      <path d="M60 14 L86 86 H66 L44 14 Z" {...F} />
    </>
  ),
  canvaC: (
    <>
      <circle cx="50" cy="50" r="42" {...F} />
      <path
        d="M64 36 a20 20 0 1 0 2 27"
        fill="none"
        stroke="var(--symbol-hole, #fff)"
        strokeWidth={9}
        strokeLinecap="round"
      />
    </>
  ),
  capcut: (
    <>
      <path
        d="M62 24 A 30 30 0 1 0 62 76"
        fill="none"
        stroke="currentColor"
        strokeWidth={12}
        strokeLinecap="round"
      />
      <circle cx="70" cy="50" r="12" {...F} />
    </>
  ),
  /** Nudo hexagonal de OpenAI, tres trazos girados 120°. */
  openai: (
    <>
      {[0, 120, 240].map((a) => (
        <path
          key={a}
          d="M50 12 L79 29 L79 63 L50 80 L21 63 L21 29 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={7}
          strokeLinejoin="round"
          transform={`rotate(${a} 50 50)`}
          opacity={0.9}
        />
      ))}
    </>
  ),
  /** Destello de cuatro puntas de Gemini. */
  geminiSpark: (
    <path
      d="M50 2 C 53 26, 74 47, 98 50 C 74 53, 53 74, 50 98 C 47 74, 26 53, 2 50 C 26 47, 47 26, 50 2 Z"
      {...F}
    />
  ),
  microsoft: (
    <>
      <rect x="8" y="8" width="38" height="38" fill="#F25022" />
      <rect x="54" y="8" width="38" height="38" fill="#7FBA00" />
      <rect x="8" y="54" width="38" height="38" fill="#00A4EF" />
      <rect x="54" y="54" width="38" height="38" fill="#FFB900" />
    </>
  ),
  googleDrive: (
    <>
      <path d="M36 10 L64 10 L92 60 L64 60 Z" fill="#FFCF63" />
      <path d="M36 10 L8 60 L22 84 L50 34 Z" fill="#4688F1" />
      <path d="M8 60 L92 60 L78 84 L22 84 Z" fill="#2BA25C" />
    </>
  ),
  onedrive: (
    <path d="M30 78 h48 a16 16 0 0 0 2-32 A 24 24 0 0 0 36 36 A 21 21 0 0 0 30 78 Z" {...F} />
  ),
  /** Búho de Duolingo: los penachos y las cejas son lo que lo hacen búho. */
  duolingoOwl: (
    <>
      <path d="M22 30 L30 10 L44 22 Z" {...F} />
      <path d="M78 30 L70 10 L56 22 Z" {...F} />
      <path
        d="M50 14 C 76 14, 90 32, 90 56 C 90 78, 72 92, 50 92 C 28 92, 10 78, 10 56 C 10 32, 24 14, 50 14 Z"
        {...F}
      />
      <circle cx="35" cy="48" r="13" fill="var(--symbol-hole, #fff)" />
      <circle cx="65" cy="48" r="13" fill="var(--symbol-hole, #fff)" />
      <circle cx="35" cy="48" r="5.5" fill="#3E2723" />
      <circle cx="65" cy="48" r="5.5" fill="#3E2723" />
      <path
        d="M24 34 C 30 28, 40 28, 45 33 M76 34 C 70 28, 60 28, 55 33"
        fill="none"
        stroke="var(--symbol-hole, #fff)"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path d="M50 60 L40 71 h20 Z" fill="#FFA000" />
    </>
  ),
  scribd: (
    <>
      <path
        d="M22 12 h44 l16 16 v60 H22 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <path
        d="M66 12 v16 h16"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <path
        d="M35 46 h30 M35 60 h30 M35 74 h18"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinecap="round"
      />
    </>
  ),
  picsart: (
    <>
      <path d="M24 82 C 24 50, 44 18, 78 14 C 74 48, 54 74, 24 82 Z" {...F} />
      <path d="M24 82 L14 92" stroke="currentColor" strokeWidth={8} strokeLinecap="round" />
    </>
  ),

  // ── Otros ──────────────────────────────────────────────────────────────
  discord: (
    <>
      <path
        d="M76 26 A 62 62 0 0 0 60 20 l-2 4 a 52 52 0 0 0 -16 0 l-2-4 a 62 62 0 0 0 -16 6 C 12 46, 9 64, 11 80 a 64 64 0 0 0 19 9 l4-7 a 42 42 0 0 1 -7-3 l2-1 a 46 46 0 0 0 42 0 l2 1 a 42 42 0 0 1 -7 3 l4 7 a 64 64 0 0 0 19-9 C 91 64, 88 46, 76 26 Z"
        {...F}
      />
      <ellipse cx="37" cy="60" rx="7" ry="8" fill="var(--symbol-hole, #000)" />
      <ellipse cx="63" cy="60" rx="7" ry="8" fill="var(--symbol-hole, #000)" />
    </>
  ),
  flame: (
    <>
      <path
        d="M50 6 C 66 26, 82 38, 82 58 a32 32 0 0 1 -64 0 C 18 42, 30 34, 38 22 C 42 34, 48 38, 50 6 Z"
        {...F}
      />
      <path
        d="M50 50 C 58 60, 62 66, 62 72 a12 12 0 0 1 -24 0 c 0-8, 8-12, 12-22 Z"
        fill="var(--symbol-hole, #000)"
        opacity={0.55}
      />
    </>
  ),
  shield: (
    <>
      <path
        d="M50 8 L84 22 v30 C 84 74, 68 88, 50 94 C 32 88, 16 74, 16 52 V22 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <path
        d="M34 50 L46 62 L68 38"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  sharkFin: (
    <>
      <path d="M14 78 C 40 74, 62 52, 72 14 C 84 40, 88 62, 90 78 Z" {...F} />
      <path
        d="M8 88 C 28 96, 72 96, 92 88"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinecap="round"
        opacity={0.6}
      />
    </>
  ),
  umbrella: (
    <>
      <path d="M8 52 A 42 42 0 0 1 92 52 Z" {...F} />
      <path
        d="M50 52 v28 a12 12 0 0 1 -22 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="round"
      />
    </>
  ),
  pin: (
    <>
      <path
        d="M50 92 C 50 92, 78 62, 78 40 a28 28 0 0 0 -56 0 C 22 62, 50 92, 50 92 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <circle cx="50" cy="39" r="11" {...F} />
    </>
  ),
  playCircle: (
    <>
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth={8} />
      <path d="M41 33 L69 50 L41 67 Z" {...F} />
    </>
  ),
  infinity: (
    <path
      d="M50 50 C 42 34, 30 30, 22 38 a17 17 0 0 0 0 24 c 8 8, 20 4, 28-12 C 58 34, 70 30, 78 38 a17 17 0 0 1 0 24 c -8 8, -20 4, -28-12 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth={9}
      strokeLinecap="round"
    />
  ),
  dumbbell: (
    <>
      <path d="M28 50 h44" stroke="currentColor" strokeWidth={10} strokeLinecap="round" />
      <rect x="12" y="32" width="16" height="36" rx="5" {...F} />
      <rect x="72" y="32" width="16" height="36" rx="5" {...F} />
    </>
  ),
  bag: (
    <>
      <path
        d="M18 32 h64 l-6 56 H24 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinejoin="round"
      />
      <path
        d="M36 42 V26 a14 14 0 0 1 28 0 v16"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinecap="round"
      />
    </>
  ),
  card: (
    <>
      <rect
        x="8"
        y="24"
        width="84"
        height="54"
        rx="9"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
      />
      <path d="M8 42 h84" stroke="currentColor" strokeWidth={9} />
      <path d="M22 62 h20" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
    </>
  ),
  phone: (
    <>
      <rect
        x="28"
        y="6"
        width="44"
        height="88"
        rx="10"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
      />
      <path d="M43 80 h14" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      <path
        d="M42 20 h16"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.7}
      />
    </>
  ),
  cutlery: (
    <>
      <path
        d="M26 8 v34 a10 10 0 0 0 20 0 V8 M36 42 V92"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinecap="round"
      />
      <path
        d="M70 8 C 62 18, 62 40, 70 46 V92"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinecap="round"
      />
    </>
  ),
  plane: (
    <path
      d="M92 44 L58 40 L38 6 H26 l10 36 -18 2 -8-12 H2 l6 18 -6 18 h8 l8-12 18 2 -10 36 h12 l20-34 34-4 a6 6 0 0 0 0-12 Z"
      {...F}
    />
  ),
  carShield: (
    <>
      <path
        d="M50 8 L84 22 v28 C 84 72, 68 86, 50 92 C 32 86, 16 72, 16 50 V22 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinejoin="round"
      />
      <path
        d="M32 56 l5-13 h26 l5 13 v12 H32 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <circle cx="39" cy="68" r="4" {...F} />
      <circle cx="61" cy="68" r="4" {...F} />
    </>
  ),
  gamepad: (
    <>
      <path
        d="M30 30 h40 a26 26 0 0 1 22 40 l-4 8 a12 12 0 0 1 -20 2 l-6-10 H38 l-6 10 a12 12 0 0 1 -20-2 l-4-8 A 26 26 0 0 1 30 30 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <path
        d="M30 50 h14 M37 43 v14"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinecap="round"
      />
      <circle cx="64" cy="46" r="5" {...F} />
      <circle cx="74" cy="56" r="5" {...F} />
    </>
  ),
  book: (
    <>
      <path
        d="M12 18 C 26 12, 42 12, 50 20 C 58 12, 74 12, 88 18 v62 c -14-6, -30-6, -38 2 c -8-8, -24-8, -38-2 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinejoin="round"
      />
      <path d="M50 20 v64" stroke="currentColor" strokeWidth={6} />
    </>
  ),
  bot: (
    <>
      <rect
        x="16"
        y="30"
        width="68"
        height="52"
        rx="14"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
      />
      <circle cx="37" cy="52" r="6" {...F} />
      <circle cx="63" cy="52" r="6" {...F} />
      <path d="M38 68 h24" stroke="currentColor" strokeWidth={6} strokeLinecap="round" />
      <path d="M50 30 V14" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      <circle cx="50" cy="10" r="6" {...F} />
    </>
  ),
  users: (
    <>
      <circle cx="38" cy="34" r="15" fill="none" stroke="currentColor" strokeWidth={7.5} />
      <path
        d="M12 84 a26 26 0 0 1 52 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinecap="round"
      />
      <path
        d="M66 22 a15 15 0 0 1 0 26 M72 62 a24 24 0 0 1 18 22"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinecap="round"
        opacity={0.75}
      />
    </>
  ),
  hash: (
    <path
      d="M32 10 L22 90 M70 10 L60 90 M12 34 h78 M8 66 h78"
      fill="none"
      stroke="currentColor"
      strokeWidth={8.5}
      strokeLinecap="round"
    />
  ),
  key: (
    <>
      <circle cx="32" cy="38" r="20" fill="none" stroke="currentColor" strokeWidth={8} />
      <path
        d="M46 52 L86 92 M74 80 l10-10 M62 68 l10-10"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="round"
      />
    </>
  ),
  grid: (
    <>
      <rect
        x="10"
        y="10"
        width="34"
        height="34"
        rx="7"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
      />
      <rect x="56" y="10" width="34" height="34" rx="7" {...F} />
      <rect x="10" y="56" width="34" height="34" rx="7" {...F} />
      <rect
        x="56"
        y="56"
        width="34"
        height="34"
        rx="7"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
      />
    </>
  ),
  ticket: (
    <>
      <path
        d="M10 30 h80 v14 a8 8 0 0 0 0 16 v14 H10 V60 a8 8 0 0 0 0-16 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinejoin="round"
      />
      <path
        d="M54 34 v6 M54 47 v6 M54 60 v6"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
      />
    </>
  ),
  train: (
    <>
      <rect
        x="20"
        y="12"
        width="60"
        height="58"
        rx="12"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
      />
      <path d="M20 42 h60" stroke="currentColor" strokeWidth={7} />
      <circle cx="36" cy="56" r="5" {...F} />
      <circle cx="64" cy="56" r="5" {...F} />
      <path
        d="M32 70 L20 92 M68 70 L80 92"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinecap="round"
      />
    </>
  ),
  coins: (
    <>
      <ellipse
        cx="50"
        cy="26"
        rx="32"
        ry="13"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
      />
      <path
        d="M18 26 v22 c 0 7, 14 13, 32 13 s 32-6, 32-13 V26"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
      />
      <path
        d="M18 48 v22 c 0 7, 14 13, 32 13 s 32-6, 32-13 V48"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
      />
    </>
  ),

  // ── Trámites ───────────────────────────────────────────────────────────
  /** Acta: hoja con sello. */
  seal: (
    <>
      <path
        d="M22 8 h40 l16 16 v50 H22 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <path
        d="M62 8 v16 h16"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <path d="M34 36 h24 M34 50 h16" stroke="currentColor" strokeWidth={6} strokeLinecap="round" />
      <circle cx="66" cy="74" r="14" fill="none" stroke="currentColor" strokeWidth={7} />
      <path
        d="M58 86 l-4 12 12-6 12 6 -4-12"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinejoin="round"
      />
    </>
  ),
  /** SAT: comprobante. */
  receipt: (
    <>
      <path
        d="M22 8 h56 v84 l-11-8 -11 8 -11-8 -11 8 -12-8 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <path
        d="M36 32 h28 M36 48 h28 M36 64 h16"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
      />
    </>
  ),
  medicalCross: (
    <>
      <rect x="8" y="34" width="84" height="32" rx="10" {...F} />
      <rect x="34" y="8" width="32" height="84" rx="10" {...F} />
    </>
  ),
  /** IMSS y seguridad social: credencial. */
  idCard: (
    <>
      <rect
        x="8"
        y="20"
        width="84"
        height="60"
        rx="10"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
      />
      <circle cx="34" cy="44" r="10" fill="none" stroke="currentColor" strokeWidth={6.5} />
      <path
        d="M20 66 a15 15 0 0 1 28 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinecap="round"
      />
      <path
        d="M58 40 h22 M58 54 h22"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinecap="round"
      />
    </>
  ),
  gradCap: (
    <>
      <path
        d="M50 16 L94 38 L50 60 L6 38 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinejoin="round"
      />
      <path
        d="M24 48 v22 c 0 8, 12 14, 26 14 s 26-6, 26-14 V48"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinecap="round"
      />
      <path d="M90 40 v22" stroke="currentColor" strokeWidth={6.5} strokeLinecap="round" />
    </>
  ),
  fingerprint: (
    <>
      <path
        d="M50 90 C 44 78, 42 64, 44 50"
        fill="none"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinecap="round"
      />
      <path
        d="M32 86 C 26 70, 26 52, 34 40"
        fill="none"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinecap="round"
      />
      <path
        d="M18 74 C 12 54, 16 30, 34 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinecap="round"
      />
      <path
        d="M60 88 C 66 72, 68 54, 62 42 a14 14 0 0 0 -26 8 c 0 12, 4 20, 6 26"
        fill="none"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinecap="round"
      />
      <path
        d="M78 76 C 84 56, 82 30, 62 18 C 54 15, 46 15, 40 17"
        fill="none"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinecap="round"
      />
    </>
  ),
  car: (
    <>
      <path
        d="M14 62 l8-24 a10 10 0 0 1 10-7 h36 a10 10 0 0 1 10 7 l8 24 v14 H14 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <path d="M22 58 h56" stroke="currentColor" strokeWidth={6} />
      <circle cx="30" cy="76" r="8" {...F} />
      <circle cx="70" cy="76" r="8" {...F} />
    </>
  ),
  house: (
    <>
      <path
        d="M12 46 L50 14 L88 46"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 40 v46 h56 V40"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinejoin="round"
      />
      <path
        d="M40 86 V60 h20 v26"
        fill="none"
        stroke="currentColor"
        strokeWidth={6.5}
        strokeLinejoin="round"
      />
    </>
  ),
  calendar: (
    <>
      <rect
        x="10"
        y="20"
        width="80"
        height="70"
        rx="10"
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
      />
      <path d="M10 42 h80" stroke="currentColor" strokeWidth={7} />
      <path
        d="M31 10 v18 M69 10 v18"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeLinecap="round"
      />
      <circle cx="34" cy="60" r="5" {...F} />
      <circle cx="52" cy="60" r="5" {...F} />
      <circle cx="70" cy="60" r="5" {...F} />
      <circle cx="34" cy="76" r="5" {...F} />
      <circle cx="52" cy="76" r="5" {...F} />
    </>
  ),
};

/** Símbolos que llevan su propio color y no deben teñirse con la tinta. */
const FIXED_COLOR = new Set<SymbolId>(["peacock", "microsoft", "googleDrive"]);

export function BrandSymbol({
  id,
  size,
  className,
  ink,
  hole,
}: {
  id: SymbolId;
  /** Lado en `cqw` o cualquier unidad CSS. */
  size: string;
  className?: string;
  /** Tinta del símbolo. Por defecto, la del nombre. */
  ink?: string;
  /** Color del hueco en los símbolos sólidos (el negro del disco de Spotify). */
  hole?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={
        {
          display: "block",
          color: FIXED_COLOR.has(id) ? undefined : (ink ?? "var(--wordmark-ink)"),
          ...(hole ? { "--symbol-hole": hole } : {}),
        } as React.CSSProperties
      }
      aria-hidden
      focusable="false"
    >
      {SHAPES[id]}
    </svg>
  );
}
