import { analyticsId } from "@/content/site";

/**
 * Conversion tracking.
 *
 * Every event the site can send is named here. Keeping the union closed means a component cannot
 * invent an event name that nobody is reporting on, and the list doubles as the specification for
 * whoever configures the GA4 key events.
 *
 * Nothing fires unless NEXT_PUBLIC_GA4_ID is set — no queue, no console noise, no phantom events.
 */
export type AnalyticsEvent =
  | "whatsapp_click"
  | "phone_click"
  | "email_click"
  | "directions_click"
  | "store_click"
  | "enquiry_start"
  | "enquiry_submit"
  | "enquiry_error"
  | "bulk_enquiry_submit"
  | "category_click"
  | "journal_click"
  | "social_click"
  | "nav_click";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, params: Params = {}) {
  if (!analyticsId || typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

