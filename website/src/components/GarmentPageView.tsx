import { DetailGrid, RelatedLinks } from "@/components/blocks";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/ui/JsonLd";
import { Plate } from "@/components/ui/Plate";
import { RichParagraph } from "@/components/ui/RichText";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { garmentBySlug } from "@/content/garments";
import type { Crumb, GarmentPage } from "@/content/types";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/schema";

/**
 * One layout for all five garment pages.
 *
 * They differ entirely in copy and not at all in structure, so the structure lives here and each
 * route supplies its `GarmentPage` object. Adding a sixth garment is a content change.
 */
export function GarmentPageView({ garment }: { garment: GarmentPage }) {
  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Collections", path: "/services" },
    { name: garment.navLabel, path: garment.path },
  ];

  const related = garment.related
    .map((slug) => garmentBySlug[slug])
    .filter(Boolean)
    .map((item) => ({ label: item.title, href: item.path }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          serviceSchema({
            name: garment.title,
            serviceType: garment.eyebrow,
            description: garment.seoDescription,
            path: garment.path,
          }),
          faqSchema(garment.faqs),
        ]}
      />

      <PageHero eyebrow={garment.eyebrow} title={garment.title} lead={garment.lead} crumbs={crumbs}>
        <div className="flex flex-wrap gap-3">
          <CtaLink href="/contact" variant="solid" tone="dark">
            Enquire about {garment.navLabel.toLowerCase()}
          </CtaLink>
          <CtaLink href="/process" variant="outline" tone="dark">
            How it is made
            <Arrow />
          </CtaLink>
        </div>
      </PageHero>

      {/* The written sections, with the plate or photograph running alongside them. */}
      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-20">
            <div>
              {garment.sections.map((section, index) => (
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

            <div data-reveal className="lg:sticky lg:top-32 lg:self-start">
              <Plate
                plate={garment.plate}
                image={garment.image}
                ratio="tall"
                priority
                sizes="(min-width: 1024px) 40vw, 92vw"
              />
              <div className="mt-8 border-t border-hair pt-6">
                <h2 className="u-eyebrow text-gold-deep">{garment.occasionsHeading}</h2>
                <ul className="mt-5 space-y-2.5">
                  {garment.occasions.map((occasion) => (
                    <li key={occasion} className="flex gap-3 text-sm text-muted">
                      <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-gold" />
                      {occasion}
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
              eyebrow="Customisation"
              title={garment.detailsHeading}
              lead="Every one of these is written onto the order before anything is cut. None of it is decided for you."
            />
          </div>
          <div className="mt-16">
            <DetailGrid details={garment.details} columns={4} />
          </div>
        </Container>
      </Section>

      <Section tone="cream" divider>
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow="Questions" title="Asked at the counter" level={2} />
              <div className="mt-10">
                <RelatedLinks title="Also worth reading" links={related} />
              </div>
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              <FaqList faqs={garment.faqs} />
            </div>
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
