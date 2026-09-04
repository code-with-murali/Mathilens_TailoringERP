"""Derive every image in public/ from the five official RADHA brand files.

Nothing here is drawn, traced or sourced from anywhere else: every output is a crop, an alpha key,
a colour swap or a resize of a supplied file. Run it after the brand assets change, or after RADHA
supplies real photography.

    python scripts/build-assets.py

It writes exactly the fifteen files the site references and nothing else — an unused asset in
public/ still ships to the CDN.

Requires Pillow. Takes a couple of minutes: the alpha keying is a per-pixel pass in pure Python,
which is slow and completely legible, and this runs once in a while rather than on every build.
"""

from PIL import Image, ImageChops
import os

SRC = r"E:\Mathilens\Client\Radha fabric\Final"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")

BRAND = os.path.join(OUT, "brand")
IMAGES = os.path.join(OUT, "images")
CREAM = (247, 243, 236)

# Panel boundaries measured from the ad creative: one vertical white gutter at x=869, two
# horizontal gutters in the right column at y=368 and y=690, and the icon strip under the left
# photograph beginning at y=982.
PHOTO = (0, 0, 869, 981)
LOCKUP = (870, 0, 1402, 367)
FABRIC = (870, 369, 1402, 689)
SWATCHES = {
    "white": (870, 691, 999, 1122),
    "light-blue": (1001, 691, 1132, 1122),
    "olive": (1134, 691, 1273, 1122),
    "navy": (1275, 691, 1402, 1122),
}


def note(path):
    print(f"  {os.path.relpath(path, OUT):44s} {os.path.getsize(path) // 1024:5d} KB")


def key_out(im, field, *, invert):
    """Remove a flat background from flat artwork.

    The logos are `alpha * art + (1 - alpha) * field` composites, which inverts exactly: alpha is
    how far a pixel has travelled from the field, and the drawn colour comes back by
    unpremultiplying. `invert` when the art is darker than the field.
    """
    im = im.convert("RGB")
    px = im.load()
    out = Image.new("RGBA", im.size)
    op = out.load()
    fr, fg, fb = field
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            a = (max(fr - r, fg - g, fb - b) if invert else max(r - fr, g - fg, b - fb)) / 255
            a = min(1.0, max(0.0, a))
            if a <= 0.004:
                op[x, y] = (0, 0, 0, 0)
                continue
            op[x, y] = (
                int(min(255, max(0, (r - fr * (1 - a)) / a))),
                int(min(255, max(0, (g - fg * (1 - a)) / a))),
                int(min(255, max(0, (b - fb * (1 - a)) / a))),
                int(round(a * 255)),
            )
    return out


def trim(im, pad_ratio=0.03):
    box = im.getbbox()
    im = im.crop(box) if box else im
    pad = round(max(im.size) * pad_ratio)
    canvas = Image.new(im.mode, (im.width + pad * 2, im.height + pad * 2),
                       (0, 0, 0, 0) if im.mode == "RGBA" else (255, 255, 255))
    canvas.paste(im, (pad, pad))
    return canvas


def fit(im, width):
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS) if im.width != width else im


def main():
    for d in (BRAND, IMAGES):
        os.makedirs(d, exist_ok=True)

    ad = Image.open(os.path.join(SRC, "Radha - Ad.png")).convert("RGB")

    # --- Photography, cut out of the four-panel creative -------------------------------------
    print("photography ->")
    for crop, name, width in (
        (PHOTO, "shirt-monogram-detail", 869),
        (FABRIC, "monogram-on-shirting", 532),
    ):
        p = os.path.join(IMAGES, name + ".webp")
        fit(ad.crop(crop), width).save(p, "WEBP", quality=84, method=6)
        note(p)

    for key, box in SWATCHES.items():
        p = os.path.join(IMAGES, f"shirting-{key}.webp")
        ad.crop(box).save(p, "WEBP", quality=84, method=6)
        note(p)

    strip = Image.new("RGB", (1402 - 870, 1122 - 691))
    x = 0
    for box in SWATCHES.values():
        piece = ad.crop(box)
        strip.paste(piece, (x, 0))
        x += piece.width
    p = os.path.join(IMAGES, "shirting-shades.webp")
    strip.save(p, "WEBP", quality=84, method=6)
    note(p)

    p = os.path.join(IMAGES, "monogram-embroidered.webp")
    Image.open(os.path.join(SRC, "icon - Stitch.png")).convert("RGB").resize((760, 760), Image.LANCZOS) \
        .save(p, "WEBP", quality=78, method=6)
    note(p)

    # --- Logos ---------------------------------------------------------------------------------
    print("logos ->")
    # The Organization schema needs a logo at a real URL, on a solid background. It is never
    # rendered on the site, only fetched by crawlers, so it is sized for that and no larger —
    # Google asks for at least 112px on the short edge.
    wordmark = trim(Image.open(os.path.join(SRC, "Logo.png")).convert("RGB"), 0.02)
    p = os.path.join(BRAND, "radha-wordmark.png")
    fit(wordmark, 600).save(p, "PNG", optimize=True)
    note(p)

    # The header and footer sit on ink and need the horizontal wordmark, which only exists
    # navy-on-white. The navy letterforms are repainted cream; the gold letterforms are left
    # exactly as drawn. It is a colourway RADHA already uses in the creative — proportions,
    # spacing and letterforms are untouched.
    for src_name, out_name, width in (
        ("Logo.png", "radha-wordmark-reversed", 300),
        ("Radha - Fabric and TAILORING.png", "radha-wordmark-tagline-reversed", 420),
    ):
        keyed = key_out(Image.open(os.path.join(SRC, src_name)), (255, 255, 255), invert=True)
        px = keyed.load()
        for y in range(keyed.height):
            for x in range(keyed.width):
                r, g, b, a = px[x, y]
                if a == 0 or r - b > 40:      # transparent, or gold: leave it
                    continue
                shade = 0.72 + 0.28 * (1 - (r + g + b) / 765)
                px[x, y] = (int(CREAM[0] * shade), int(CREAM[1] * shade), int(CREAM[2] * shade), a)
        p = os.path.join(BRAND, out_name + ".webp")
        fit(trim(keyed), width).save(p, "WEBP", quality=86, method=6)
        note(p)

    # --- The monogram, as a mask ----------------------------------------------------------------
    # The mark has to be gold on ink, navy on cream, and cream at five percent as a watermark. A
    # raster in one colour cannot do that and a redrawing would not be RADHA's mark. So the
    # artwork's coverage becomes an alpha channel and CSS paints currentColor through it. The
    # alpha is quantised because a mask has no visible banding and it cuts the file by 95%.
    print("monogram mask ->")
    icon = Image.open(os.path.join(SRC, "icon.png")).convert("RGB")
    px = icon.load()
    mask = Image.new("LA", icon.size)
    mp = mask.load()
    for y in range(icon.height):
        for x in range(icon.width):
            r, g, b = px[x, y]
            mp[x, y] = (255, max(255 - r, 255 - g, 255 - b))
    mask = mask.crop(mask.getbbox())
    side = max(mask.size)
    square = Image.new("LA", (side, side), (255, 0))
    square.paste(mask, ((side - mask.width) // 2, (side - mask.height) // 2))
    square = square.resize((768, 768), Image.LANCZOS)
    alpha = square.split()[-1].point(lambda v: (v // 8) * 8)
    p = os.path.join(BRAND, "radha-monogram-mask.png")
    Image.merge("LA", (Image.new("L", square.size, 255), alpha)).save(p, "PNG", optimize=True)
    note(p)

    # --- Favicon, app icon and social card ------------------------------------------------------
    print("icons and social card ->")
    lock = ad.crop(LOCKUP)
    lpx = lock.load()
    navy = lpx[6, 6]
    gx0, gy0, gx1, gy1 = lock.width, lock.height, 0, 0
    for y in range(round(lock.height * 0.52)):
        for x in range(lock.width):
            r, g, b = lpx[x, y]
            if r > 120 and 80 < g < 200 and b < 130 and r - b > 55:
                gx0, gy0 = min(gx0, x), min(gy0, y)
                gx1, gy1 = max(gx1, x), max(gy1, y)

    mono = lock.crop((gx0, gy0, gx1 + 1, gy1 + 1))
    side = round(max(mono.size) * 1.62)
    icon_sq = Image.new("RGB", (side, side), navy)
    icon_sq.paste(mono, ((side - mono.width) // 2, (side - mono.height) // 2))
    for size, name in ((512, "icon.png"), (180, "apple-icon.png")):
        p = os.path.join(OUT, name)
        icon_sq.resize((size, size), Image.LANCZOS).save(p, "PNG", optimize=True)
        note(p)

    og = Image.new("RGB", (1200, 630), navy)
    scaled = fit(lock, 940)
    og.paste(scaled, ((1200 - 940) // 2, (630 - scaled.height) // 2))
    p = os.path.join(IMAGES, "og-default.jpg")
    og.save(p, "JPEG", quality=88, optimize=True)
    note(p)

    total = sum(
        os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs
    )
    print(f"\npublic/ total: {total // 1024} KB")


if __name__ == "__main__":
    main()
