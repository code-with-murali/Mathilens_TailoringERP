import { CategoryGrid, RelatedLinks } from "@/components/blocks";
import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHero } from "@/components/PageHero";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { JsonLd } from "@/components/ui/JsonLd";
import { RichParagraph } from "@/components/ui/RichText";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bulkCategoryCard } from "@/content/bulk";
import { garments } from "@/content/garments";
import { brand, onlineStore } from "@/content/site";
import { worldwide } from "@/content/story";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema, onlineStoreSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const crumbs: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Shop online", path: "/shop" },
];

export const metadata = pageMetadata({
  title: "Shop RADHA Online",
  description:
    "The RADHA APPARELS online store — explore custom men's clothing, fabrics and made-to-measure garments from Mannargudi, wherever you are.",
  path: "/shop",
});

/**
 * The bridge to the separate shopping platform.
 *
 * While that platform is still being built, this page does the honest thing: it says so, explains
 * what will be possible, and offers the two routes that work today — an enquiry, or a visit. It
 * does not pretend to be a storefront, and it does not promise a launch date nobody has given.
 */
export default function ShopPage() {
  const live = Boolean(onlineStore.url);

  const journey = [
    { title: "Explore", text: "Products, garments and the fabric families we work with." },
    { title: "Customise", text: "Choose the cloth, the fit and the details that make it yours." },
    { title: "Measure", text: "Use measurements already held against your record, or ask us for help taking them." },
    { title: "Order", text: "Place the order and pay for it online." },
    { title: "Made in Mannargudi", text: "Cut, tailored and quality-checked at the workshop." },
    { title: "Delivered", text: "Followed from production to delivery." },
  ];

  return (
    <>
      <JsonLd data={[breadcrumbSchema(crumbs), onlineStoreSchema()]} />

      <PageHero
        eyebrow={worldwide.eyebrow}
        title={live ? "Shop RADHA online" : worldwide.title}
        lead={
          live
            ? "Explore the collection, choose your cloth and order from wherever you are. Every garment is still cut and made in Mannargudi."
            : `A separate RADHA online shopping platform is being built. Until it opens, the shop in ${brand.city} and an enquiry are how an order begins — and both work from anywhere.`
        }
        crumbs={crumbs}
      >
        <div className="flex flex-wrap gap-3">
          {live ? (
            <CtaLink
              href={onlineStore.url as string}
              variant="solid"
              tone="dark"
              event="store_click"
              eventParams={{ location: "shop_page_hero" }}
              external
            >
              Enter the online store
            </CtaLink>
          ) : (
            <CtaLink href="#enquiry" variant="solid" tone="dark">
              Send an enquiry instead
            </CtaLink>
          )}
          <CtaLink href="/services" variant="outline" tone="dark">
            Explore the collection
            <Arrow />
          </CtaLink>
        </div>
      </PageHero>

      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading
                eyebrow="Reach"
                title="Discover RADHA from anywhere"
                lead={worldwide.lead}
              />
              <p className="mt-8 border-l-2 border-gold pl-6 text-sm text-muted">{worldwide.note}</p>
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              {worldwide.body.map((paragraph) => (
                <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-6 text-lead text-muted first:mt-0" />
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="The journey"
              title="What ordering online will look like"
              lead="Described as an intention rather than a feature list. Each step will be documented here as it goes live, not before."
              tone="dark"
            />
          </div>

          <ol className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {journey.map((step, index) => (
              <li
                key={step.title}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${Math.min(index, 5) * 70}ms` }}
                className="border-t border-ink-line pt-6"
              >
                <span className="font-display text-3xl text-gold-soft/70" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-xl text-cream">{step.title}</h3>
                <p className="mt-3 text-sm text-ink-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="The collection"
              title="What you will find"
              lead="The same garments that leave the Mannargudi workshop today, and the same choices behind them."
            />
          </div>
          <div className="mt-16">
            <CategoryGrid garments={garments} extra={[bulkCategoryCard]} />
          </div>
        </Container>
      </Section>

      <Section tone="cream" id="enquiry">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading
                eyebrow="Meanwhile"
                title="An enquiry works from anywhere"
                lead="Tell us what you are looking for and where you are, and we will tell you honestly what is practical today."
              />
              <div className="mt-12">
                <RelatedLinks
                  title="Read next"
                  links={[
                    { label: "The tailoring process", href: "/process" },
                    { label: "Fabric collection", href: "/fabrics" },
                    {
                      label: "How digital measurements help",
                      href: "/journal/how-digital-measurements-make-repeat-orders-easier",
                    },
                    { label: "Contact and directions", href: "/contact" },
                  ]}
                />
              </div>
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }} className="border-t-2 border-gold pt-10">
              <EnquiryForm heading="Send an enquiry" />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
