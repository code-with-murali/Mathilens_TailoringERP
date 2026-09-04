import Image from "next/image";
import { DetailGrid, RelatedLinks, Testimonials } from "@/components/blocks";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { JsonLd } from "@/components/ui/JsonLd";
import { RichParagraph } from "@/components/ui/RichText";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { pillars } from "@/content/pillars";
import { brand } from "@/content/site";
import { aboutPage, arc, audience, craftsmanship, mannargudiStory } from "@/content/story";
import { testimonialsCopy } from "@/content/testimonials";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { asset } from "@/lib/asset";

const crumbs: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
];

export const metadata = pageMetadata({
  title: "About RADHA APPARELS",
  description:
    "A men's fabric and tailoring house in Mannargudi, Tamil Nadu. Custom suits, blazers, shirts, trousers and wedding wear, with measurements kept for repeat orders.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <PageHero
        eyebrow="The house"
        title={aboutPage.title}
        lead={aboutPage.lead}
        crumbs={crumbs}
      >
        <div className="flex flex-wrap gap-3">
          <CtaLink href="/services" variant="solid" tone="dark">
            What we make
          </CtaLink>
          <CtaLink href="/mannargudi" variant="outline" tone="dark">
            The Mannargudi story
            <Arrow />
          </CtaLink>
        </div>
      </PageHero>

      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-20">
            <div data-reveal className="lg:sticky lg:top-32 lg:self-start">
              <SectionHeading eyebrow="In brief" title="One shop, one workshop" />
              <p className="mt-8 font-display text-2xl leading-snug text-ink">{brand.statement}</p>
              <ul className="u-eyebrow mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-hair pt-6 text-muted">
                {arc.map((stage, index) => (
                  <li key={stage} className="flex items-center gap-3">
                    <span className={index === 0 ? "text-gold-deep" : undefined}>{stage}</span>
                    {index < arc.length - 1 ? (
                      <span aria-hidden="true" className="text-hair-strong">
                        &rarr;
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {aboutPage.sections.map((section, index) => (
                <div
                  key={section.heading}
                  data-reveal
                  className={index === 0 ? "" : "mt-14 border-t border-hair pt-12"}
                >
                  <h2 className="text-title text-ink">{section.heading}</h2>
                  {section.body.map((paragraph) => (
                    <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-6 text-lead text-muted" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div data-reveal>
              <SectionHeading
                eyebrow={craftsmanship.eyebrow}
                title={craftsmanship.title}
                tone="dark"
              />
              {craftsmanship.body.map((paragraph) => (
                <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-7 text-lead text-ink-muted" />
              ))}
              <div className="mt-12">
                <DetailGrid details={craftsmanship.marks} columns={2} tone="dark" />
              </div>
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              <Image
                src={asset("/images/monogram-on-shirting.webp")}
                alt="The navy R monogram embroidered on pale RADHA shirting, photographed close"
                width={532}
                height={320}
                sizes="(min-width: 1024px) 45vw, 92vw"
                className="w-full"
              />
              <Image
                src={asset("/images/shirt-monogram-detail.webp")}
                alt="A white RADHA shirt with a spread collar and the monogram embroidered on the patch pocket"
                width={869}
                height={981}
                sizes="(min-width: 1024px) 45vw, 92vw"
                className="mt-6 w-full"
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="cream">
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="Why RADHA"
              title="What you can hold us to"
              lead="Specific and checkable, rather than superlative. If it is on this list, it is something that actually happens when you order a garment here."
            />
          </div>
          <div className="mt-16">
            <DetailGrid details={pillars} columns={4} />
          </div>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow={audience.eyebrow} title={audience.title} lead={audience.lead} />
              {audience.body.map((paragraph) => (
                <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-7 text-muted" />
              ))}
            </div>
            <ul
              data-reveal
              style={{ ["--reveal-delay" as string]: "120ms" }}
              className="grid grid-cols-2 gap-x-8 gap-y-4 self-start lg:pt-20"
            >
              {audience.professions.map((profession) => (
                <li key={profession} className="border-b border-hair pb-3 font-display text-xl text-ink">
                  {profession}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="cream" divider>
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow={testimonialsCopy.eyebrow} title={testimonialsCopy.title} />
              <div className="mt-12">
                <Testimonials />
              </div>
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }} className="lg:pt-16">
              <blockquote className="border-l-2 border-gold pl-8">
                <p className="font-display text-3xl leading-tight text-ink sm:text-4xl">
                  {mannargudiStory.pull}
                </p>
              </blockquote>
              <div className="mt-14">
                <RelatedLinks
                  title="Read next"
                  links={[
                    { label: "The Mannargudi story", href: "/mannargudi" },
                    { label: "The delta region", href: "/delta-region" },
                    { label: "The tailoring process", href: "/process" },
                    { label: "The journal", href: "/journal" },
                  ]}
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
