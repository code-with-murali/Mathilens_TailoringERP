import Image from "next/image";
import Link from "next/link";
import { CategoryGrid, DetailGrid, JournalGrid, ProcessList, Testimonials } from "@/components/blocks";
import { FinalCta } from "@/components/FinalCta";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/ui/JsonLd";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { Monogram } from "@/components/ui/Monogram";
import { RichParagraph } from "@/components/ui/RichText";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bulkAudiences, bulkCategoryCard, bulkOverview } from "@/content/bulk";
import { fabricFamilies, fabricNote, shirtingShades } from "@/content/fabrics";
import { homeFaqs } from "@/content/faqs";
import { garments } from "@/content/garments";
import { journalCopy, journalPosts } from "@/content/journal";
import { pillars } from "@/content/pillars";
import { digitalMeasurement, processSteps } from "@/content/process";
import { deltaTowns, homeTown, regionCopy } from "@/content/region";
import { brand, onlineStore } from "@/content/site";
import { arc, audience, craftsmanship, homeIntro, mannargudiStory, worldwide } from "@/content/story";
import { testimonialsCopy } from "@/content/testimonials";
import { faqSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { asset } from "@/lib/asset";

export const metadata = pageMetadata({
  title: `${brand.name} — Premium Men's Custom Clothing`,
  description:
    "Men's fabric and tailoring house in Mannargudi, Tamil Nadu. Custom suits, blazers, shirts, trousers and wedding wear cut to your measurements, plus bulk uniform orders.",
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqSchema(homeFaqs)} />
      <Hero />
      <Introduction />
      <SignatureCategories />
      <WhyRadha />
      <Craftsmanship />
      <DigitalMeasurement />
      <Process />
      <Fabric />
      <BulkOrders />
      <Mannargudi />
      <Delta />
      <Worldwide />
      <Audience />
      <CustomerStories />
      <Journal />
      <Questions />
      <FinalCta />
    </>
  );
}

/**
 * The first screen.
 *
 * One statement, one supporting line, two actions, and the address. Nothing else — a hero that
 * tries to say five things says none of them, and the reader has the whole page underneath to
 * find the rest.
 */
function Hero() {
  return (
    <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-ink text-cream">
      <div className="u-weave absolute inset-0 text-cream opacity-70" aria-hidden="true" />
      <div className="u-pinstripe absolute inset-0 text-cream opacity-40" aria-hidden="true" />
      <Monogram className="pointer-events-none absolute -right-24 top-1/4 h-[32rem] w-[32rem] text-cream opacity-[0.05] sm:-right-10 sm:h-[42rem] sm:w-[42rem]" />

      <div className="u-container relative pb-20 pt-40 sm:pb-28 lg:pb-32">
        <div className="max-w-4xl">
          <p className="u-eyebrow u-settle text-gold-soft">
            {brand.tagline} &nbsp;·&nbsp; {brand.city}, {brand.region}
          </p>

          <h1 className="u-settle mt-8 text-hero text-cream">
            Crafted for the way
            <br />
            you want to be
            <span className="text-gold-soft"> remembered.</span>
          </h1>

          <div className="u-rule u-settle mt-10 w-32" aria-hidden="true" />

          <p className="u-settle mt-10 max-w-xl text-lead text-ink-muted">
            Premium men&rsquo;s tailoring and custom clothing, crafted in {brand.city}. Suits,
            blazers, shirts, trousers and wedding wear, cut to your own measurements.
          </p>

          <div className="u-settle mt-12 flex flex-wrap gap-3">
            <CtaLink href="/services" variant="solid" tone="dark">
              Explore our services
            </CtaLink>
            <CtaLink
              href={onlineStore.url ?? "/shop"}
              variant="outline"
              tone="dark"
              event="store_click"
              eventParams={{ location: "hero" }}
              external={Boolean(onlineStore.url)}
            >
              Shop online
              <Arrow />
            </CtaLink>
          </div>
        </div>

        {/* The brand arc, stated once, at the bottom of the first screen. */}
        <ul className="u-eyebrow mt-20 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink-line pt-8 text-ink-muted">
          {arc.map((stage, index) => (
            <li key={stage} className="flex items-center gap-4">
              <span className={index === 0 ? "text-gold-soft" : undefined}>{stage}</span>
              {index < arc.length - 1 ? (
                <span aria-hidden="true" className="text-ink-line">
                  &rarr;
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Introduction() {
  return (
    <Section tone="cream">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
          <div data-reveal>
            <SectionHeading eyebrow={homeIntro.eyebrow} title={homeIntro.title} />
          </div>
          <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }} className="lg:pt-16">
            {homeIntro.body.map((paragraph) => (
              <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-6 text-lead text-muted first:mt-0" />
            ))}
            <p className="mt-10 font-display text-2xl text-ink">{brand.statement}</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function SignatureCategories() {
  return (
    <Section tone="paper" id="collections" divider>
      <Container>
        <div data-reveal>
          <SectionHeading
            eyebrow="Signature categories"
            title="What we make"
            lead="Five garments, and the volume orders that use the same workshop. Each is cut to your measurements, in cloth chosen for where it is going."
          />
        </div>

        {/* Bulk completes the grid because it is a category, not a footnote. */}
        <div className="mt-16">
          <CategoryGrid garments={garments} extra={[bulkCategoryCard]} />
        </div>

        <div data-reveal className="mt-16 border-t border-hair pt-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <p className="u-eyebrow text-gold-deep">Who we make in volume for</p>
              <h3 className="mt-5 text-title text-ink">{bulkOverview.title}</h3>
              <p className="mt-6 max-w-xl text-lead text-muted">{bulkOverview.lead}</p>
              <div className="mt-9">
                <CtaLink href="/bulk-orders" variant="outline">
                  Bulk &amp; corporate orders
                  <Arrow />
                </CtaLink>
              </div>
            </div>
            <ul className="flex flex-wrap gap-x-3 gap-y-3">
              {bulkAudiences.map((organisation) => (
                <li
                  key={organisation}
                  className="u-eyebrow border border-hair-strong px-4 py-2.5 text-muted"
                >
                  {organisation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function WhyRadha() {
  return (
    <Section tone="cream" divider>
      <Container>
        <div data-reveal>
          <SectionHeading
            eyebrow="Why RADHA"
            title="Eight things this shop does differently"
            lead="No guarantees, no superlatives, no numbers we cannot stand behind. Just what actually happens when you order a garment here."
          />
        </div>
        <div className="mt-16">
          <DetailGrid details={pillars} columns={4} />
        </div>
      </Container>
    </Section>
  );
}

function Craftsmanship() {
  return (
    <Section tone="ink">
      <Container>
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div data-reveal className="order-2 lg:order-1">
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

          <div data-reveal className="order-1 lg:order-2">
            <figure>
              <Image
                src={asset("/images/monogram-embroidered.webp")}
                alt="The RADHA R monogram embroidered in olive thread on cream shirting, photographed close"
                width={760}
                height={760}
                sizes="(min-width: 1024px) 45vw, 92vw"
                className="w-full"
              />
              <figcaption className="mt-5 text-sm text-ink-muted">
                The house monogram, embroidered on shirting. A collar, a placket and four buttons,
                drawn as an R.
              </figcaption>
            </figure>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function DigitalMeasurement() {
  return (
    <Section tone="paper" id="digital-measurements">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
          <div data-reveal>
            <SectionHeading
              eyebrow={digitalMeasurement.eyebrow}
              title={digitalMeasurement.title}
              lead={digitalMeasurement.lead}
            />
          </div>
          <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
            {digitalMeasurement.body.map((paragraph) => (
              <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-6 text-muted first:mt-0" />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <DetailGrid details={digitalMeasurement.points} columns={4} />
        </div>

        <p data-reveal className="mt-12 max-w-2xl border-l-2 border-gold pl-6 text-sm text-muted">
          {digitalMeasurement.caveat}
        </p>
      </Container>
    </Section>
  );
}

function Process() {
  return (
    <Section tone="cream" divider>
      <Container>
        <div data-reveal>
          <SectionHeading
            eyebrow="The process"
            title="Seven steps, in order"
            lead="The same sequence for a single shirt and for four hundred uniforms. Nothing skips the trial."
          />
        </div>
        <div className="mt-16">
          <ProcessList steps={processSteps} />
        </div>
        <div data-reveal className="mt-12">
          <CtaLink href="/process" variant="quiet">
            The full tailoring process
            <Arrow />
          </CtaLink>
        </div>
      </Container>
    </Section>
  );
}

function Fabric() {
  return (
    <Section tone="paper" divider>
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
          <div data-reveal>
            <SectionHeading
              eyebrow="The cloth"
              title="It starts at the fabric counter"
              lead="The cloth decides more than the cut does. We would rather show you what is on the shelf today than publish a catalogue that goes stale."
            />
            <ul className="mt-12 border-t border-hair">
              {fabricFamilies.map((family) => (
                <li key={family.slug} className="border-b border-hair py-5">
                  <h3 className="font-display text-xl text-ink">{family.name}</h3>
                  <p className="mt-2 text-sm text-muted">{family.summary}</p>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <CtaLink href="/fabrics" variant="outline">
                The fabric collection
                <Arrow />
              </CtaLink>
            </div>
          </div>

          <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
            <figure>
              <Image
                src={asset("/images/shirting-shades.webp")}
                alt="Four RADHA shirt pockets side by side in white, light blue, olive and navy, each with the R monogram embroidered"
                width={532}
                height={431}
                sizes="(min-width: 1024px) 45vw, 92vw"
                className="w-full"
              />
              <figcaption className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                {shirtingShades.map((shade) => (
                  <span key={shade.name} className="u-eyebrow text-muted">
                    {shade.name}
                  </span>
                ))}
              </figcaption>
            </figure>
            <p className="mt-8 text-sm leading-relaxed text-muted">{fabricNote}</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function BulkOrders() {
  return (
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
            <div className="mt-10 flex flex-wrap gap-3">
              <CtaLink href="/bulk-orders" variant="solid" tone="dark">
                Discuss a bulk order
              </CtaLink>
            </div>
          </div>
          <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
            {bulkOverview.body.map((paragraph) => (
              <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-6 text-lead text-ink-muted first:mt-0" />
            ))}
            <ul className="mt-10 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {[
                { label: "Corporate uniforms", href: "/bulk-orders/corporate" },
                { label: "School uniforms", href: "/bulk-orders/schools" },
                { label: "College uniforms", href: "/bulk-orders/colleges" },
                { label: "Institutional uniforms", href: "/bulk-orders/institutions" },
              ].map((link) => (
                <li key={link.href} className="border-t border-ink-line pt-4">
                  <Link
                    href={link.href}
                    className="u-eyebrow inline-flex items-center gap-3 text-cream transition-colors hover:text-gold-soft"
                  >
                    {link.label}
                    <Arrow />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Mannargudi() {
  return (
    <Section tone="cream">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-20">
          <div data-reveal>
            <SectionHeading
              eyebrow={mannargudiStory.eyebrow}
              title={mannargudiStory.title}
              lead={mannargudiStory.lead}
            />
            {mannargudiStory.body.slice(0, 2).map((paragraph) => (
              <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-7 text-muted" />
            ))}
            <div className="mt-10">
              <CtaLink href="/mannargudi" variant="quiet">
                The Mannargudi story
                <Arrow />
              </CtaLink>
            </div>
          </div>

          <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }} className="lg:pt-12">
            <blockquote className="border-l-2 border-gold pl-8">
              <p className="font-display text-3xl leading-tight text-ink sm:text-4xl">
                {mannargudiStory.pull}
              </p>
            </blockquote>
            <p className="mt-10 text-muted">{mannargudiStory.body[2]}</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Delta() {
  return (
    <Section tone="paper" divider>
      <Container>
        <div data-reveal>
          <SectionHeading eyebrow={regionCopy.eyebrow} title={regionCopy.title} lead={regionCopy.lead} />
        </div>

        <ul className="mt-16 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          <li data-reveal className="border-t-2 border-gold pt-6">
            <h3 className="font-display text-2xl text-ink">{homeTown.name}</h3>
            <p className="u-eyebrow mt-3 text-gold-deep">The shop</p>
            <p className="mt-3 text-sm text-muted">{homeTown.note}</p>
          </li>
          {deltaTowns.map((town, index) => (
            <li
              key={town.name}
              data-reveal
              style={{ ["--reveal-delay" as string]: `${Math.min(index, 5) * 70}ms` }}
              className="border-t border-hair pt-6"
            >
              <h3 className="font-display text-2xl text-ink">{town.name}</h3>
              <p className="mt-3 text-sm text-muted">{town.note}</p>
            </li>
          ))}
        </ul>

        <p data-reveal className="mt-12 max-w-2xl text-sm text-muted">
          {regionCopy.clarification}{" "}
          <Link href="/delta-region" className="u-underline text-gold-deep">
            More about the region we serve
          </Link>
          .
        </p>
      </Container>
    </Section>
  );
}

function Worldwide() {
  return (
    <Section tone="ink">
      <Container>
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div data-reveal>
            <SectionHeading
              eyebrow={worldwide.eyebrow}
              title={worldwide.title}
              lead={worldwide.lead}
              tone="dark"
            />
            {worldwide.body.map((paragraph) => (
              <RichParagraph key={paragraph.slice(0, 32)} text={paragraph} className="mt-7 text-ink-muted" />
            ))}
            <div className="mt-10 flex flex-wrap gap-3">
              <CtaLink
                href={onlineStore.url ?? "/shop"}
                variant="solid"
                tone="dark"
                event="store_click"
                eventParams={{ location: "worldwide_section" }}
                external={Boolean(onlineStore.url)}
              >
                Explore the online store
              </CtaLink>
            </div>
            <p className="mt-8 text-sm text-ink-muted">{worldwide.note}</p>
          </div>

          <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
            <ol className="border-t border-ink-line">
              {arc.map((stage, index) => (
                <li
                  key={stage}
                  className="flex items-baseline gap-8 border-b border-ink-line py-7"
                >
                  <span className="font-display text-3xl text-gold-soft/70" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <span className="font-display text-3xl text-cream sm:text-4xl">{stage}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Audience() {
  return (
    <Section tone="cream" divider>
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
  );
}

function CustomerStories() {
  return (
    <Section tone="paper" divider>
      <Container>
        <div data-reveal>
          <SectionHeading eyebrow={testimonialsCopy.eyebrow} title={testimonialsCopy.title} />
        </div>
        <div className="mt-14">
          <Testimonials />
        </div>
      </Container>
    </Section>
  );
}

/**
 * The last thing before the call to action: the objections that stop someone visiting. Price and
 * turnaround are the two most asked and the two we cannot answer in a number — so they are
 * answered honestly, here, rather than left for the visitor to assume the worst about.
 */
function Questions() {
  return (
    <Section tone="paper" divider>
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-20">
          <div data-reveal>
            <SectionHeading
              eyebrow="Questions"
              title="Before you come in"
              lead="The things people ask first — answered straight, including the two we cannot put a number on."
            />
          </div>
          <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
            <FaqList faqs={homeFaqs} />
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Journal() {
  return (
    <Section tone="cream" divider>
      <Container>
        <div data-reveal>
          <SectionHeading eyebrow={journalCopy.eyebrow} title={journalCopy.title} lead={journalCopy.lead} />
        </div>
        <div className="mt-16">
          <JournalGrid posts={journalPosts.slice(0, 3)} />
        </div>
        <div data-reveal className="mt-14">
          <CtaLink href="/journal" variant="outline">
            Read the journal
            <Arrow />
          </CtaLink>
        </div>
      </Container>
    </Section>
  );
}
