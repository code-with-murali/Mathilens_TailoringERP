import type { MetadataRoute } from "next";
import { brand } from "@/content/site";
import { asset } from "@/lib/asset";

/**
 * A web manifest, so a customer standing at the counter in Mannargudi can add the site to their
 * home screen and it appears as RADHA rather than as a browser tab. That is a real use case here:
 * shop customers are told to visit the website, and they are holding a phone when they are told.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} — ${brand.tagline}`,
    short_name: brand.shortName,
    description: `Premium men's custom clothing, tailored in ${brand.city}, ${brand.region}.`,
    start_url: asset("/"),
    display: "minimal-ui",
    background_color: "#101c2c",
    theme_color: "#101c2c",
    lang: "en-IN",
    icons: [
      { src: asset("/icon.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: asset("/apple-icon.png"), sizes: "180x180", type: "image/png" },
    ],
  };
}
