import Link from "next/link";
import { ContentBlocks } from "@/components/ContentBlocks";
import { PageHero } from "@/components/PageHero";
import { JsonLd } from "@/components/ui/JsonLd";
import { Container, Section } from "@/components/ui/Section";
import { legalPages, type LegalPage } from "@/content/legal";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema } from "@/lib/schema";

/**
 * One layout for the four legal documents.
 *
 * These pages are indexable — a policy nobody can find is not a policy — but they carry no call
 * to action beyond the links back into the site. A reader who arrives here wants an answer, not
 * a sales pitch.
 */
export function LegalPageView({ page }: { page: LegalPage }) {
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: page.title, path: page.path },
  ];

  const updated = new Date(page.updated).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <PageHero eyebrow="Legal" title={page.title} lead={page.lead} crumbs={crumbs}>
        <p className="u-eyebrow text-ink-muted">
          Last updated <time dateTime={page.updated}>{updated}</time>
        </p>
      </PageHero>

      <Section tone="cream">
        <Container narrow>
          <ContentBlocks body={page.body} />
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container narrow>
          <h2 className="u-eyebrow text-gold-deep">The other documents</h2>
          <ul className="mt-7 border-t border-hair">
            {legalPages
              .filter((item) => item.slug !== page.slug)
              .map((item) => (
                <li key={item.slug} className="border-b border-hair">
                  <Link
                    href={item.path}
                    className="block py-5 font-display text-xl text-ink transition-colors hover:text-gold-deep"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            <li className="border-b border-hair">
              <Link
                href="/contact"
                className="block py-5 font-display text-xl text-ink transition-colors hover:text-gold-deep"
              >
                Contact us
              </Link>
            </li>
          </ul>
        </Container>
      </Section>
    </>
  );
}
