# QA tooling

Four scripts that audit the built site rather than the source. They found seven real defects that
typecheck, lint and a careful read had all missed — including a contrast rule the codebase
documented and then broke, and three GitHub Pages failures that would have shipped silently.

They drive the Chrome already installed on the machine, so there is no browser download. They are
deliberately **not** in `package.json`: CI does not need them, and `npm ci` should stay fast.

## Running them

```bash
# One-time, in website/
npm i --no-save puppeteer-core axe-core

# Build and serve the real artifact — always audit the export, never the dev server.
# The dev server ships an unminified React and different asset paths; both distort the result.
npm run build
python scripts/qa/serve.py out 4322      # threaded, no-cache, serves 404.html with a 404

# In another terminal:
BASE=http://127.0.0.1:4322 node scripts/qa/sweep.mjs     # ~12 min, 28 routes x 5 viewports
node scripts/qa/a11y.mjs                                  # ~8 min, axe-core, 27 routes x 2
node scripts/qa/keyboard.mjs                              # seconds
```

`CHROME` is hard-coded at the top of each `.mjs`; change it if Chrome is elsewhere.

## What each covers

**`sweep.mjs`** — every route at 1440/1024/768/390/375. Horizontal overflow (and which element
causes it), console errors, failed requests, HTTP status, one-`<h1>`-per-page, heading order,
title and description presence and length, canonical presence, `alt` on every image, links with no
accessible name, and unparseable JSON-LD. Prints `CLEAN` or a grouped report.

`ONLY=/suits,/contact` limits the routes. `SHOT_ALL=1 FULL=1` writes full-page screenshots.

**`a11y.mjs`** — axe-core against WCAG 2.0/2.1 A and AA plus best-practice, at 1440 and 390,
scrolled to the bottom first so lazy content is present. Groups violations by rule and viewport
with an example node.

**`keyboard.mjs`** — tab order from a cold load with a focus-ring check on each stop, the mobile
drawer's `aria-expanded` / visibility / body-scroll-lock through open and Escape, and that the
skip link is the first stop and becomes visible when focused.

**`serve.py`** — a static server that behaves like the real host. Python's stock `http.server` is
single-threaded and caches hard, so it aborts the dozens of concurrent prefetches a Next page fires
and answers repeats with 304 — both of which look exactly like site defects and are neither. This
one is threaded, sends a short cache (`no-store` makes the Next router re-request forever and the
page never reaches network idle), and serves `404.html` with a real 404.

## Two traps worth remembering

Measure **bytes from `response.buffer()`, not `content-length`** — mixing them double-counts and
made prefetch look like 2 MB when it was 115 KB.

`net::ERR_ABORTED` on prefetch URLs is the harness, not the site: closing the page cancels requests
still in flight. `sweep.mjs` filters it.
