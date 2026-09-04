"use client";

import Link from "next/link";
import {
  contact,
  mailLink,
  social,
  socialLabels,
  telLink,
  whatsappLink,
  type SocialKey,
} from "@/content/site";
import { track } from "@/lib/analytics";

/**
 * Phone, WhatsApp, email, directions and social links.
 *
 * Each of these renders only when the underlying value has been configured. That is the whole
 * design: a visitor never sees a dead call button or a placeholder number, and whoever is
 * configuring the site sees exactly what is still missing in the development-only checklist.
 *
 * The enquiry form is always available, so there is never a page with no way to get in touch.
 */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function PhoneIcon({ className = "" }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M4 4h4l2 5-2.5 1.5a12 12 0 0 0 6 6L15 14l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 3 5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.17c-.24.68-1.4 1.3-1.94 1.34-.5.05-.98.23-3.3-.69-2.77-1.09-4.53-3.92-4.67-4.1-.13-.19-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.28.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.6.46.23.55.77 1.9.84 2.04.07.14.11.3.02.48-.09.19-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.28-.12.55.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.19.68-.79.86-1.07.18-.27.36-.22.6-.13.25.09 1.57.74 1.84.87.27.14.45.2.51.32.07.11.07.66-.17 1.34Z" />
    </svg>
  );
}

function MailIcon({ className = "" }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3" y="5" width="18" height="14" />
      <path d="m3 6 9 7 9-7" />
    </svg>
  );
}

function PinIcon({ className = "" }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

const socialIcons: Record<SocialKey, (props: { className?: string }) => React.JSX.Element> = {
  instagram: ({ className = "" }) => (
    <svg {...iconProps} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: ({ className = "" }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M14 8.5V7c0-.8.2-1.2 1.3-1.2H17V3h-2.6C11.3 3 10.4 4.6 10.4 7v1.5H8.5V12h1.9v9H14v-9h2.4l.4-3.5H14Z" />
    </svg>
  ),
  youtube: ({ className = "" }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  ),
};

const WHATSAPP_MESSAGE = "Hello RADHA APPARELS, I would like to enquire about custom tailoring.";

/**
 * The contact buttons. `layout="stack"` for a sidebar, `"row"` for under a heading.
 */
export function ContactChannels({
  tone = "light",
  layout = "row",
  source = "page",
}: {
  tone?: "light" | "dark";
  layout?: "row" | "stack";
  /** Recorded on the analytics event, so we can tell which page drove the call. */
  source?: string;
}) {
  const wa = whatsappLink(WHATSAPP_MESSAGE);
  const channels: { href: string; label: string; icon: React.JSX.Element; event: "phone_click" | "whatsapp_click" | "email_click" | "directions_click" }[] = [];

  if (telLink && contact.phone) {
    channels.push({
      href: telLink,
      label: `+${contact.phone}`,
      icon: <PhoneIcon className="h-5 w-5" />,
      event: "phone_click",
    });
  }
  if (wa) {
    channels.push({
      href: wa,
      label: "WhatsApp",
      icon: <WhatsAppIcon className="h-5 w-5" />,
      event: "whatsapp_click",
    });
  }
  if (mailLink && contact.email) {
    channels.push({
      href: mailLink,
      label: contact.email,
      icon: <MailIcon className="h-5 w-5" />,
      event: "email_click",
    });
  }
  if (contact.mapDirectionsUrl) {
    channels.push({
      href: contact.mapDirectionsUrl,
      label: "Get directions",
      icon: <PinIcon className="h-5 w-5" />,
      event: "directions_click",
    });
  }

  if (channels.length === 0) return null;

  const itemClass =
    tone === "dark"
      ? "border-cream/25 text-cream hover:border-gold hover:text-gold-soft"
      : "border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-cream";

  return (
    <ul className={layout === "stack" ? "flex flex-col gap-3" : "flex flex-wrap gap-3"}>
      {channels.map((channel) => (
        <li key={channel.href}>
          <a
            href={channel.href}
            className={`u-eyebrow inline-flex items-center gap-3 border px-6 py-4 transition-colors ${itemClass}`}
            onClick={() => track(channel.event, { source })}
            {...(channel.href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {channel.icon}
            <span>{channel.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function SocialLinks({ tone = "light" }: { tone?: "light" | "dark" }) {
  const entries = (Object.keys(socialLabels) as SocialKey[])
    .map((key) => ({ key, href: social[key] }))
    .filter((entry): entry is { key: SocialKey; href: string } => Boolean(entry.href));

  if (entries.length === 0) return null;

  const itemClass =
    tone === "dark"
      ? "border-cream/25 text-cream hover:border-gold hover:text-gold-soft"
      : "border-ink/20 text-ink hover:border-ink hover:text-gold-deep";

  return (
    <ul className="flex flex-wrap gap-3">
      {entries.map(({ key, href }) => {
        const Icon = socialIcons[key];
        return (
          <li key={key}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${socialLabels[key]} — RADHA APPARELS`}
              className={`flex h-12 w-12 items-center justify-center border transition-colors ${itemClass}`}
              onClick={() => track("social_click", { network: key })}
            >
              <Icon className="h-5 w-5" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The action bar pinned to the bottom of the screen on phones.
 *
 * Most of a men's clothing site's traffic arrives on a phone, and a shop customer told to "visit
 * our website" is holding one. So this bar always renders something: WhatsApp and a call button
 * where those numbers are configured, and an enquiry link where they are not. It is the one place
 * on the site where an unconfigured value falls back rather than disappearing, because a phone
 * screen with no persistent way to act on it is a wasted visit.
 */
export function MobileActionBar() {
  const wa = whatsappLink(WHATSAPP_MESSAGE);

  return (
    <nav
      aria-label="Contact RADHA"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-line bg-ink/95 backdrop-blur-sm lg:hidden"
    >
      <div className="flex">
        {telLink ? (
          <a
            href={telLink}
            className="u-eyebrow flex flex-1 items-center justify-center gap-2 py-4 text-cream"
            onClick={() => track("phone_click", { source: "mobile_bar" })}
          >
            <PhoneIcon className="h-4 w-4" />
            Call
          </a>
        ) : null}

        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="u-eyebrow flex flex-1 items-center justify-center gap-2 bg-gold py-4 text-ink"
            onClick={() => track("whatsapp_click", { source: "mobile_bar" })}
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </a>
        ) : (
          <Link
            href="/contact"
            className="u-eyebrow flex flex-1 items-center justify-center gap-2 bg-gold py-4 text-ink"
            onClick={() => track("nav_click", { destination: "/contact", source: "mobile_bar" })}
          >
            <PinIcon className="h-4 w-4" />
            Enquire &amp; visit
          </Link>
        )}
      </div>
    </nav>
  );
}
