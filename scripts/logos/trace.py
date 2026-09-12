"""Vectoriza los logotipos de referencia de Uri.

En vez de redibujar las letras a ojo con una fuente parecida —que es lo que
falló tres rondas seguidas— cada capa de color de la imagen se aísla, se
binariza y se traza con potrace. El resultado es la forma exacta del logotipo
como `path` SVG: la tipografía queda idéntica porque deja de ser tipografía y
pasa a ser contorno.

Uso:
    python3 trace.py <nombre>...        # traza los que se pidan
    python3 trace.py --all              # todos
"""

import json
import sys

import numpy as np
import potrace
from PIL import Image, ImageFilter

UP = "/root/.claude/uploads/62c054d9-a0a6-5ee5-9c58-8288ae594ab7/"
OUT = "/tmp/claude-0/-home-user-myappstreaming/62c054d9-a0a6-5ee5-9c58-8288ae594ab7/scratchpad/traced/"


# ── selectores de capa ──────────────────────────────────────────────────────
def near(hexcolor, tol=60):
    """Píxeles cercanos a un color dado."""
    t = tuple(int(hexcolor[i : i + 2], 16) for i in (1, 3, 5))

    def f(a):
        return np.sqrt(((a.astype(np.int16) - np.array(t)) ** 2).sum(axis=2)) < tol

    return f


def light(thr=170):
    """Píxeles claros (tinta blanca sobre fondo de color)."""
    return lambda a: a.mean(axis=2) > thr


def dark(thr=110):
    """Píxeles oscuros (tinta negra sobre fondo claro)."""
    return lambda a: a.mean(axis=2) < thr


def saturated(minsat=55):
    """Píxeles con color real, ignorando blancos, negros y grises."""

    def f(a):
        x = a.astype(np.int16)
        return (x.max(axis=2) - x.min(axis=2)) > minsat

    return f


def both(f, g):
    return lambda a: f(a) & g(a)


def notf(f):
    return lambda a: ~f(a)


def allpx():
    """Todo el lienzo. Sirve para meter el fondo del icono como primera capa."""
    return lambda a: np.ones(a.shape[:2], bool)


# ── trazado ─────────────────────────────────────────────────────────────────
def curve_to_d(path, sx, sy, ox, oy, r=1):
    """Convierte las curvas de potrace en un atributo `d` compacto."""
    out = []
    for curve in path:
        sp = curve.start_point
        out.append(f"M{round((sp.x - ox) * sx, r)},{round((sp.y - oy) * sy, r)}")
        for seg in curve:
            e = seg.end_point
            if seg.is_corner:
                c = seg.c
                out.append(f"L{round((c.x - ox) * sx, r)},{round((c.y - oy) * sy, r)}")
                out.append(f"L{round((e.x - ox) * sx, r)},{round((e.y - oy) * sy, r)}")
            else:
                a, b = seg.c1, seg.c2
                out.append(
                    f"C{round((a.x - ox) * sx, r)},{round((a.y - oy) * sy, r)}"
                    f" {round((b.x - ox) * sx, r)},{round((b.y - oy) * sy, r)}"
                    f" {round((e.x - ox) * sx, r)},{round((e.y - oy) * sy, r)}"
                )
        out.append("Z")
    return "".join(out)


def trace(file, name, layers, box=1000, crop=None, maxside=900, minside=700, turd=8, fondo=(255, 255, 255)):
    """Traza cada capa y devuelve `{viewBox, layers:[{fill, d}]}`.

    Todas las capas comparten el mismo encuadre —el rectángulo que ocupa la
    tinta— para que al superponerlas queden registradas entre sí.
    """
    # Los archivos con transparencia hay que aplanarlos antes de convertir a
    # RGB, porque lo transparente se vuelve negro y cualquier selector de
    # «oscuro» se traga el fondo entero. Por defecto se aplanan sobre blanco.
    #
    # `fondo` existe para el caso contrario: cuando lo que se busca es la tinta
    # CLARA y fuera de la figura hay transparencia. Aplanado sobre blanco, ese
    # exterior se vuelve blanco y el selector de claros se lo lleva junto con la
    # tinta; sobre negro, la tinta clara se queda sola. Es lo que pasa con la
    # cara de Discord, que es blanca y vive dentro de un disco recortado.
    raw = Image.open(UP + file)
    if raw.mode in ("RGBA", "LA", "P"):
        raw = raw.convert("RGBA")
        flat = Image.new("RGBA", raw.size, (*fondo, 255))
        flat.alpha_composite(raw)
        im = flat.convert("RGB")
    else:
        im = raw.convert("RGB")
    if crop:
        w, h = im.size
        im = im.crop((int(w * crop[0]), int(h * crop[1]), int(w * crop[2]), int(h * crop[3])))
    if max(im.size) > maxside:
        s = maxside / max(im.size)
        im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    elif max(im.size) < minside:
        # Las capturas chicas (el Plex de 196 px) dan curvas dentadas: potrace
        # solo puede seguir el escalón del píxel. Se amplía con Lanczos y se
        # difumina un poco: el escalón se vuelve una rampa, y al binarizar una
        # rampa el contorno sale continuo en vez de en escalera.
        f = minside / max(im.size)
        im = im.resize((int(im.width * f), int(im.height * f)), Image.LANCZOS)
        im = im.filter(ImageFilter.GaussianBlur(f / 2.2))

    arr = np.asarray(im)
    masks = [(spec, spec["match"](arr)) for spec in layers]

    # Encuadre común: la unión de toda la tinta.
    union = np.zeros(arr.shape[:2], bool)
    for _, m in masks:
        union |= m
    ys, xs = np.where(union)
    if len(xs) == 0:
        raise SystemExit(f"{name}: ninguna capa encontró píxeles")
    ox, oy = xs.min(), ys.min()
    w, h = xs.max() - ox + 1, ys.max() - oy + 1
    scale = box / max(w, h)

    # Cobertura de tinta dentro del encuadre. Es lo que permite igualar el
    # PESO VISUAL entre logotipos: dos con el mismo rectángulo pueden tener
    # muy distinta cantidad de trazo (la montaña de Paramount+ está llena de
    # aire; las letras de ViX son macizas), y si solo se iguala el rectángulo
    # uno se ve enorme y el otro diminuto.
    coverage = round(float(union[oy : oy + h, ox : ox + w].mean()), 4)

    result = {
        "viewBox": f"0 0 {round(w * scale, 1)} {round(h * scale, 1)}",
        "coverage": coverage,
        "layers": [],
    }
    for spec, mask in masks:
        # Dos detalles de potrace, los dos aprendidos a golpes:
        #  · la máscara va booleana — con enteros compara contra `blacklevel`
        #    y termina trazando el rectángulo completo en vez de las letras;
        #  · su convención es la del gris: traza lo OSCURO. Como aquí `True`
        #    es la tinta, hay que invertir o salen las letras caladas dentro
        #    de un rectángulo.
        bmp = potrace.Bitmap(~mask)
        p = bmp.trace(turdsize=turd, alphamax=1.0, opttolerance=0.2)
        d = curve_to_d(p, scale, scale, ox, oy)
        if d:
            result["layers"].append({"fill": spec["fill"], "d": d})
    return result


# ── qué trazar de cada imagen ───────────────────────────────────────────────
JOBS = {
    # nombre: (archivo, capas, recorte opcional)
    "scribd": ("77b94687-image.webp", [{"match": light(), "fill": "#FFFFFF"}], None),
    "viki": ("58c14491-image.png", [{"match": light(), "fill": "#FFFFFF"}], (0.12, 0.16, 0.88, 0.84)),
    "universalplus": ("6a0ebcce-image.webp", [{"match": dark(120), "fill": "#000000"}], None),
    "crunchyroll": ("56180d02-image.png", [{"match": light(), "fill": "#FFFFFF"}], None),
    "amazonmusic": ("66fab453-image.jpg", [{"match": dark(120), "fill": "#000000"}], None),
    "iqiyi": ("cc3c51a0-image.png", [{"match": light(), "fill": "#FFFFFF"}], None),
    "roblox": ("e5c754a3-image.webp", [{"match": light(), "fill": "#FFFFFF"}], None),
    "capcut": ("570b299c-image.webp", [{"match": dark(120), "fill": "#000000"}], None),
    # El logotipo viene negro sobre blanco, pero la ficha es negra: se traza la
    # forma y se pinta en blanco.
    "qobuz": ("9962d364-image.png", [{"match": dark(120), "fill": "#FFFFFF"}], None),
    # El wordmark y los cinco puntos del degradado, que quedaban fuera del
    # recorte anterior. Cada punto es una capa con su color muestreado.
    "peacock": (
        "b1b62659-image.jpg",
        [
            {"match": light(190), "fill": "#FFFFFF"},
            {"match": near("#F8B410", 70), "fill": "#F8B410"},
            {"match": near("#E82828", 70), "fill": "#E82828"},
            {"match": near("#A42CDC", 70), "fill": "#A42CDC"},
            {"match": near("#1898E8", 80), "fill": "#1898E8"},
            {"match": near("#00B060", 70), "fill": "#00B060"},
        ],
        (0.16, 0.30, 0.86, 0.72),
    ),
    "applemusic": ("2ccd21cf-image.jpg", [{"match": light(190), "fill": "#FFFFFF"}], None),
    "paramountplus": ("3e19799a-image.png", [{"match": light(200), "fill": "#FFFFFF"}], (0.30, 0.0, 0.70, 0.82)),
    "disneyplus": ("d8039d36-image.jpg", [{"match": light(200), "fill": "#FFFFFF"}], None),
    "kocowa": ("953823f8-image.png", [{"match": light(180), "fill": "#FFFFFF"}], None),
    # La barra negra y las letras blancas dentro: dos capas, la barra primero.
    "hidive": (
        "e857e205-image.png",
        [
            {"match": both(dark(90), notf(saturated(45))), "fill": "#000000"},
            {"match": light(200), "fill": "#FFFFFF"},
        ],
        (0.04, 0.30, 0.96, 0.66),
    ),
    "photoshop": ("8c43a815-image.png", [{"match": near("#31A8FF", 90), "fill": "#31A8FF"}], None),
    "smartfit": (
        "e4782df5-image.png",
        [
            {"match": both(dark(120), notf(saturated(50))), "fill": "#FFFFFF"},
            {"match": near("#FBBA00", 90), "fill": "#FBBA00"},
        ],
        None,
    ),
    "clarovideo": (
        "9465f8fb-image.png",
        [
            {"match": near("#E1251B", 100), "fill": "#E1251B"},
            {"match": both(dark(90), notf(saturated(45))), "fill": "#FFFFFF"},
        ],
        None,
    ),
    # Sin recorte: el encuadre ya sale ajustado. El «®» va a la altura de la
    # base del emblema y no cuelga por debajo —lo que asomaba cuarenta píxeles
    # más abajo era la punta de la «V»—, así que recortar ahí cortaba el bajo
    # del logotipo entero.
    "f1tv": (
        "583c308b-image.png",
        [
            {"match": near("#E10600", 95), "fill": "#E10600"},
            {"match": both(dark(90), notf(saturated(45))), "fill": "#15151E"},
        ],
        None,
    ),
    "mlbtv": (
        "90dac70d-image.jpg",
        [
            {"match": near("#001E3C", 85), "fill": "#001E3C"},
            {"match": near("#BA001E", 95), "fill": "#BA001E"},
        ],
        (0.2, 0.25, 0.8, 0.75),
    ),
    # En dos piezas. El archivo deja mucho aire entre el corazón y el nombre, y
    # trazado de una sola pieza ese hueco se come la mitad de la caja: el
    # nombre quedaba diminuto. Compuestas se controla cuánto pesa cada una.
    "deezerheart": (
        "994e13a4-image.jpg",
        [{"match": near("#A237FF", 115), "fill": "#A237FF"}],
        (0.17, 0.16, 0.83, 0.72),
    ),
    "deezerword": (
        "994e13a4-image.jpg",
        [{"match": both(light(200), notf(saturated(40))), "fill": "#FFFFFF"}],
        # Dentro de la placa negra: el archivo trae página blanca alrededor y
        # el recorte anterior se llevaba sus esquinas redondeadas.
        (0.16, 0.7, 0.84, 0.818),
    ),
    # Las cuatro caras de la nube y el nombre son todas azules y muy juntas:
    # por distancia de color el azul oscuro de la nube se metía en la capa del
    # nombre, así que al aclarar el nombre se aclaraba media nube. El corte va
    # por el canal verde, que es donde sí se separan: 75 el nombre, 100 · 121 ·
    # 145 · 168 las cuatro caras.
    "onedrive": (
        "a3d2d41c-image.webp",
        [
            {"match": lambda a: (a[:, :, 1] < 88) & (a[:, :, 2] > 140), "fill": "#074BB3"},
            {
                "match": lambda a: (a[:, :, 1] >= 88) & (a[:, :, 1] < 112) & (a[:, :, 2] > 150),
                "fill": "#0564BA",
            },
            {
                "match": lambda a: (a[:, :, 1] >= 112) & (a[:, :, 1] < 138) & (a[:, :, 2] > 180),
                "fill": "#0179D4",
            },
            {
                "match": lambda a: (a[:, :, 1] >= 138) & (a[:, :, 1] < 165) & (a[:, :, 2] > 190),
                "fill": "#1391DF",
            },
            {
                "match": lambda a: (a[:, :, 1] >= 165) & (a[:, :, 2] > 200) & (a[:, :, 0] < 120),
                "fill": "#28A8EA",
            },
        ],
        None,
    ),
    "iptv": ("2731a5c7-image.png", [{"match": light(200), "fill": "#FFFFFF"}], None),
    "picsart": (
        "7cd0421c-image.jpg",
        [
            {"match": near("#BE07BD", 110), "fill": "#BE07BD"},
            {"match": near("#78DEE4", 90), "fill": "#78DEE4"},
        ],
        None,
    ),
    # El lockup completo: el «1» de cuatro colores arriba y, debajo, «Google»
    # con los colores de Google y «One» en su gris exacto (#5F6368, el gris 700
    # de su paleta). Los cinco están muestreados de tu imagen.
    "googleone": (
        "b44168bd-image.png",
        [
            {"match": near("#4285F4", 70), "fill": "#4285F4"},
            {"match": near("#FBBC04", 70), "fill": "#FBBC04"},
            {"match": near("#34A853", 70), "fill": "#34A853"},
            {"match": near("#EA4335", 70), "fill": "#EA4335"},
            {"match": both(dark(200), notf(saturated(40))), "fill": "#5F6368"},
        ],
        None,
    ),
    # De una pieza. Antes iban la cinta y el nombre por separado y se componían
    # con alturas fijas: la «M» se salía de la tarjeta porque la proporción
    # entre las dos piezas la ponía el montaje y no el archivo.
    "microsoft365": (
        "80032c40-image.png",
        [
            {"match": saturated(38), "fill": "#COPILOT"},
            {"match": both(dark(190), notf(saturated(38))), "fill": "#737373"},
        ],
        None,
    ),
    # ── Wordmarks que simple-icons no trae: trazados de las imágenes de Uri ──
    "netflixword": ("4917a8a0-image.png", [{"match": near("#E50914", 110), "fill": "#E50914"}], None),
    "netflixn": ("1dc6dfbf-image.png", [{"match": near("#D3111C", 130), "fill": "#E50914"}], None),
    "spotifymark": ("8e317aad-image.png", [{"match": near("#1ED760", 110), "fill": "#1ED760"}], None),
    "spotifyword": ("3499e72e-image.png", [{"match": near("#2EBD59", 120), "fill": "#1ED760"}], (0.0, 0.0, 0.93, 1.0)),
    "youtube": (
        "e082254d-image.png",
        [
            {"match": near("#FF0000", 110), "fill": "#FF0000"},
            {"match": both(dark(110), notf(saturated(50))), "fill": "#282828"},
        ],
        None,
    ),
    # El lockup apilado —«HBO» arriba, «max» abajo— tal como lo mandó Uri.
    # Va de una sola pieza: así el interletraje y la relación de alturas entre
    # las dos líneas salen del archivo y no de una composición nuestra. El
    # relleno va al degradado metálico muestreado de la misma imagen.
    "hbomax": ("9172f180-image.jpg", [{"match": light(110), "fill": "#HBOMAX"}], None),
    # El logotipo que mandaste: «ple» en blanco y la «x» en dorado, sobre negro.
    # El dorado se toma del núcleo de los píxeles, no del promedio, que el JPEG
    # ensucia con un halo verdoso en los bordes.
    "plex": (
        "003f8978-image.jpg",
        [
            {"match": both(light(150), notf(saturated(60))), "fill": "#FFFFFF"},
            {"match": saturated(60), "fill": "#EFAE02"},
        ],
        None,
    ),
    # El nudo de OpenAI, que viene negro sobre transparente. En la tarjeta va
    # en blanco (ver `recolor` en el registro de logotipos).
    "chatgptmark": ("4d934fbb-image.png", [{"match": dark(150), "fill": "#000000"}], None),
    # Los dos iconos de aplicación que mandaste van completos —fondo incluido—
    # porque su gracia es el cuadro entero, no un símbolo recortado. En Duolingo
    # La capa del campo (`allpx()` en #77C801) ya no va: era un rectángulo que
    # cubría el viewBox entero y, pintado a sangre, es el recuadro que se veía
    # alrededor del búho. Ahora la ficha lleva ese mismo #77C801 de fondo plano,
    # así que el búho se apoya directo sobre él y no hay canto que ver.
    "duolingo": (
        "d8f5f655-image.jpg",
        [
            # Los dos verdes se distinguen mal por distancia de color —están a
            # 33 unidades— así que el corte va por el canal verde, que es donde
            # sí se separan limpio: 200 el fondo, 223 la cabeza.
            {
                "match": lambda a: (a[:, :, 1] >= 212) & (a[:, :, 2] < 90) & (a[:, :, 0] < 190),
                "fill": "#8FDF02",
            },
            {"match": light(215), "fill": "#FFFFFF"},
            {"match": near("#4B4B4B", 46), "fill": "#4B4B4B"},
            {"match": near("#FEC200", 58), "fill": "#FEC200"},
            {"match": near("#F38003", 58), "fill": "#F38003"},
            # El reflejo del pico es un amarillo más claro que no caía en
            # ninguna de las dos capas anteriores: quedaba un agujero y por él
            # se veía el verde de la cabeza, o sea un lunar verde en el pico.
            {"match": near("#FEE545", 50), "fill": "#FEE545"},
        ],
        None,
    ),
    # Aquí solo va la «p»: el fondo es un degradado continuo y eso no se traza,
    # va como fondo de la tarjeta con sus paradas muestreadas.
    "picsart": ("520bf64d-image.jpg", [{"match": light(215), "fill": "#FFFFFF"}], None),
    "tidal": ("aec23587-image.png", [{"match": light(180), "fill": "#FFFFFF"}], None),
    # Solo la cara de Clyde. El disco morado es el CAMPO, igual que el
    # rectángulo verde de Duolingo: si se traza, se le ve el canto sobre el
    # fondo de la ficha y parece una calcomanía pegada. Como el archivo es
    # transparente fuera del disco, se aplana sobre NEGRO para que el selector
    # de claros no se lleve también el exterior.
    #
    # Los ojos y la muesca de la boca son huecos recortados en la cara, no
    # formas moradas encima: potrace los devuelve como subtrazos invertidos y
    # por ahí se ve el fondo de la ficha.
    "discord": (
        "d3788097-image.webp",
        [{"match": light(200), "fill": "#FFFFFF"}],
        None,
        (0, 0, 0),
    ),
    "duolingoword": ("5cee19fe-image.png", [{"match": light(200), "fill": "#FFFFFF"}], (0.20, 0.62, 0.80, 0.92)),
    "duolingoowl": ("5cee19fe-image.png", [{"match": light(200), "fill": "#FFFFFF"}], (0.28, 0.10, 0.72, 0.60)),
    # El archivo anterior medía 196×110 px con la tinta en 125×37: trazos de seis
    # píxeles, de ahí las letras chuecas y los puntos deformes. Este viene a
    # 3334×1000 y en negro sobre blanco; la tinta se pinta en blanco porque va
    # sobre el azul de su ficha. Los siete puntos NO son iguales —seis grandes en
    # dos columnas de tres y el séptimo, a la derecha del renglón de en medio,
    # más chico—: trazados del archivo salen con su tamaño real.
    "mubi": ("8422d1ff-image.png", [{"match": dark(128), "fill": "#FFFFFF"}], None),
    "primevideo": ("0ef56604-image.png", [{"match": light(200), "fill": "#FFFFFF"}], None),
    "foxone": ("ac39b449-image.png", [{"match": light(180), "fill": "#FFFFFF"}], None),
    "vix": ("822a2472-image.png", [{"match": light(205), "fill": "#FFFFFF"}], None),
    # El wordmark completo con la estrella encima de la «i». Va todo al mismo
    # degradado —azul, morado y rosa— porque en el archivo es uno solo que
    # recorre la palabra entera, no un color por letra.
    "geminiword": (
        "419a15f7-image.png",
        [{"match": lambda a: a.mean(axis=2) < 225, "fill": "#GEMINI"}],
        None,
    ),
}


if __name__ == "__main__":
    import os

    os.makedirs(OUT, exist_ok=True)
    names = list(JOBS) if "--all" in sys.argv else sys.argv[1:]
    result = {}
    for n in names:
        file, layers, crop, *extra = JOBS[n]
        # Cuarto elemento opcional: el color sobre el que aplanar la
        # transparencia. Sin él, blanco, como los otros 44.
        fondo = extra[0] if extra else (255, 255, 255)
        try:
            r = trace(file, n, layers, crop=crop, fondo=fondo)
            result[n] = r
            print(f"  {n:18s} tinta {r['coverage'] * 100:5.1f}%  viewBox {r['viewBox']}")
        except Exception as e:  # noqa: BLE001
            print(f"  {n:16s} FALLÓ: {e}")
    with open(OUT + "traced.json", "w") as f:
        json.dump(result, f)
    print(f"\n→ {OUT}traced.json")
