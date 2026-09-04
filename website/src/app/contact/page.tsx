import { ContactChannels, SocialLinks } from "@/components/ContactChannels";
import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHero } from "@/components/PageHero";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/ui/JsonLd";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brand, contact, onlineStore, social } from "@/content/site";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

const crumbs: Crumb[] = [
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
];

export const metadata = pageMetadata({
  title: "Contact & Visit Our Mannargudi Shop",
  description:
    "Contact RADHA APPARELS in Mannargudi, Tamil Nadu. Send a tailoring or bulk enquiry, or visit the shop to choose fabric and be measured in person.",
  path: "/contact",
});

const faqs = [
  {
    question: "Do I need an appointment to visit?",
    answer:
      "Not for an ordinary visit — come to the shop in Mannargudi and we will take it from there. For a wedding order, or where several people need measuring, send an enquiry first so the visit can be planned properly.",
  },
  {
    question: "What should I bring?",
    answer:
      "The shoes you plan to wear with the garment, and anything it has to work alongside — a jacket you already own, the shirt that goes under it. Length and break are decided against what is actually on your feet.",
  },
  {
    question: "How long does a reply take?",
    answer:
      "We come back to enquiries as soon as we can. If something is urgent or dated — a wedding, a placement season, a uniform deadline — say so in the message and we will treat it that way.",
  },
  {
    question: "Can I order without visiting the shop?",
    answer:
      "Measurements are taken in person at Mannargudi, so a first order needs a visit. Send an enquiry describing what you need and where you are, and we will tell you honestly what is practical.",
  },
];

const visitNotes = [
  {
    title: "Two visits, usually",
    text: "One to choose cloth and be measured, one for the trial before the garment is finished. Tell us if you are travelling in and we will plan them so the journey is worth making.",
  },
  {
    title: "Bring the shoes",
    text: "Trouser length and break are set at the trial, against the shoes you will actually wear. Bring anything else the garment has to work with, too.",
  },
  {
    title: "Come with the occasion in mind",
    text: "Where the garment is going decides the cloth more than colour does. A courtroom, an air-conditioned office and an evening reception each ask for something different.",
  },
  {
    title: "Groups and wedding parties",
    text: "Fathers, brothers and groomsmen are best measured in one visit. Each person is recorded separately, so the order can be planned and made as one.",
  },
];

export default function ContactPage() {
  const hasSocial = Boolean(social.instagram || social.facebook || social.youtube);
  const hasListings = Boolean(contact.justdialUrl || contact.googleBusinessUrl);

  return (
    <>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(faqs)]} />

      <PageHero
        eyebrow="Contact"
        title="Come and be measured"
        lead={`The shop is in ${brand.city}, ${brand.region} — the only one, and where every garment is cut, made and fitted. Send an enquiry first if it helps, or simply come in.`}
        crumbs={crumbs}
      >
        <ContactChannels tone="dark" source="contact_hero" />
      </PageHero>

      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow="The shop" title="Where to find us" />

              <address className="mt-9 not-italic text-lead text-muted">
                <span className="block font-display text-2xl text-ink">{brand.name}</span>
                <span className="block">{brand.tagline}</span>
                {contact.addressLines ? (
                  <span className="mt-4 block">
                    {contact.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </span>
                ) : null}
                <span className="mt-4 block">
                  {contact.locality}, {contact.administrativeArea}
                  {contact.postalCode ? ` ${contact.postalCode}` : ""}
                </span>
                <span className="block">{brand.country}</span>
              </address>

              {contact.openingHours ? (
                <div className="mt-10 border-t border-hair pt-7">
                  <h2 className="u-eyebrow text-gold-deep">Opening hours</h2>
                  <ul className="mt-4 space-y-1 text-muted">
                    {contact.openingHours.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-10">
                <ContactChannels layout="stack" source="contact_page" />
              </div>

              {/* True regardless of what is configured, and the most useful thing this column can
                  say to someone deciding whether to make the journey. */}
              <div className="mt-12 border-t border-hair pt-8">
                <h2 className="u-eyebrow text-gold-deep">Planning your visit</h2>
                <dl className="mt-6 space-y-6">
                  {visitNotes.map((item) => (
                    <div key={item.title}>
                      <dt className="font-display text-xl text-ink">{item.title}</dt>
                      <dd className="mt-1.5 text-muted">{item.text}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {hasSocial ? (
                <div className="mt-12 border-t border-hair pt-8">
                  <h2 className="u-eyebrow mb-5 text-gold-deep">Follow RADHA</h2>
                  <SocialLinks />
                </div>
              ) : null}

              {hasListings ? (
                <div className="mt-12 border-t border-hair pt-8">
                  <h2 className="u-eyebrow mb-5 text-gold-deep">Find us listed</h2>
                  <ul className="space-y-3">
                    {contact.googleBusinessUrl ? (
                      <li>
                        <a
                          href={contact.googleBusinessUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="u-underline text-ink"
                        >
                          Google Business Profile
                        </a>
                      </li>
                    ) : null}
                    {contact.justdialUrl ? (
                      <li>
                        <a
                          href={contact.justdialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="u-underline text-ink"
                        >
                          Justdial listing
                        </a>
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
            </div>

            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }} className="border-t-2 border-gold pt-10">
              <EnquiryForm heading="Send an enquiry" />
            </div>
          </div>
        </Container>
      </Section>

      {/* The map renders only once a real embed URL is configured — an empty iframe or a pin
          dropped on a guessed location would be worse than no map at all. */}
      {contact.mapEmbedUrl ? (
        <Section tone="paper" flush>
          <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
            <iframe
              src={contact.mapEmbedUrl}
              title={`Map to ${brand.name}, ${brand.city}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </Section>
      ) : null}

      <Section tone="paper" divider>
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow="Before you come" title="Practical questions" />
              <div className="mt-10 flex flex-wrap gap-3">
                <CtaLink href="/process" variant="outline">
                  The tailoring process
                  <Arrow />
                </CtaLink>
                <CtaLink href="/bulk-orders" variant="outline">
                  Bulk enquiries
                  <Arrow />
                </CtaLink>
              </div>
              {onlineStore.url ? (
                <p className="mt-8 text-muted">
                  Buying online instead?{" "}
                  <a
                    href={onlineStore.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="u-underline text-gold-deep"
                  >
                    Visit the RADHA online store
                  </a>
                  .
                </p>
              ) : null}
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              <FaqList faqs={faqs} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
