/**
 * Prefixes a path in `public/` with the deployment's base path.
 *
 * Next rewrites hrefs on `next/link` and the URLs it emits for `_next/*` itself, so most of a
 * sub-path deployment takes care of itself. Two things it does not rewrite:
 *
 *   - `next/image` `src` strings, because `images.unoptimized` bypasses the loader that would
 *     have added the prefix. Verified against a real sub-path build, not assumed.
 *   - `url()` inside an inline style, which it cannot see into.
 *
 * Both are silent failures — a 404 image and a mask that renders nothing — so every reference to
 * a file in `public/` goes through here instead of being written as a bare "/images/…".
 *
 * With no base path configured this returns the path unchanged, which is the normal case: a
 * custom domain serves from the root and needs no prefixing at all.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string) {
  return `${BASE}${path}`;
}
