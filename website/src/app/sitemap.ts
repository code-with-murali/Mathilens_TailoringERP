import type { MetadataRoute } from "next";
import { bulkSegments } from "@/content/bulk";
import { garments } from "@/content/garments";
import { journalPosts } from "@/content/journal";
import { legalPages } from "@/content/legal";
import { servicePages } from "@/content/services";
import { absoluteUrl } from "@/lib/seo";

/**
 * The sitemap, built from the same content modules the pages are.
 *
 * That is the point of generating it rather than maintaining a list: a page cannot be added to the
 * site and forgotten here, and a page cannot be listed here that does not exist. Both are common
 * and both are quietly damaging — a sitemap full of 404s is a crawl-budget problem.
 *
 * Priorities are relative and only meaningful against each other. Change frequencies are a hint,
 * not a promise, so they are set conservatively.
 *
 * `lastModified` is deliberately absent from the pages whose content has no date attached. Stamping
 * every URL with the build time tells a crawler the entire site changed today, every time anyone
 * deploys — which is untrue, and trains it to ignore the signal on the pages where it is true. The
 * journal and the legal documents carry real dates, so those are the only ones that carry it.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, changeFrequency: "monthly" },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" },
    { path: "/bulk-orders", priority: 0.9, changeFrequency: "monthly" },
    { path: "/fabrics", priority: 0.8, changeFrequency: "monthly" },
    { path: "/process", priority: 0.8, changeFrequency: "yearly" },
    { path: "/about", priority: 0.7, changeFrequency: "yearly" },
    { path: "/mannargudi", priority: 0.7, changeFrequency: "yearly" },
    { path: "/delta-region", priority: 0.6, changeFrequency: "yearly" },
    { path: "/journal", priority: 0.7, changeFrequency: "weekly" },
    { path: "/contact", priority: 0.9, changeFrequency: "yearly" },
    { path: "/shop", priority: 0.8, changeFrequency: "monthly" },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),

    ...garments.map((garment) => ({
      url: absoluteUrl(garment.path),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),

    ...servicePages.map((service) => ({
      url: absoluteUrl(service.path),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    ...bulkSegments.map((segment) => ({
      url: absoluteUrl(segment.path),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    ...journalPosts.map((post) => ({
      url: absoluteUrl(`/journal/${post.slug}`),
      lastModified: new Date(post.dateModified ?? post.datePublished),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),

    ...legalPages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: new Date(page.updated),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
