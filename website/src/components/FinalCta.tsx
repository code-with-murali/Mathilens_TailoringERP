import { ContactChannels } from "@/components/ContactChannels";
import { CtaLink, Arrow } from "@/components/ui/CtaLink";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brand, onlineStore } from "@/content/site";
import { finalCta } from "@/content/story";

/**
 * The closing call to action, at the foot of nearly every page.
 *
 * One primary action — start an enquiry — with the shop's location stated as fact beside it, and
 * whichever contact channels have actually been configured. The online store link appears only
 * once the store exists; until then the visitor is pointed at /shop, which explains where it is.
 */
export function FinalCta({ note }: { note?: string }) {
  return (
    <Section tone="ink" id="enquire">
      <Container>
        <div className="grid gap-14 lg:grid-cols-2 lg:items-end">
          <div data-reveal>
            <SectionHeading
              eyebrow={finalCta.eyebrow}
              title={finalCta.title}
              lead={note ?? finalCta.body}
              tone="dark"
            />
          </div>

          <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }} className="lg:pb-2">
            <div className="flex flex-wrap gap-3">
              <CtaLink href="/contact" variant="solid" tone="dark">
                Start an enquiry
              </CtaLink>
              <CtaLink
                href={onlineStore.url ?? "/shop"}
                variant="outline"
                tone="dark"
                event="store_click"
                eventParams={{ location: "final_cta" }}
                external={Boolean(onlineStore.url)}
              >
                {onlineStore.url ? "Shop online" : "The online store"}
                <Arrow />
              </CtaLink>
            </div>

            <div className="mt-8">
              <ContactChannels tone="dark" source="final_cta" />
            </div>

            <p className="mt-8 text-sm text-ink-muted">
              The shop is in {brand.city}, {brand.region}. It is the only one — everything is cut,
              made and fitted there.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
