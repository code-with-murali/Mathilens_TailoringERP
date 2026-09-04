"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Every call to action on the site.
 *
 * Three variants and no more, because a page with five kinds of button has no primary action.
 * `solid` is the one thing we want you to do on this screen; `outline` is the reasonable
 * alternative beside it; `quiet` is a text link that happens to be important.
 *
 * Buttons are rectangular. A rounded pill reads as software, and this is a clothing house.
 */

type Variant = "solid" | "outline" | "quiet";
type Tone = "light" | "dark";

const base =
  "u-eyebrow inline-flex items-center justify-center gap-3 transition-colors duration-300 " +
  "disabled:opacity-50 disabled:pointer-events-none";

const styles: Record<Variant, Record<Tone, string>> = {
  solid: {
    light: "bg-ink text-cream px-8 py-4 hover:bg-ink-soft",
    dark: "bg-gold text-ink px-8 py-4 hover:bg-gold-soft",
  },
  outline: {
    light: "border border-ink/25 text-ink px-8 py-4 hover:border-ink hover:bg-ink hover:text-cream",
    dark: "border border-cream/30 text-cream px-8 py-4 hover:border-gold hover:text-gold-soft",
  },
  quiet: {
    light: "u-underline text-ink pb-1 hover:text-gold-deep",
    dark: "u-underline text-cream pb-1 hover:text-gold-soft",
  },
};

export function CtaLink({
  href,
  children,
  variant = "solid",
  tone = "light",
  event,
  eventParams,
  external,
  className = "",
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  tone?: Tone;
  /** Fires a GA4 event on click. Nothing is sent unless analytics is configured. */
  event?: AnalyticsEvent;
  eventParams?: Record<string, string>;
  external?: boolean;
  className? : string;
  ariaLabel?: string;
}) {
  const classes = [base, styles[variant][tone], className].filter(Boolean).join(" ");
  const onClick = event ? () => track(event, eventParams) : undefined;

  if (external || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        aria-label={ariaLabel}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

/**
 * The arrow used on quiet links. An inline SVG rather than a character, so it can be animated and
 * so it never depends on a font having the glyph.
 */
export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 12"
      className={`h-2 w-5 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <path d="M0 6h22M17 1l5 5-5 5" />
    </svg>
  );
}
