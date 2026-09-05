import Image from "next/image";
import Link from "next/link";
import { footerGroups, legalLinks } from "@/content/navigation";
import { brand, contact, onlineStore, social, type SocialKey } from "@/content/site";
import { SocialLinks } from "@/components/ContactChannels";
import { asset } from "@/lib/asset";

/**
 * The footer.
 *
 * This is where the site's full index lives, which is why the header is allowed to be short. It
 * is also the main internal-linking surface on the site — every page reachable from here means
 * every page has inbound links from every other page.
 *
 * Prefetch is off on these links. Twenty-five of them prefetching on every page load is most of a
 * page's request count spent on routes almost nobody clicks, and this audience is largely on
 * mobile data in the delta. The links people actually take next — the header, the category cards,
 * the calls to action — keep it.
 *
 * Address, phone and hours appear only once RADHA has supplied them. What is always shown is what
 * is always true: the shop is in Mannargudi, Tamil Nadu.
 */
export function SiteFooter() {
  const hasSocial = (Object.keys(social) as SocialKey[]).some((key) => social[key]);

  return (
    <footer className="bg-ink text-cream">
      <div className="u-container py-20 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <Link href="/" aria-label={`${brand.name} — home`}>
              <Image
                src={asset("/brand/radha-wordmark-tagline-reversed.webp")}
                alt={`${brand.name} — ${brand.tagline}`}
                width={420}
                height={222}
                className="h-24 w-auto"
              />
            </Link>

            <p className="mt-8 max-w-xs text-sm leading-relaxed text-ink-muted">
              Premium men&rsquo;s custom clothing — suits, blazers, shirts, trousers and wedding
              wear, cut to measure at our shop in {brand.city}.
            </p>

            <address className="mt-8 not-italic text-sm text-ink-muted">
              {contact.addressLines ? (
                <span className="block">{contact.addressLines.join(", ")}</span>
              ) : null}
              <span className="block">
                {contact.locality}, {contact.administrativeArea}, {brand.country}
                {contact.postalCode ? ` ${contact.postalCode}` : ""}
              </span>
            </address>

            {contact.openingHours ? (
              <p className="mt-4 text-sm text-ink-muted">
                {contact.openingHours.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            ) : null}

            {hasSocial ? (
              <div className="mt-8">
                <p className="u-eyebrow mb-4 text-gold-soft">Follow &amp; join RADHA</p>
                <SocialLinks tone="dark" />
              </div>
            ) : null}
          </div>

          <nav aria-label="Footer" className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="u-eyebrow mb-5 text-gold-soft">{group.title}</h2>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        prefetch={false}
                        className="text-sm text-ink-muted transition-colors hover:text-cream"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {onlineStore.url ? (
          <div className="mt-16 border-t border-ink-line pt-8">
            <a
              href={onlineStore.url}
              target="_blank"
              rel="noopener noreferrer"
              className="u-eyebrow text-gold-soft transition-colors hover:text-cream"
            >
              Shop the RADHA online store
            </a>
          </div>
        ) : null}

        <div className="mt-16 flex flex-col gap-6 border-t border-ink-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            &copy; {new Date().getFullYear()} {brand.displayName}. {brand.tagline}. {brand.city},{" "}
            {brand.region}.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  className="text-xs text-ink-muted transition-colors hover:text-cream"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

