import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * robots.txt.
 *
 * Everything on this site is meant to be found — there is no account area, no search results page
 * and no faceted navigation to keep crawlers out of. So the rule is a plain allow, plus a pointer
 * to the sitemap, and nothing clever.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${absoluteUrl("/").replace(/\/$/, "")}/sitemap.xml`,
  };
}
