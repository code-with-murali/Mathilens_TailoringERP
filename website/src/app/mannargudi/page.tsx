import Image from "next/image";
import { RelatedLinks } from "@/components/blocks";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { JsonLd } from "@/components/ui/JsonLd";
import { Monogram } from "@/components/ui/Monogram";
import { RichParagraph } from "@/components/ui/RichText";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { deltaTowns } from "@/content/region";
import { brand } from "@/content/site";
import { arc, mannargudiStory, worldwide } from "@/content/story";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { asset } from "@/lib/asset";

const crumbs: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Mannargudi", path: "/mannargudi" },
];

export const metadata = pageMetadata({
  title: "Men's Tailoring in Mannargudi — Our Shop",
  description:
    "RADHA APPARELS is based in Mannargudi, Tamil Nadu. Fabric selection, measurement, tailoring, trial and finishing all happen at our one shop there.",
  path: "/mannargudi",
});

/**
 * Genuinely answerable questions about the location. Nothing here states an address, a phone
 * number or opening hours, because none has been confirmed — the /contact page is where those
 * appear once they exist.
 */
const faqs = [
  {
    question: "Where is RADHA APPARELS located?",
    answer:
      "In Mannargudi, Tamil Nadu. It is our only shop, and it is where fabric selection, measurement, cutting, tailoring, trial and finishing all take place.",
  },
  {
    question: "Does RADHA have branches in other towns?",
    answer:
      "No. There is one shop, in Mannargudi. Customers travel to us from across the delta — Thiruvarur, Thiruthuraipoondi, Muthupet, Pattukottai, Kumbakonam and Thanjavur among them — but we do not have premises in those towns and would not say otherwise.",
  },
  {
    question: "Is the tailoring done in Mannargudi?",
    answer:
      "Yes, all of it. The garment you order is cut and made at our Mannargudi workshop, and fitted on you there before it is finished.",
  },
  {
    question: "Can I order from outside Mannargudi?",
    answer:
      "Measurements are taken in person at the shop. If you are elsewhere, send an enquiry describing what you need and we will tell you honestly what is practical — and a separate online store is being built to make discovering and ordering easier from further away.",
  },
];

export default function MannargudiPage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(faqs)]} />

      <PageHero
        eyebrow={mannargudiStory.eyebrow}
        title={mannargudiStory.title}
        lead={mannargudiStory.lead}
        crumbs={crumbs}
      >
        <div className="flex flex-wrap gap-3">
          <CtaLink href="/contact" variant="solid" tone="dark">
            Visit the shop
          </CtaLink>
          <CtaLink href="/delta-region" variant="outline" tone="dark">
            The delta region
            <Arrow />
          </CtaLink>
        </div>
      </PageHero>

      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-20">
            <div data-reveal>
              {mannargudiStory.body.map((paragraph) => (
                <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-7 text-lead text-muted first:mt-0" />
              ))}
            </div>

            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              <blockquote className="border-l-2 border-gold pl-8">
                <p className="font-display text-3xl leading-tight text-ink sm:text-4xl">
                  {mannargudiStory.pull}
                </p>
              </blockquote>
              <div className="mt-12">
                <Image
                  src={asset("/images/monogram-embroidered.webp")}
                  alt="The RADHA monogram embroidered in olive thread on cream shirting"
                  width={760}
                  height={760}
                  sizes="(min-width: 1024px) 40vw, 92vw"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* The arc, given a page of its own weight here rather than a line on the home page. */}
      <Section tone="ink">
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="The direction"
              title="Outward from here, not away from here"
              lead="Growing brands have a habit of quietly dropping the small town from the story. We are doing the opposite, and we think it is the better story."
              tone="dark"
            />
          </div>

          <ol className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {arc.map((stage, index) => (
              <li
                key={stage}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${index * 90}ms` }}
                className="border-t border-ink-line pt-6"
              >
                <span className="font-display text-4xl text-gold-soft/70" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3 className="mt-4 font-display text-2xl text-cream">{stage}</h3>
                <p className="mt-3 text-sm text-ink-muted">
                  {
                    [
                      "The shop, the counter, the workshop. Everything is made here.",
                      "The towns our customers already travel from for suiting and wedding orders.",
                      "Reachable by enquiry today, and by the online store as it comes.",
                      "The market. Not the address — that stays exactly where it is.",
                    ][index]
                  }
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading
                eyebrow="Who comes to us"
                title={`${brand.city}, and the towns around it`}
                lead="We do not have branches in these towns. They are where our customers come from, which is a different and better thing to be able to say."
              />
              <div className="mt-10">
                <CtaLink href="/delta-region" variant="outline">
                  More about the region
                  <Arrow />
                </CtaLink>
              </div>
            </div>

            <ul data-reveal style={{ ["--reveal-delay" as string]: "120ms" }} className="self-start">
              <li className="border-t-2 border-gold py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-2xl text-ink">{brand.city}</span>
                  <span className="u-eyebrow text-gold-deep">The shop</span>
                </div>
              </li>
              {deltaTowns.map((town) => (
                <li key={town.name} className="border-t border-hair py-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-display text-2xl text-ink">{town.name}</span>
                    <span className="u-eyebrow text-muted">Customers travel from</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="cream" divider>
        <Container>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow={worldwide.eyebrow} title={worldwide.title} lead={worldwide.lead} />
              {worldwide.body.map((paragraph) => (
                <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-7 text-muted" />
              ))}
              <p className="mt-8 border-l-2 border-gold pl-6 text-sm text-muted">{worldwide.note}</p>
            </div>

            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }} className="lg:pt-10">
              <Monogram className="h-16 w-16 text-gold" />
              <div className="mt-10">
                <RelatedLinks
                  title="Read next"
                  links={[
                    { label: "About RADHA", href: "/about" },
                    { label: "The delta region", href: "/delta-region" },
                    { label: "The online store", href: "/shop" },
                    { label: "Contact and directions", href: "/contact" },
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
