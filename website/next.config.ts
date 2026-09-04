import type { NextConfig } from "next";

// The brand site has no server-side behaviour: every page is content, the only network call is
// the enquiry form posting to a configurable endpoint. Exporting to static HTML gives search
// engines a fully rendered document for every URL and removes the hosting layer entirely — the
// same choice the ERP app in ../web makes, for the same reasons.
//
// `next dev` is left un-exported so the journal's [slug] route can be opened by any slug during
// authoring rather than only the ones generateStaticParams() returns.
const isDevelopment = process.env.NODE_ENV === "development";

// Set when the site is served from a sub-path rather than a domain root — a GitHub project page
// at user.github.io/repo, for instance. Leave it empty for a custom domain, which is the normal
// case and the simpler one: with a root deployment nothing here has to be prefixed at all.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(isDevelopment ? {} : { output: "export" as const }),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  // A static export has no image optimisation server. The images in public/ are already sized
  // and encoded to WebP by scripts/build-assets.py, so next/image is used purely for its
  // layout reservation and lazy loading.
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
