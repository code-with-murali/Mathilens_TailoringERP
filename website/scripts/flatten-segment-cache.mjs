/**
 * Flattens Next's per-segment prefetch files so a plain static host can serve them.
 *
 * Next 16's router prefetches individual route segments, asking for a dot-joined filename:
 *
 *     GET /services/__next.services.__PAGE__.txt
 *
 * `output: "export"` writes those payloads as a *directory tree* instead:
 *
 *     out/services/__next.services/__PAGE__.txt
 *
 * On Vercel a routing layer bridges the two. On a static host there is nothing to bridge them, so
 * every one of those prefetches 404s — seven per page load on this site. Nothing breaks, because
 * the router falls back to the full payload, but each navigation pays for a wasted round trip and
 * the console fills with errors that will mask a real one later.
 *
 * This copies each file to the dot-joined name the router actually asks for, leaving the original
 * tree in place. It runs after `next build` (see the `build` script in package.json). If a future
 * Next release emits the flat names itself, this becomes a no-op and can be deleted.
 */
import { copyFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = new URL("../out/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/** Every file underneath a `__next.*` directory, with the directory it started from. */
function collect(dir, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith("__next.")) {
        walkSegment(full, full, results);
      } else {
        collect(full, results);
      }
    }
  }
  return results;
}

function walkSegment(root, dir, results) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkSegment(root, full, results);
    else results.push({ root, full });
  }
}

let copied = 0;
for (const { root, full } of collect(OUT)) {
  // out/services/__next.services/$d$service/__PAGE__.txt
  //   -> out/services/__next.services.$d$service.__PAGE__.txt
  const parent = root.slice(0, root.lastIndexOf(sep));
  const flat = join(parent, relative(parent, full).split(sep).join("."));
  if (flat === full) continue;
  try {
    if (statSync(flat).isFile()) continue;
  } catch {
    /* not there yet — that is the point */
  }
  copyFileSync(full, flat);
  copied += 1;
}

console.log(`flatten-segment-cache: wrote ${copied} segment prefetch file${copied === 1 ? "" : "s"}`);

// GitHub Pages runs Jekyll over the artifact unless told not to, and Jekyll silently drops every
// path beginning with an underscore — which here is `_next/` (all the CSS and JavaScript) and 179
// `__next.*` prefetch files. The result is a site that deploys successfully and renders as
// unstyled HTML. One empty file prevents it, and it is harmless on every other host.
writeFileSync(join(OUT, ".nojekyll"), "");
console.log("wrote .nojekyll (stops GitHub Pages running Jekyll over _next/)");
