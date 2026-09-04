import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedLinks } from "@/components/blocks";
import { ContentBlocks, headings } from "@/components/ContentBlocks";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { JsonLd } from "@/components/ui/JsonLd";
import { Container, Section } from "@/components/ui/Section";
import { TableOfContents } from "@/components/ui/TableOfContents";
import { journalBySlug, journalPosts, journalSlugs } from "@/content/journal";
import type { Block, Crumb } from "@/content/types";
import { articleSchema, breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return journalSlugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const post = journalBySlug[slug];
  if (!post) return {};
  return pageMetadata({
    title: post.seoTitle,
    description: post.description,
    path: `/journal/${post.slug}`,
  });
}

/** Word count for the Article schema, derived from the blocks rather than guessed. */
function countWords(body: Block[]) {
  const text = body
    .map((block) => ("items" in block ? block.items.join(" ") : block.text))
    .join(" ")
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1");
  return text.split(/\s+/).filter(Boolean).length;
}

export default async function JournalArticlePage({ params }: Params) {
  const { slug } = await params;
  const post = journalBySlug[slug];
  if (!post) notFound();

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Journal", path: "/journal" },
    { name: post.title, path: `/journal/${post.slug}` },
  ];

  // Explicit related articles where the author named them; otherwise the next most recent.
  const related = (
    post.related?.map((relatedSlug) => journalBySlug[relatedSlug]).filter(Boolean) ??
    journalPosts.filter((item) => item.slug !== post.slug).slice(0, 3)
  ).slice(0, 3);

  const published = new Date(post.datePublished).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          articleSchema({
            title: post.title,
            description: post.description,
            path: `/journal/${post.slug}`,
            datePublished: post.datePublished,
            dateModified: post.dateModified,
            section: post.category,
            wordCount: countWords(post.body),
            readingMinutes: post.readingMinutes,
          }),
        ]}
      />

      <PageHero eyebrow={post.category} title={post.title} lead={post.description} crumbs={crumbs}>
        <p className="u-eyebrow text-ink-muted">
          <time dateTime={post.datePublished}>{published}</time>
          <span aria-hidden="true"> &nbsp;·&nbsp; </span>
          {post.readingMinutes} min read
        </p>
      </PageHero>

      <Section tone="cream">
        <Container narrow>
          <div data-reveal className="mb-14">
            <TableOfContents items={headings(post.body)} />
          </div>

          <article data-reveal>
            <ContentBlocks body={post.body} />
          </article>

          <div className="mt-16 border-t border-hair pt-10">
            <p className="text-muted">
              Written at the RADHA workshop in Mannargudi.{" "}
              <Link href="/contact" className="u-underline text-gold-deep">
                Send us an enquiry
              </Link>{" "}
              or come in and be measured.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container narrow>
          <RelatedLinks
            title="Read next"
            links={related.map((item) => ({
              label: item.title,
              href: `/journal/${item.slug}`,
              note: `${item.readingMinutes} min`,
            }))}
          />
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
