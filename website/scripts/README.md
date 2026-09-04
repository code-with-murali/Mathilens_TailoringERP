# Asset pipeline

Every image in `public/` is derived from the five official brand files by one script. Nothing in
the site's imagery is drawn, traced or sourced from anywhere else.

```bash
python scripts/build-assets.py      # requires Pillow; takes a couple of minutes
```

It writes exactly the fifteen files the site references — around 770 KB in total — and nothing
else. An unused asset in `public/` still ships to the CDN, so the script is the definition of what
belongs there.

## The sources

```
E:\Mathilens\Client\Radha fabric\Final
├── Logo.png                            1774x887  wordmark, navy + gold on white
├── Radha - Fabric and TAILORING.png    1774x887  wordmark with the tagline rule
├── icon.png                            1254x1254 the R monogram, navy on white
├── icon - Stitch.png                   1254x1254 the monogram embroidered on cream cloth
└── Radha - Ad.png                      1402x1122 four-panel creative
```

The path is at the top of the script. Change it there if the brand folder moves.

## What it does, and why

**Cuts the ad creative into its panels.** The creative is a four-panel composition separated by
white gutters — one vertical at x=869, two horizontal in the right column at y=368 and y=690. Cut
apart, it yields four usable images instead of one poster: the shirt photograph, the gold-on-navy
lockup, the embroidery detail, and the four colour swatches.

**Alpha-keys the logos.** They are flat artwork over a solid field, which is the case alpha keying
inverts exactly: alpha is how far a pixel has travelled from the field, and the drawn colour comes
back by unpremultiplying. No repainting, no tracing.

**Reverses the wordmark for dark surfaces.** The header and footer sit on ink and need the
*horizontal* wordmark, which only exists navy-on-white. The navy letterforms are repainted cream
and the gold letterforms are left exactly as drawn — a colourway RADHA already uses in the
creative. Proportions, spacing and letterforms are untouched.

**Turns the monogram into a CSS mask.** The mark has to appear gold on ink, navy on cream, and at
five percent opacity as a full-bleed watermark. A raster in one colour cannot do that, and
redrawing it would not be RADHA's mark. So the artwork's coverage becomes an alpha channel and CSS
paints `currentColor` through it — one 10 KB file, any colour, crisp at any size. See
[`src/components/ui/Monogram.tsx`](../src/components/ui/Monogram.tsx).

**Composes the favicon and the social card** from the gold-on-navy lockup panel.

## When real photography arrives

The site absorbs it without a component change. Add an `image` to the relevant object in
[`src/content/garments.ts`](../src/content/garments.ts) — or to `items` in
[`src/content/fabrics.ts`](../src/content/fabrics.ts) — and every card, hero and grid that renders
that object switches from the typographic plate to the photograph. See the note in
[`src/components/ui/Plate.tsx`](../src/components/ui/Plate.tsx).

Encode new photography to WebP at roughly 1200px on the long edge, quality 82–86, and give it a
filename that describes the garment: `custom-navy-suit-two-piece.webp`, not `IMG_4471.webp`. Write
alt text that describes the garment to someone who cannot see it, not a list of keywords.
