import Link from "next/link";
import { DetailGrid } from "@/components/blocks";
import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHero } from "@/components/PageHero";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/ui/JsonLd";
import { Plate } from "@/components/ui/Plate";
import { RichParagraph } from "@/components/ui/RichText";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  bulkAudiences,
  bulkFaqs,
  bulkGarments,
  bulkHowItWorks,
  bulkOverview,
  bulkSegments,
} from "@/content/bulk";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const crumbs: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Bulk orders", path: "/bulk-orders" },
];

export const metadata = pageMetadata({
  title: bulkOverview.seoTitle,
  description: bulkOverview.seoDescription,
  path: "/bulk-orders",
});

export default function BulkOrdersPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          serviceSchema({
            name: "Bulk clothing and uniform tailoring",
            serviceType: "Uniform and bulk clothing manufacturing",
            description: bulkOverview.seoDescription,
            path: "/bulk-orders",
          }),
          faqSchema(bulkFaqs),
        ]}
      />

      <PageHero
        eyebrow={bulkOverview.eyebrow}
        title={bulkOverview.title}
        lead={bulkOverview.lead}
        crumbs={crumbs}
      >
        <div className="flex flex-wrap gap-3">
          <CtaLink href="#bulk-enquiry" variant="solid" tone="dark">
            Discuss your bulk requirement
          </CtaLink>
          <CtaLink href="/journal/corporate-uniform-planning-guide" variant="outline" tone="dark">
            Read the planning guide
            <Arrow />
          </CtaLink>
        </div>
      </PageHero>

      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow="The work" title="A uniform is a specification problem" />
              <ul className="mt-10 flex flex-wrap gap-3">
                {bulkAudiences.map((organisation) => (
                  <li key={organisation} className="u-eyebrow border border-hair-strong px-4 py-2.5 text-muted">
                    {organisation}
                  </li>
                ))}
              </ul>
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              {bulkOverview.body.map((paragraph) => (
                <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-6 text-lead text-muted first:mt-0" />
              ))}
              <div className="mt-10 border-t border-hair pt-8">
                <h2 className="u-eyebrow text-gold-deep">What we make in volume</h2>
                <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {bulkGarments.map((garment) => (
                    <li key={garment} className="flex gap-3 text-muted">
                      <span aria-hidden="true" className="mt-3 h-px w-3 shrink-0 bg-gold" />
                      {garment}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="Who we make for"
              title="Four kinds of bulk order"
              lead="Each has its own page, because the questions that decide the garment are genuinely different in an office, a school, a campus and a hospital."
            />
          </div>

          <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {bulkSegments.map((segment, index) => (
              <article
                key={segment.slug}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${index * 80}ms` }}
                className="group"
              >
                <Link href={segment.path} className="block">
                  <Plate plate={segment.plate} ratio="square" sizes="(min-width: 1024px) 22vw, 45vw" />
                  <h3 className="mt-6 text-subtitle text-ink">{segment.navLabel}</h3>
                  <p className="mt-3 text-sm text-muted">{segment.cardDescription}</p>
                  <span className="u-eyebrow mt-5 inline-flex items-center gap-3 text-gold-deep transition-colors group-hover:text-ink">
                    Read more
                    <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="How it works"
              title="Brief, specification, sample, run"
              lead="The sample and the written specification are what make the fortieth garment match the first — and next year's top-up run match both."
              tone="dark"
            />
          </div>
          <div className="mt-16">
            <DetailGrid details={bulkHowItWorks} columns={3} tone="dark" />
          </div>
        </Container>
      </Section>

      <Section tone="cream" id="bulk-enquiry">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading
                eyebrow="Enquire"
                title={bulkOverview.ctaTitle}
                lead={bulkOverview.ctaBody}
              />
              <div className="mt-12">
                <FaqList faqs={bulkFaqs} />
              </div>
            </div>

            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }} className="border-t-2 border-gold pt-10">
              <EnquiryForm kind="bulk" heading="Tell us about the requirement" />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
