import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailGrid, RelatedLinks } from "@/components/blocks";
import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHero } from "@/components/PageHero";
import { CtaLink } from "@/components/ui/CtaLink";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/ui/JsonLd";
import { Plate } from "@/components/ui/Plate";
import { RichParagraph } from "@/components/ui/RichText";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bulkHowItWorks, bulkSegmentBySlug, bulkSegmentSlugs, bulkSegments } from "@/content/bulk";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return bulkSegmentSlugs.map((segment) => ({ segment }));
}

export const dynamicParams = false;

type Params = { params: Promise<{ segment: string }> };

export async function generateMetadata({ params }: Params) {
  const { segment: slug } = await params;
  const segment = bulkSegmentBySlug[slug];
  if (!segment) return {};
  return pageMetadata({
    title: segment.seoTitle,
    description: segment.seoDescription,
    path: segment.path,
  });
}

export default async function BulkSegmentPage({ params }: Params) {
  const { segment: slug } = await params;
  const segment = bulkSegmentBySlug[slug];
  if (!segment) notFound();

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Bulk orders", path: "/bulk-orders" },
    { name: segment.navLabel, path: segment.path },
  ];

  const siblings = bulkSegments
    .filter((item) => item.slug !== segment.slug)
    .map((item) => ({ label: item.navLabel, href: item.path }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          serviceSchema({
            name: segment.title,
            serviceType: "Uniform tailoring",
            description: segment.seoDescription,
            path: segment.path,
          }),
          faqSchema(segment.faqs),
        ]}
      />

      <PageHero eyebrow={segment.eyebrow} title={segment.title} lead={segment.lead} crumbs={crumbs}>
        <CtaLink href="#enquiry" variant="solid" tone="dark">
          Discuss this requirement
        </CtaLink>
      </PageHero>

      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-20">
            <div>
              {segment.sections.map((section, index) => (
                <div
                  key={section.heading}
                  data-reveal
                  className={index === 0 ? "" : "mt-16 border-t border-hair pt-14"}
                >
                  <h2 className="text-title text-ink">{section.heading}</h2>
                  {section.body.map((paragraph) => (
                    <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-6 text-lead text-muted" />
                  ))}
                </div>
              ))}
            </div>

            <aside data-reveal className="lg:sticky lg:top-32 lg:self-start">
              <Plate plate={segment.plate} ratio="landscape" sizes="(min-width: 1024px) 38vw, 92vw" />
              <div className="mt-8 border-t border-hair pt-6">
                <h2 className="u-eyebrow text-gold-deep">Garments in this category</h2>
                <ul className="mt-5 space-y-2.5">
                  {segment.garments.map((garment) => (
                    <li key={garment} className="flex gap-3 text-sm text-muted">
                      <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-gold" />
                      {garment}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="Before quantities"
              title="What we would settle first"
              lead="These are the questions that decide the garment. Quantity and deadline are easy once they are answered."
            />
          </div>
          <div className="mt-16">
            <DetailGrid details={segment.considerations} columns={3} />
          </div>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div data-reveal>
            <SectionHeading eyebrow="How it works" title="From brief to delivery" tone="dark" />
          </div>
          <div className="mt-16">
            <DetailGrid details={bulkHowItWorks} columns={3} tone="dark" />
          </div>
        </Container>
      </Section>

      <Section tone="cream" id="enquiry">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow="Enquire" title={`Discuss a ${segment.navLabel.toLowerCase()} order`} />
              <div className="mt-10">
                <FaqList faqs={segment.faqs} />
              </div>
              <div className="mt-14">
                <RelatedLinks
                  title="Other bulk categories"
                  links={[...siblings, { label: "Bulk orders overview", href: "/bulk-orders" }]}
                />
              </div>
            </div>

            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }} className="border-t-2 border-gold pt-10">
              <EnquiryForm kind="bulk" heading="Tell us about the requirement" />
              <p className="mt-8 text-sm text-muted">
                Prefer to read first? The{" "}
                <Link href="/journal/corporate-uniform-planning-guide" className="u-underline text-gold-deep">
                  uniform planning guide
                </Link>{" "}
                sets out the seven answers worth bringing to a first conversation.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
