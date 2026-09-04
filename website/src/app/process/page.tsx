import { DetailGrid, ProcessList, RelatedLinks } from "@/components/blocks";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/ui/JsonLd";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { digitalMeasurement, processFaqs, processSteps } from "@/content/process";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const crumbs: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "The tailoring process", path: "/process" },
];

export const metadata = pageMetadata({
  title: "The Tailoring Process — Seven Steps",
  description:
    "How custom tailoring works at RADHA in Mannargudi: consult, choose the cloth, measure, customise, tailor, trial and quality check, then deliver.",
  path: "/process",
});

export default function ProcessPage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(processFaqs)]} />

      <PageHero
        eyebrow="The process"
        title="Seven steps, and none of them skipped"
        lead="The same sequence for a single shirt and for four hundred uniforms. What changes with scale is the logistics, not the method."
        crumbs={crumbs}
      >
        <div className="flex flex-wrap gap-3">
          <CtaLink href="/contact" variant="solid" tone="dark">
            Start an enquiry
          </CtaLink>
          <CtaLink href="#digital-measurements" variant="outline" tone="dark">
            Digital measurements
            <Arrow />
          </CtaLink>
        </div>
      </PageHero>

      <Section tone="cream">
        <Container>
          {/* The step titles inside ProcessList are h3s, so the section needs its own h2 — without
              it the page jumps h1 to h3 and reads as a broken outline to a screen reader. */}
          <div data-reveal>
            <SectionHeading
              eyebrow="Step by step"
              title="From the first question to the finished garment"
              lead="Consult, choose the cloth, measure, customise, tailor, trial, deliver. What changes between a single shirt and a four-hundred-piece uniform run is the logistics, not the order."
            />
          </div>
          <div className="mt-16">
            <ProcessList steps={processSteps} />
          </div>
        </Container>
      </Section>

      <Section tone="ink" id="digital-measurements">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading
                eyebrow={digitalMeasurement.eyebrow}
                title={digitalMeasurement.title}
                lead={digitalMeasurement.lead}
                tone="dark"
              />
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              {digitalMeasurement.body.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="mt-6 text-ink-muted first:mt-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <DetailGrid details={digitalMeasurement.points} columns={4} tone="dark" />
          </div>

          <p data-reveal className="mt-14 max-w-2xl border-l-2 border-gold pl-6 text-sm text-ink-muted">
            {digitalMeasurement.caveat}
          </p>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow="Questions" title="Before your first visit" />
              <div className="mt-12">
                <RelatedLinks
                  title="Read next"
                  links={[
                    { label: "Men's tailoring", href: "/services/mens-tailoring" },
                    { label: "Custom clothing", href: "/services/custom-clothing" },
                    {
                      label: "How digital measurements help",
                      href: "/journal/how-digital-measurements-make-repeat-orders-easier",
                    },
                  ]}
                />
              </div>
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              <FaqList faqs={processFaqs} />
            </div>
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
