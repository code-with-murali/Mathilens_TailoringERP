import Link from "next/link";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { Arrow } from "@/components/ui/CtaLink";
import { JsonLd } from "@/components/ui/JsonLd";
import { Container, Section } from "@/components/ui/Section";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { journalCategories, journalCopy, journalPosts } from "@/content/journal";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema } from "@/lib/schema";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

const crumbs: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Journal", path: "/journal" },
];

export const metadata = pageMetadata({
  title: "The Journal — Notes from the Workshop",
  description:
    "Men's style and tailoring guides from RADHA: how a blazer should fit, suit versus blazer, choosing suit fabric, and planning a corporate uniform.",
  path: "/journal",
});

export default function JournalPage() {
  const [lead, ...rest] = journalPosts;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          // An ItemList of the articles, so the index itself is legible to a crawler rather than
          // relying on it following nine links to discover the content.
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "RADHA APPARELS Journal",
            itemListElement: journalPosts.map((post, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/journal/${post.slug}`),
              name: post.title,
            })),
          },
        ]}
      />

      <PageHero
        eyebrow={journalCopy.eyebrow}
        title={journalCopy.title}
        lead={journalCopy.lead}
        crumbs={crumbs}
      >
        <ul className="flex flex-wrap gap-2">
          {journalCategories.map((category) => (
            <li key={category} className="u-eyebrow border border-ink-line px-4 py-2.5 text-ink-muted">
              {category}
            </li>
          ))}
        </ul>
      </PageHero>

      {/* The most recent article, given the room a lead article deserves. */}
      <Section tone="cream">
        <Container>
          <article data-reveal className="border-t-2 border-gold pt-10">
            <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div>
                <p className="u-eyebrow text-gold-deep">
                  Latest &nbsp;·&nbsp; {lead.category}
                </p>
                <h2 className="mt-6 text-display text-ink">
                  <TrackedLink
                    href={`/journal/${lead.slug}`}
                    event="journal_click"
                    params={{ article: lead.slug, source: "lead" }}
                    className="transition-colors hover:text-gold-deep"
                  >
                    {lead.title}
                  </TrackedLink>
                </h2>
              </div>
              <div className="lg:pt-12">
                <p className="text-lead text-muted">{lead.description}</p>
                <p className="u-eyebrow mt-6 text-muted">{lead.readingMinutes} min read</p>
                <Link
                  href={`/journal/${lead.slug}`}
                  className="u-eyebrow mt-8 inline-flex items-center gap-3 text-gold-deep transition-colors hover:text-ink"
                >
                  Read the article
                  <Arrow />
                </Link>
              </div>
            </div>
          </article>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container>
          <div data-reveal>
            <SectionHeading eyebrow="All articles" title="Everything in the journal" />
          </div>

          <div className="mt-14 border-t border-hair">
            {rest.map((post, index) => (
              <article
                key={post.slug}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${Math.min(index, 6) * 60}ms` }}
                className="group grid gap-x-12 gap-y-4 border-b border-hair py-9 lg:grid-cols-[10rem_minmax(0,1.2fr)_minmax(0,1fr)]"
              >
                <p className="u-eyebrow text-gold-deep">{post.category}</p>
                <h3 className="text-subtitle">
                  <TrackedLink
                    href={`/journal/${post.slug}`}
                    event="journal_click"
                    params={{ article: post.slug, source: "index" }}
                    className="text-ink transition-colors group-hover:text-gold-deep"
                  >
                    {post.title}
                  </TrackedLink>
                </h3>
                <div>
                  <p className="text-muted">{post.description}</p>
                  <p className="u-eyebrow mt-4 text-muted">{post.readingMinutes} min read</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <FinalCta note="Reading is a good start. Being measured is a better one — the shop in Mannargudi is where an order actually begins." />
    </>
  );
}
