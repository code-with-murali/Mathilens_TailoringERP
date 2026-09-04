# RADHA APPARELS — brand website

The public brand site for RADHA APPARELS, *Fabric & Tailoring*, Mannargudi, Tamil Nadu.

This is a separate application from the ERP in [`../web`](../web). They share a repository, a
Next.js version and a lint configuration, and nothing else: different audience, different domain,
different deployment. The ERP is an authenticated tool for the shop; this is a public, SEO-first
brand destination for customers.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to ./out
npm run lint
```

`next build` writes a fully static site to `out/` — every route is real HTML, no server required.

---

## The one rule this codebase is built around

**Nothing on this site claims anything RADHA has not confirmed.**

There are no invented phone numbers, addresses, opening hours, prices, minimum order quantities,
turnaround times, years in business, customer counts, awards or testimonials anywhere in it. Where
a fact is missing, the value is `null` in [`src/content/site.ts`](src/content/site.ts) and the
component that would have used it **does not render** — a missing phone number removes the call
button rather than printing a placeholder at a visitor.

Two consequences worth knowing before you edit anything:

- Running `npm run dev` shows a checklist in the bottom-left corner of every unset value and what
  it disables. It never renders in a production build.
- The site is *deliberately* missing conversion paths until it is configured. See
  **[Configuration](#configuration)** below — that list is the launch checklist.

---

## Configuration

Copy `.env.example` to `.env.local` and fill in what RADHA confirms. Everything is optional at
build time; each unset value removes its feature rather than breaking the build.

| Variable | What it turns on | Priority |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, Open Graph tags, sitemap, structured data | **Required before launch** |
| `NEXT_PUBLIC_PHONE` | Call buttons, mobile action bar, `telephone` in LocalBusiness | High |
| `NEXT_PUBLIC_WHATSAPP` | WhatsApp buttons, mobile action bar, enquiry-form fallback | High |
| `NEXT_PUBLIC_EMAIL` | Email links, second enquiry fallback | Medium |
| `NEXT_PUBLIC_ENQUIRY_ENDPOINT` | Enquiry forms POST here instead of falling back to WhatsApp | High |
| `NEXT_PUBLIC_MAP_EMBED_URL` | The map on `/contact` | Medium |
| `NEXT_PUBLIC_MAP_DIRECTIONS_URL` | "Get directions" buttons, `hasMap` in structured data | Medium |
| `NEXT_PUBLIC_GOOGLE_BUSINESS_URL` | Google Business Profile link, `sameAs` | Medium |
| `NEXT_PUBLIC_JUSTDIAL_URL` | Justdial listing link, `sameAs` | Low |
| `NEXT_PUBLIC_INSTAGRAM_URL` / `FACEBOOK` / `YOUTUBE` | Social links in footer and `/contact`, `sameAs` | Medium |
| `NEXT_PUBLIC_STORE_URL` | Turns every "Shop online" link into the real store and changes `/shop` from "coming" to "live" | Medium |
| `NEXT_PUBLIC_GA4_ID` | Loads GA4 and enables every conversion event. **No analytics script loads without it.** | High |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console meta-tag verification (skip if verifying by DNS) | Low |

Three values are structured rather than strings and are edited directly in
[`src/content/site.ts`](src/content/site.ts):

- `contact.addressLines` — the shop's street address
- `contact.openingHours` — e.g. `["Mon–Sat 10:00–20:00"]`
- `contact.geo` — `{ latitude, longitude }`, for `GeoCoordinates` in LocalBusiness

**Also before launch:** have the four documents in [`src/content/legal.ts`](src/content/legal.ts)
reviewed by whoever is responsible for RADHA's legal position. They are written to be accurate and
safe, and they say plainly that the terms of a given order are agreed at the time of that order —
but they are not a substitute for that review.

---

## Architecture

```
src/
├── app/            Routes. Each page lays out content; none of them contain copy.
├── components/     Layout, blocks and primitives.
│   └── ui/         Section, SectionHeading, CtaLink, Plate, Monogram, FaqList, Breadcrumbs, JsonLd
├── content/        Every word on the site, as typed data.
└── lib/            seo.ts (metadata), schema.ts (JSON-LD), analytics.ts (events)
```

### Content is data, not JSX

All copy lives in `src/content/` as typed objects. A page's job is to lay one out. This is what
makes a later CMS or ERP integration a matter of replacing a module rather than rewriting pages,
and it is why the same garment description appears identically on the home page, `/services`,
`/shop` and the garment page itself — it is one string.

| Module | Contains |
| --- | --- |
| `site.ts` | Brand facts and every configuration placeholder |
| `navigation.ts` | Header and footer navigation |
| `garments.ts` | Suits, blazers, shirts, trousers, wedding — copy, details, occasions, FAQs |
| `services.ts` | `/services/mens-tailoring`, `/services/custom-clothing` |
| `bulk.ts` | Bulk overview and the four B2B segments |
| `fabrics.ts` | Fabric families. `items: []` is where real fabric records go |
| `process.ts` | The seven steps, and the digital-measurement section |
| `pillars.ts` | "Why RADHA" |
| `region.ts` | Mannargudi and the delta towns |
| `story.ts` | Brand narrative used on the home page, `/about`, `/mannargudi` |
| `journal/` | One file per article, collected in `journal/index.ts` |
| `testimonials.ts` | **Empty on purpose.** Push verified, permissioned quotes here |
| `legal.ts` | The four legal documents |

### Imagery

There is exactly one photographic subject in the supplied brand assets — the monogrammed shirt. So
categories without a photograph get a **plate**: a woven navy or cream panel carrying the monogram
and the category name in the display serif. It is designed to look deliberate rather than empty,
and it is honest, which stock photography of somebody else's tailoring would not be.

Adding an `image` to a content object replaces the plate everywhere that object is rendered, with
no component change. See [`scripts/README.md`](scripts/README.md) for the asset pipeline and for
what to do when real photography arrives.

### Design system

Three surfaces do all the work — cream to read on, white for plates and photography, ink for the
moments that should feel like the inside of a jacket. Gold is a hairline and a mark, never a fill.
Every token is in [`src/app/globals.css`](src/app/globals.css); a section changes the surface it
sits on rather than inventing its own colour.

Contrast is checked, not assumed: body 12.1:1 on cream, muted 5.5:1, `gold-deep` 5.0:1, and on ink
cream 15.5:1, `gold-soft` 9.2:1, `ink-muted` 8.2:1. `gold` itself is 2.7:1 on cream — it is a rule
and a mark colour there, never text.

---

## SEO

- Every page's `<head>` is built by `pageMetadata()` in [`src/lib/seo.ts`](src/lib/seo.ts), so no
  page can ship without a canonical URL, a description or a social card.
- `sitemap.ts` and `robots.ts` are generated from the same content modules the pages are — a page
  cannot be added and forgotten, and cannot be listed here without existing.
- Structured data is built by typed builders in [`src/lib/schema.ts`](src/lib/schema.ts):
  `ClothingStore` (a LocalBusiness subtype), `WebSite`, `BreadcrumbList`, `Service`, `FAQPage`,
  `Article`, `ItemList`, `OnlineStore`. **A property is emitted only when the fact behind it is
  configured** — a wrong phone number in a knowledge panel is worse than no phone number.
- No `SearchAction`: the site has no search endpoint, and claiming one produces a broken sitelinks
  search box.
- Breadcrumbs are rendered as a real `<ol>` *and* as `BreadcrumbList`, from one `crumbs` array, so
  the two cannot disagree.

## Analytics

Every event the site can send is a closed union in [`src/lib/analytics.ts`](src/lib/analytics.ts),
which doubles as the specification for configuring GA4 key events:

`whatsapp_click`, `phone_click`, `email_click`, `directions_click`, `map_click`, `store_click`,
`enquiry_start`, `enquiry_submit`, `enquiry_error`, `bulk_enquiry_submit`, `category_click`,
`journal_click`, `social_click`, `nav_click`.

Recommended GA4 key events: `enquiry_submit`, `bulk_enquiry_submit`, `whatsapp_click`,
`phone_click`, `store_click`, `directions_click`.

Nothing fires and no third-party script loads unless `NEXT_PUBLIC_GA4_ID` is set.

## Accessibility and performance

Semantic landmarks, a skip link, one `<h1>` per page with a checked heading order, a visible gold
focus ring throughout, `<details>`-based FAQs that work without JavaScript, alt text on every
image, and `prefers-reduced-motion` honoured in both CSS and the reveal script — which also
reveals everything immediately if it never runs, so content can never be hidden by a broken effect.

Client JavaScript is limited to the header, the enquiry form, the CTA click handlers and a single
IntersectionObserver. Everything else is a server component. Images are pre-encoded to WebP and
served through `next/image` with `unoptimized: true` for layout reservation and lazy loading.

## Deployment

The build produces a plain static directory, so any static host will serve it. Set
`NEXT_PUBLIC_SITE_URL` in the deployment environment **before building** — canonical URLs, the
sitemap and the social cards are baked in at build time, and without it they all point at
`localhost`.

### Azure Static Web Apps (recommended)

`staticwebapp.config.json` is already set up: trailing slashes, a real 404, immutable caching on
`/_next/static/*`, and security headers. Deploy `out/` as the artifact. The repository already
uses Azure for the ERP app, and the free tier publishes from a private repository.

### GitHub Pages

[`.github/workflows/deploy-website-pages.yml`](../.github/workflows/deploy-website-pages.yml)
builds and publishes the site. Enable Pages with **Source: GitHub Actions**, then set the
`SITE_URL` repository variable (the workflow refuses to publish without it) and any of the contact
variables listed in that file.

**Check this first:** GitHub Pages does not publish from a *private* repository on the Free plan.
This repository is private, so Pages needs either a paid plan, a public repository, or a separate
public repository holding just this site.

Three things about Pages are handled in the build and are worth knowing about, because each fails
silently:

- **`.nojekyll`.** Pages runs Jekyll over the artifact, and Jekyll deletes every path starting with
  an underscore — here that is `_next/` (all the CSS and JavaScript) plus 179 `__next.*` prefetch
  files. The site would deploy successfully and render as unstyled HTML. The build writes the file;
  see [scripts/flatten-segment-cache.mjs](scripts/flatten-segment-cache.mjs).
- **Sub-path serving.** A project page lives at `user.github.io/repo`, not at a domain root. Set the
  `BASE_PATH` variable to `/<repo-name>` and everything is prefixed correctly — including the two
  things Next does *not* prefix by itself, which are `next/image` `src` strings (because
  `images.unoptimized` bypasses the loader) and the `url()` in the monogram's inline mask style.
  Both go through [`asset()`](src/lib/asset.ts). A custom domain needs none of this.
- **No custom headers.** Pages cannot serve the security or cache headers in
  `staticwebapp.config.json`; they are silently ignored. Its own caching is reasonable, but if
  those headers matter, use a host that supports them.

### Anywhere else

Cloudflare Pages, Netlify and Vercel all publish `out/` from a private repository on their free
tiers and support custom headers. Build command `npm run build`, output directory `out`.
