import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink } from "@/components/ui/CtaLink";
import { Monogram } from "@/components/ui/Monogram";
import { footerGroups } from "@/content/navigation";

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 has no business in an index. `follow` stays on so the site links below are still
  // crawled — this page is mostly navigation, and that navigation is useful to a crawler too.
  robots: { index: false, follow: true },
};

/**
 * 404.
 *
 * A dead end is the worst place to leave someone who was looking for something specific, so this
 * page is mostly navigation: the full site index, laid out plainly, on the assumption that what
 * they wanted is one of these links.
 */
export default function NotFound() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink text-cream">
        <div className="u-weave absolute inset-0 text-cream opacity-70" aria-hidden="true" />
        <Monogram className="pointer-events-none absolute -right-16 top-8 h-[24rem] w-[24rem] text-cream opacity-[0.05]" />

        <div className="u-container relative pb-24 pt-40 lg:pb-32 lg:pt-48">
          <p className="u-eyebrow text-gold-soft">404</p>
          <h1 className="mt-6 max-w-3xl text-display text-cream">
            This page has been let out, taken in, or never cut at all.
          </h1>
          <div className="u-rule mt-9 w-28" aria-hidden="true" />
          <p className="mt-9 max-w-xl text-lead text-ink-muted">
            Whatever you were looking for is almost certainly one of the links below. If it is not,
            send us an enquiry and we will point you at it.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <CtaLink href="/" variant="solid" tone="dark">
              Back to the home page
            </CtaLink>
            <CtaLink href="/contact" variant="outline" tone="dark">
              Contact us
            </CtaLink>
          </div>
        </div>
      </section>

      <section className="bg-cream py-section">
        <div className="u-container">
          <nav aria-label="Site index" className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="u-eyebrow mb-6 text-gold-deep">{group.title}</h2>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} prefetch={false} className="u-underline text-ink">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
