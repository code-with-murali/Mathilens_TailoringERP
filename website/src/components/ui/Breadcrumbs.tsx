import Link from "next/link";
import type { Crumb } from "@/content/types";

/**
 * Breadcrumbs.
 *
 * Rendered as a real ordered list inside a labelled nav, because that is what assistive technology
 * expects and what Google reads for the breadcrumb display in search results. The matching
 * BreadcrumbList JSON-LD is emitted separately by the page, from the same `crumbs` array — one
 * source, so the two can never disagree.
 */
export function Breadcrumbs({ crumbs, tone = "dark" }: { crumbs: Crumb[]; tone?: "light" | "dark" }) {
  if (crumbs.length < 2) return null;

  const linkClass = tone === "dark" ? "text-ink-muted hover:text-gold-soft" : "text-muted hover:text-ink";
  const currentClass = tone === "dark" ? "text-cream" : "text-ink";

  return (
    <nav aria-label="Breadcrumb">
      <ol className="u-eyebrow flex flex-wrap items-center gap-x-3 gap-y-2">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-3">
              {isLast ? (
                <span className={currentClass} aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link href={crumb.path} className={`${linkClass} transition-colors`}>
                    {crumb.name}
                  </Link>
                  <span aria-hidden="true" className={tone === "dark" ? "text-ink-line" : "text-hair-strong"}>
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
