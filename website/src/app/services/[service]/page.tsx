import { notFound } from "next/navigation";
import { DetailGrid, RelatedLinks } from "@/components/blocks";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { Arrow, CtaLink } from "@/components/ui/CtaLink";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/ui/JsonLd";
import { RichParagraph } from "@/components/ui/RichText";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { garments } from "@/content/garments";
import { serviceBySlug, servicePages, serviceSlugs } from "@/content/services";
import type { Crumb } from "@/content/types";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

/** Both service pages are prerendered at build time; there is no other valid slug. */
export function generateStaticParams() {
  return serviceSlugs.map((service) => ({ service }));
}

export const dynamicParams = false;

type Params = { params: Promise<{ service: string }> };

export async function generateMetadata({ params }: Params) {
  const { service: slug } = await params;
  const service = serviceBySlug[slug];
  if (!service) return {};
  return pageMetadata({
    title: service.seoTitle,
    description: service.seoDescription,
    path: service.path,
  });
}

export default async function ServicePage({ params }: Params) {
  const { service: slug } = await params;
  const service = serviceBySlug[slug];
  if (!service) notFound();

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: service.title, path: service.path },
  ];

  const otherService = servicePages.find((item) => item.slug !== service.slug);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          serviceSchema({
            name: service.title,
            serviceType: service.serviceType,
            description: service.seoDescription,
            path: service.path,
          }),
          faqSchema(service.faqs),
        ]}
      />

      <PageHero eyebrow={service.eyebrow} title={service.title} lead={service.lead} crumbs={crumbs}>
        <div className="flex flex-wrap gap-3">
          <CtaLink href="/contact" variant="solid" tone="dark">
            Start an enquiry
          </CtaLink>
          <CtaLink href="/process" variant="outline" tone="dark">
            The seven steps
            <Arrow />
          </CtaLink>
        </div>
      </PageHero>

      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-20">
            <div>
              {service.sections.map((section, index) => (
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

            <aside data-reveal className="lg:sticky lg:top-32 lg:self-start">
              <div className="border-t-2 border-gold pt-7">
                <h2 className="u-eyebrow text-gold-deep">{service.includesHeading}</h2>
                <ul className="mt-7 space-y-5">
                  {service.includes.map((item) => (
                    <li key={item.title}>
                      <p className="font-display text-lg text-ink">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">{item.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container>
          <div data-reveal>
            <SectionHeading
              eyebrow="The garments"
              title="What this service actually makes"
              lead="Every garment below is drafted from your measurements and fitted on you before it is finished."
            />
          </div>
          <div className="mt-14 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {garments.map((garment) => (
              <a
                key={garment.slug}
                href={garment.path}
                className="group flex items-baseline justify-between gap-4 border-b border-hair py-5"
              >
                <span className="font-display text-xl text-ink transition-colors group-hover:text-gold-deep">
                  {garment.title}
                </span>
                <Arrow className="shrink-0 text-gold-deep transition-transform duration-500 group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="cream" divider>
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
            <div data-reveal>
              <SectionHeading eyebrow="Questions" title="Asked at the counter" />
              {otherService ? (
                <div className="mt-10">
                  <RelatedLinks
                    title="Also worth reading"
                    links={[
                      { label: otherService.title, href: otherService.path },
                      { label: "The tailoring process", href: "/process" },
                      { label: "Bulk & corporate orders", href: "/bulk-orders" },
                    ]}
                  />
                </div>
              ) : null}
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
              <FaqList faqs={service.faqs} />
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="paper" divider>
        <Container>
          <div data-reveal>
            <SectionHeading eyebrow="In summary" title={service.includesHeading} />
          </div>
          <div className="mt-14">
            <DetailGrid details={service.includes} columns={4} />
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
