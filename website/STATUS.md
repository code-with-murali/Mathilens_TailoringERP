# RADHA APPARELS website — status

**Branch:** `website` (cut from `main`) · **Nothing committed.** The whole site is untracked; run
`git status` and you will see `website/` and the new workflow.

**Last updated:** 4 September 2026.

---

## TL;DR

The site is **built, audited and working**. It is not deployed, and it is not configured — those
are the two open items, and both need decisions only you can make.

- ✅ 37 content pages + 404, sitemap, robots, manifest. Build green, lint and typecheck clean.
- ✅ Audited: 0 axe violations, 0 broken links, clean sweep at five breakpoints.
- ✅ Re-verified after the hosting changes — see [Verification](#verification).
- ⛔ **Blocked on you:** where to host, and the real contact details.

---

## Run it

```bash
cd website
npm install
npm run dev            # http://localhost:3000
```

`npm run dev` shows a panel in the bottom-left listing every value RADHA has not supplied yet. It
never renders in a production build. That list is the launch checklist.

```bash
npm run build          # static export to ./out, then two post-build steps
npm run lint
npx tsc --noEmit
```

---

## Verification

Both sweeps were re-run against the export **including** the GitHub Pages changes, and both came
back clean:

```
CLEAN — no problems found
axe: 0 violations across all routes at 1440 and 390
```

Nothing is outstanding. Re-run them after any substantial change:

```bash
cd website
npm i --no-save puppeteer-core axe-core
npm run build
python scripts/qa/serve.py out 4322        # leave running

# another terminal
BASE=http://127.0.0.1:4322 node scripts/qa/sweep.mjs   # expect: CLEAN — no problems found
node scripts/qa/a11y.mjs                                # expect: axe: 0 violations
```

See [`scripts/qa/README.md`](scripts/qa/README.md). Audit the **built export**, never the dev
server — the dev server ships unminified React and different asset paths, and distorts both runs.

---

## Decisions needed from you

### 1. Where to host

The build is a plain static directory, so anything will serve it.

| Host | Private repo on free tier | Custom headers | Notes |
| --- | --- | --- | --- |
| **Azure Static Web Apps** *(recommended)* | Yes | Yes | `staticwebapp.config.json` is already written. The ERP already deploys here. |
| Cloudflare Pages / Netlify | Yes | Yes | Build `npm run build`, output `out`. |
| **GitHub Pages** | **No — see below** | **No** | Workflow is written and ready. |

**GitHub Pages is blocked right now.** This repository is **private** and the account
(`code-with-murali`) is on the **Free** plan; Pages does not publish from a private repo on Free.
It needs one of:

- a paid plan (GitHub Pro, about $4/month), or
- making this repository public — *not advisable*, it holds the ERP, the API and deploy configs, or
- a separate public repository containing only this site.

If you do go with Pages, everything is prepared:
[`.github/workflows/deploy-website-pages.yml`](../.github/workflows/deploy-website-pages.yml).
Enable Pages with **Source: GitHub Actions**, set the `SITE_URL` repository variable (the workflow
refuses to publish without it), and set `BASE_PATH` to `/Mathilens_TailoringERP` **only** if serving
from a project sub-path rather than a custom domain.

### 2. The values the site is waiting for

Every one of these is `null` today, and the component that would use it simply does not render —
no placeholder is ever shown to a visitor. Fill them in `.env.example` → `.env.local`, or in the
host's environment.

**Required before launch**

- `NEXT_PUBLIC_SITE_URL` — canonical URLs, OG tags and the sitemap are baked in at build time.
  Without it they all say `localhost`. This is the one that must not be missed.

**High value**

- `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_WHATSAPP` — call and WhatsApp buttons, and the mobile action bar
- `NEXT_PUBLIC_ENQUIRY_ENDPOINT` — where the enquiry forms post; without it they fall back to
  WhatsApp, then email, then disable themselves with an honest message
- `NEXT_PUBLIC_GA4_ID` — no analytics script loads and no event fires without it

**Then**

- `NEXT_PUBLIC_EMAIL`, `NEXT_PUBLIC_MAP_EMBED_URL`, `NEXT_PUBLIC_MAP_DIRECTIONS_URL`,
  `NEXT_PUBLIC_GOOGLE_BUSINESS_URL`, `NEXT_PUBLIC_JUSTDIAL_URL`,
  `NEXT_PUBLIC_INSTAGRAM_URL` / `FACEBOOK` / `YOUTUBE`, `NEXT_PUBLIC_STORE_URL`
- **Edited directly in [`src/content/site.ts`](src/content/site.ts)**, because they are structured
  rather than single strings: `contact.addressLines`, `contact.openingHours`, `contact.geo`

### 3. Have the legal pages read

[`src/content/legal.ts`](src/content/legal.ts) — privacy, terms, collection & delivery, alterations
& returns. They are accurate about what this website does and they say plainly that the terms of any
given order are agreed at the time of that order. They are **not** a substitute for whoever handles
RADHA's legal position reading them.

---

## What exists

**37 pages.** Home · about · services + men's-tailoring + custom-clothing · suits · blazers · shirts
· trousers · wedding · bulk-orders + corporate/schools/colleges/institutions · fabrics · process ·
mannargudi · delta-region · journal + 9 articles · contact · shop · 4 legal pages.

Next.js 16, React 19, Tailwind v4, TypeScript, static export. A **separate application** from the
ERP in [`../web`](../web) — same repo, same Next version, same lint config, nothing else shared.

**~24,200 words** of original copy, all of it typed data in [`src/content/`](src/content/) rather
than JSX, so a CMS or the ERP can supply the same objects later without a page changing.

**15 images, 479 KB total**, every one derived from your five brand files by
[`scripts/build-assets.py`](scripts/build-assets.py).

### The rule the whole codebase is built on

**Nothing claims anything RADHA has not confirmed.** No phone, address, hours, prices, minimum
quantities, turnaround times, years in business, customer counts, awards or testimonials. Where a
fact is missing the feature disappears rather than showing a placeholder.
[`src/content/testimonials.ts`](src/content/testimonials.ts) is an empty array on purpose and the
section renders an honest invitation instead. A regex sweep for *guarantee / award / years / price*
returns only **disclaimers** of those claims, never claims.

---

## Audit results

| Check | Result |
| --- | --- |
| axe-core, WCAG 2.0/2.1 A + AA + best-practice, 27 routes × 2 viewports | **0 violations** |
| Full sweep, 28 routes × 5 viewports (1440/1024/768/390/375) | **CLEAN** |
| Broken internal links (incl. all 23 hand-written in-copy links) | **0** |
| Orphan pages | only `/404` — correct |
| Duplicate titles / descriptions / canonicals | none |
| Keyboard: skip link, focus rings, drawer, Escape | pass |
| Unverifiable-claim scan | clean |

Seven defects were found and fixed during the audit: five WCAG contrast failures (gold used as text
on cream, against the codebase's own documented rule), a mobile CTA outside every landmark, a
dropdown left hanging open on keyboard focus, three analytics events declared but never fired, two
under-linked commercial articles, and four dead exports.

Also fixed earlier: **Next 16's static export writes segment-prefetch files into directories while
the router requests dot-joined names — 7 hard 404s on every page load.**
[`scripts/flatten-segment-cache.mjs`](scripts/flatten-segment-cache.mjs) fixes it as part of
`npm run build`.

---

## Known limitations

- **Five of six categories have no photography.** This is the highest-return thing you can add.
  Drop an `image` onto the object in [`src/content/garments.ts`](src/content/garments.ts) and every
  card, hero and grid switches from the typographic plate to the photograph, with no code change.
  See [`scripts/README.md`](scripts/README.md) for sizes and naming.
- **No Product schema** — there are no published prices or SKUs, and `Product` without offers is
  weak and risky. `Service` and `OfferCatalog` (11 services, no prices) are the correct choice until
  the store is live.
- **Journal publication dates** are editorial metadata I set. Adjust if you would rather they read
  differently.
- **GitHub Pages cannot serve custom headers**, so the security and cache headers in
  `staticwebapp.config.json` are silently ignored there. Another reason to prefer Azure.

---

## Where things are

```
website/
├── src/app/         routes — layout only, no copy
├── src/components/  layout, blocks, ui primitives
├── src/content/     every word on the site, as typed data
├── src/lib/         seo.ts (metadata) · schema.ts (JSON-LD) · analytics.ts · asset.ts
├── scripts/         build-assets.py · flatten-segment-cache.mjs · qa/
├── README.md        architecture, configuration, deployment
└── STATUS.md        this file
```

Start with [`README.md`](README.md) for how it fits together, and
[`src/content/site.ts`](src/content/site.ts) for what it is still waiting on.
