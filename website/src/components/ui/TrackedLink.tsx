"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * A link that reports the click.
 *
 * The cards on this site — categories, journal articles — are the mid-funnel: which garment a
 * visitor opens first is the most informative thing they do before enquiring. Those cards live in
 * server components, so this is the smallest possible client boundary that lets them report,
 * rather than making a whole grid client-side for the sake of one handler.
 */
export function TrackedLink({
  href,
  event,
  params,
  className = "",
  children,
}: {
  href: string;
  event: AnalyticsEvent;
  params?: Record<string, string>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => track(event, params)}>
      {children}
    </Link>
  );
}
