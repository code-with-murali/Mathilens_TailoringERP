import { CategoryGrid, DetailGrid, ProcessList } from "@/components/blocks";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { JsonLd } from "@/components/ui/JsonLd";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bulkAudiences, bulkCategoryCard, bulkOverview } from "@/content/bulk";
import { garments } from "@/content/garments";
import { pillars } from "@/content/pillars";
import { processSteps } from "@/content/process";
import { servicePages } from "@/content/services";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema, serviceSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const crumbs: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Collections & services", path: "/services" },
];

export const metadata = pageMetadata({
  title: "Men's Tailoring Services & Collections",
  description:
    "Everything RADHA makes: custom suits, blazers, shirts, trousers, wedding wear and bulk uniform orders, tailored to measure at our Mannargudi shop.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          ...servicePages.map((service) =>
            serviceSchema({
              name: service.title,
              serviceType: service.serviceType,
              description: service.seoDescription,
              path: service.path,
            }),
          ),
        ]}
      />

      <PageHero
        eyebrow="Collections & services"
        title="Everything we make, and how"
        lead="Five garments, two services and one workshop. Whether it is a single shirt or four hundred uniforms, it follows the same seven steps and is cut in the same place."
        crumbs={crumbs}
      >
        <div className="flex flex-wrap gap-3">
          <CtaLink href="/contact" variant="solid" tone="dark">
            Start an enquiry
          </CtaLink>
          <CtaLink href="/process" variant="outline" tone="dark">
            The tailoring process
            <Arrow />
          </CtaLink>
        </div>
      </PageHero>

      <Section tone="cream">
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="The garments"
              title="Cut to your measurements"
              lead="Each of these begins the same way — with what the garment is for — and ends with a trial on your body before it is finished."
            />
          </div>
          <div className="mt-16">
            <CategoryGrid garments={garments} extra={[bulkCategoryCard]} />
          </div>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="The services"
              title="Two ways to describe the same craft"
              lead="Men's tailoring is the work. Custom clothing is what it produces. Both pages are worth reading if you have not had clothes made before."
            />
          </div>

          <div className="mt-16 grid gap-x-12 gap-y-14 lg:grid-cols-2">
            {servicePages.map((service, index) => (
              <article
                key={service.slug}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${index * 100}ms` }}
                className="border-t border-hair pt-8"
              >
                <p className="u-eyebrow text-gold-deep">{service.eyebrow}</p>
                <h3 className="mt-5 text-title text-ink">{service.title}</h3>
                <p className="mt-6 text-lead text-muted">{service.cardDescription}</p>
                <p className="mt-5 text-muted">{service.lead}</p>
                <div className="mt-8">
                  <CtaLink href={service.path} variant="outline">
                    {service.title}
                    <Arrow />
                  </CtaLink>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div data-reveal>
              <SectionHeading
                eyebrow={bulkOverview.eyebrow}
                title={bulkOverview.title}
                lead={bulkOverview.lead}
                tone="dark"
              />
              <div className="mt-10">
                <CtaLink href="/bulk-orders" variant="solid" tone="dark">
                  Discuss a bulk order
                </CtaLink>
              </div>
            </div>
            <ul
              data-reveal
              style={{ ["--reveal-delay" as string]: "120ms" }}
              className="flex flex-wrap content-start gap-3 self-start"
            >
              {bulkAudiences.map((organisation) => (
                <li key={organisation} className="u-eyebrow border border-ink-line px-4 py-2.5 text-ink-muted">
                  {organisation}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="cream">
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="The process"
              title="The same seven steps, every time"
              lead="A single shirt and a four-hundred-piece uniform order pass through the same sequence. Only the scale changes."
            />
          </div>
          <div className="mt-16">
            <ProcessList steps={processSteps} />
          </div>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container>
          <div data-reveal>
            <SectionHeading eyebrow="Why RADHA" title="What you can hold us to" />
          </div>
          <div className="mt-16">
            <DetailGrid details={pillars} columns={4} />
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
