import Image from "next/image";
import { RelatedLinks } from "@/components/blocks";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/ui/JsonLd";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fabricFaqs, fabricFamilies, fabricNote, shirtingShades } from "@/content/fabrics";
import type { Crumb } from "@/content/types";
import { asset } from "@/lib/asset";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const crumbs: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Fabric collection", path: "/fabrics" },
];

export const metadata = pageMetadata({
  title: "Fabric Collection — Shirting, Suiting & More",
  description:
    "The families of cloth we work with in Mannargudi — shirting, suiting, blazer, wedding and uniform fabric — and how each behaves through a working day.",
  path: "/fabrics",
});

export default function FabricsPage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(fabricFaqs)]} />

      <PageHero
        eyebrow="The cloth"
        title="Fabric decides more than the cut does"
        lead="A garment is only as good as the cloth it is made from, and cloth is chosen against where it is going — not against a photograph. This is what each family is genuinely good for."
        crumbs={crumbs}
      >
        <CtaLink href="/contact" variant="solid" tone="dark">
          Ask what is on the shelf
        </CtaLink>
      </PageHero>

      {/* The honest framing, stated before the list rather than buried under it. */}
      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading
                eyebrow="Why there is no catalogue here"
                title="What is on the shelf today"
              />
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              <p className="text-lead text-muted">{fabricNote}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <CtaLink href="/contact" variant="outline">
                  Tell us what you are looking for
                  <Arrow />
                </CtaLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="Families"
              title="Five kinds of cloth, five different jobs"
              lead="A men's tailor works across a handful of fabric families. Knowing which one your garment belongs to settles most of the decision before a single colour is considered."
            />
          </div>

          <div className="mt-16 border-t border-hair">
            {fabricFamilies.map((family, index) => (
              <article
                key={family.slug}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${Math.min(index, 4) * 70}ms` }}
                className="grid gap-x-12 gap-y-5 border-b border-hair py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]"
              >
                <div>
                  <h2 className="text-title text-ink">{family.name}</h2>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {family.usedFor.map((use) => (
                      <li key={use} className="u-eyebrow border border-hair-strong px-3 py-2 text-muted">
                        {use}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-lead text-ink">{family.summary}</p>
                  <p className="mt-5 text-muted">{family.behaviour}</p>

                  {/* Populated the day RADHA supplies real fabric records; silent until then. */}
                  {family.items.length > 0 ? (
                    <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                      {family.items.map((item) => (
                        <li key={item.name} className="border-t border-hair pt-5">
                          {item.image ? (
                            <Image
                              src={asset(item.image.src)}
                              alt={item.image.alt}
                              width={item.image.width}
                              height={item.image.height}
                              className="mb-4 w-full"
                            />
                          ) : null}
                          <p className="font-display text-lg text-ink">{item.name}</p>
                          <p className="mt-1 text-sm text-muted">{item.description}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div data-reveal>
              <SectionHeading
                eyebrow="Shirting"
                title="Four shades, one monogram"
                lead="The RADHA shirt photographed in white, light blue, olive and navy — the monogram in navy on the light cloths and in gold on the dark ones."
                tone="dark"
              />
              <div className="mt-10">
                <CtaLink href="/shirts" variant="outline" tone="dark">
                  Custom shirts
                  <Arrow />
                </CtaLink>
              </div>
            </div>

            {/* Each shade shown on its own with its name under it, rather than as one strip — the
                colour is the subject here, and a label beside a swatch is how cloth is chosen. */}
            <ul
              data-reveal
              style={{ ["--reveal-delay" as string]: "120ms" }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {shirtingShades.map((shade) => (
                <li key={shade.name}>
                  <Image
                    src={asset(shade.src)}
                    alt={shade.alt}
                    width={139}
                    height={431}
                    sizes="(min-width: 1024px) 11vw, 22vw"
                    className="w-full"
                  />
                  <p className="u-eyebrow mt-4 text-ink-muted">{shade.name}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow="Questions" title="About the cloth" />
              <div className="mt-12">
                <RelatedLinks
                  title="Read next"
                  links={[
                    { label: "How to choose suit fabric", href: "/journal/how-to-choose-the-right-suit-fabric" },
                    { label: "Custom suits", href: "/suits" },
                    { label: "The tailoring process", href: "/process" },
                  ]}
                />
              </div>
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              <FaqList faqs={fabricFaqs} />
            </div>
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
