import { CategoryGrid, RelatedLinks } from "@/components/blocks";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/ui/JsonLd";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { garments } from "@/content/garments";
import { deltaTowns, homeTown, regionCopy } from "@/content/region";
import { brand } from "@/content/site";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const crumbs: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Delta region", path: "/delta-region" },
];

export const metadata = pageMetadata({
  title: "Serving the Thanjavur Delta from Mannargudi",
  description:
    "RADHA APPARELS serves customers across the Thanjavur delta — Thiruvarur, Thiruthuraipoondi, Muthupet, Pattukottai, Kumbakonam and Thanjavur — from our one shop in Mannargudi.",
  path: "/delta-region",
});

/**
 * This page exists to answer a real question — "do you serve my town?" — not to farm town names.
 * It says the same true thing every time: one shop, in Mannargudi, and customers who travel.
 */
const faqs = [
  {
    question: "Do you have a shop in Thanjavur, Kumbakonam or Thiruvarur?",
    answer:
      "No. RADHA has one shop and it is in Mannargudi. Customers from those towns travel to us; we do not have premises there and will not claim to.",
  },
  {
    question: "Is it worth travelling from another delta town for tailoring?",
    answer:
      "That is your judgement to make, and it depends on what you are having made. A single shirt may not justify the journey; a suit, a wedding order or a uniform run generally does, because those need a proper consultation and a trial in person anyway.",
  },
  {
    question: "How many visits does an order need?",
    answer:
      "Typically two: one to choose cloth and be measured, and one for the trial before the garment is finished. If you are travelling in, tell us when you send the enquiry and we will plan the visit so it is worth the trip.",
  },
  {
    question: "Can a wedding party from another town be measured in one visit?",
    answer:
      "Yes, and it is the sensible way to do it. Each person is measured and recorded separately under their own name, so a group travelling in together can be handled in a single session and planned as one order.",
  },
];

export default function DeltaRegionPage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(faqs)]} />

      <PageHero
        eyebrow={regionCopy.eyebrow}
        title={regionCopy.title}
        lead={regionCopy.lead}
        crumbs={crumbs}
      >
        <div className="flex flex-wrap gap-3">
          <CtaLink href="/contact" variant="solid" tone="dark">
            Plan a visit
          </CtaLink>
          <CtaLink href="/mannargudi" variant="outline" tone="dark">
            The Mannargudi story
            <Arrow />
          </CtaLink>
        </div>
      </PageHero>

      <Section tone="cream">
        <Container>
          <div data-reveal className="max-w-3xl">
            <p className="text-lead text-muted">{regionCopy.clarification}</p>
          </div>

          <ul className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            <li data-reveal className="border-t-2 border-gold pt-7">
              <p className="u-eyebrow text-gold-deep">The shop</p>
              <h2 className="mt-4 font-display text-3xl text-ink">{homeTown.name}</h2>
              <p className="mt-4 text-muted">{homeTown.note}</p>
              <p className="mt-5 text-sm text-muted">
                {brand.city}, {brand.region}, {brand.country}
              </p>
            </li>

            {deltaTowns.map((town, index) => (
              <li
                key={town.name}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${Math.min(index, 5) * 70}ms` }}
                className="border-t border-hair pt-7"
              >
                <p className="u-eyebrow text-muted">Customers travel from</p>
                <h2 className="mt-4 font-display text-3xl text-ink">{town.name}</h2>
                <p className="mt-4 text-muted">{town.note}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="What they come for"
              title="The orders that make the journey worth it"
              lead="A consultation, a fabric decision and a trial all want to happen in person. These are the garments where that is genuinely worth a morning."
            />
          </div>
          <div className="mt-16">
            <CategoryGrid garments={garments} />
          </div>
        </Container>
      </Section>

      <Section tone="cream" divider>
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow="Questions" title="If you are travelling in" />
              <div className="mt-12">
                <RelatedLinks
                  title="Read next"
                  links={[
                    { label: "The tailoring process", href: "/process" },
                    { label: "Wedding & groom wear", href: "/wedding" },
                    { label: "Contact and directions", href: "/contact" },
                  ]}
                />
              </div>
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              <FaqList faqs={faqs} />
            </div>
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
