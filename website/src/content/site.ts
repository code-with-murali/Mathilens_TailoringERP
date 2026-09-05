/**
 * The single source of truth for everything the website claims about the business.
 *
 * Anything RADHA has not supplied is `null` here rather than guessed. Components read these
 * values and simply do not render the affected element when it is null — a missing phone number
 * removes the call button rather than printing a placeholder at a visitor. `ConfigChecklist`
 * surfaces what is still missing, but only while running `next dev`, so an unconfigured value is
 * loud to whoever is building the site and invisible to whoever is reading it.
 *
 * Fill these in from `.env.local` (see `.env.example`) or by editing this file directly.
 */

/** Set NEXT_PUBLIC_SITE_URL before deploying: canonical URLs, OG tags and the sitemap use it. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const isSiteUrlConfigured = Boolean(process.env.NEXT_PUBLIC_SITE_URL);

type Nullable<T> = T | null;

/** Read an env var, treating blank and the literal word "null" as "not configured". */
function env(name: string): Nullable<string> {
  const value = process.env[name];
  if (!value || value.trim() === "" || value.trim().toLowerCase() === "null") return null;
  return value.trim();
}

export const brand = {
  name: "RADHA APPARELS",
  /** Sentence-case form, for running prose where the all-caps lockup would shout. */
  displayName: "Radha Apparels",
  shortName: "RADHA",
  tagline: "Fabric & Tailoring",
  positioning: "Premium men's custom clothing",
  /** The brand line. Used sparingly — the hero and the footer, not every section. */
  statement: "Tailored in Mannargudi. Delivered worldwide.",
  city: "Mannargudi",
  region: "Tamil Nadu",
  country: "India",
  countryCode: "IN",
} as const;

/**
 * Contact channels. Every one of these is `null` until RADHA confirms the real value — see the
 * note at the top of this file. `whatsapp` and `phone` take the number in international format
 * without punctuation, e.g. "919876543210".
 */
export const contact = {
  phone: env("NEXT_PUBLIC_PHONE") as Nullable<string>,
  whatsapp: env("NEXT_PUBLIC_WHATSAPP") as Nullable<string>,
  email: env("NEXT_PUBLIC_EMAIL") as Nullable<string>,
  /** Street address lines, shop-first. Locality and region below are known and always shown. */
  addressLines: null as Nullable<string[]>,
  postalCode: null as Nullable<string>,
  locality: brand.city,
  administrativeArea: brand.region,
  /** e.g. "Mon–Sat 10:00–20:00" once confirmed; never guessed. */
  openingHours: null as Nullable<string[]>,
  /** Google Maps "Embed a map" iframe src. */
  mapEmbedUrl: env("NEXT_PUBLIC_MAP_EMBED_URL") as Nullable<string>,
  /** Google Maps link used by the "Get directions" button. */
  mapDirectionsUrl: env("NEXT_PUBLIC_MAP_DIRECTIONS_URL") as Nullable<string>,
  /** Google Business Profile "write a review" or profile link. */
  googleBusinessUrl: env("NEXT_PUBLIC_GOOGLE_BUSINESS_URL") as Nullable<string>,
  /** Justdial listing, once the official URL is known. */
  justdialUrl: env("NEXT_PUBLIC_JUSTDIAL_URL") as Nullable<string>,
  /** Latitude/longitude of the shop, for LocalBusiness structured data. */
  geo: null as Nullable<{ latitude: number; longitude: number }>,
} as const;

/** The separate online shopping platform. Null until it is live. */
export const onlineStore = {
  url: env("NEXT_PUBLIC_STORE_URL") as Nullable<string>,
  /** Shown on /shop while the store is still being built. */
  status: env("NEXT_PUBLIC_STORE_URL") ? ("live" as const) : ("in-development" as const),
} as const;

/**
 * Public channels, in the order they are shown.
 *
 * The two community entries are invite links to a group, not the shop's own number: joining a
 * WhatsApp community is a different act from messaging the shop, so it is configured separately
 * from `contact.whatsapp` and never falls back to it. A community with no invite link simply does
 * not appear, in keeping with the rule at the top of this file.
 */
export const social = {
  instagram: env("NEXT_PUBLIC_INSTAGRAM_URL") as Nullable<string>,
  whatsappCommunity: env("NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL") as Nullable<string>,
  telegram: env("NEXT_PUBLIC_TELEGRAM_URL") as Nullable<string>,
  facebook: env("NEXT_PUBLIC_FACEBOOK_URL") as Nullable<string>,
  youtube: env("NEXT_PUBLIC_YOUTUBE_URL") as Nullable<string>,
} as const;

export type SocialKey = keyof typeof social;

export const socialLabels: Record<SocialKey, string> = {
  instagram: "Instagram",
  whatsappCommunity: "WhatsApp community",
  telegram: "Telegram community",
  facebook: "Facebook",
  youtube: "YouTube",
};

/** Where the enquiry form posts. Without it the form falls back to WhatsApp, then to email. */
export const enquiryEndpoint = env("NEXT_PUBLIC_ENQUIRY_ENDPOINT");

/** GA4 measurement id, "G-XXXXXXX". No script is loaded and no event is sent without it. */
export const analyticsId = env("NEXT_PUBLIC_GA4_ID");

/** Search Console HTML tag verification token, if verifying by meta tag rather than DNS. */
export const searchConsoleVerification = env("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION");

export const whatsappLink = (message?: string) =>
  contact.whatsapp
    ? `https://wa.me/${contact.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ""}`
    : null;

export const telLink = contact.phone ? `tel:+${contact.phone}` : null;
export const mailLink = contact.email ? `mailto:${contact.email}` : null;

/** Everything still awaiting a real value, for the development-only checklist. */
export function missingConfiguration(): string[] {
  const missing: string[] = [];
  if (!isSiteUrlConfigured) missing.push("NEXT_PUBLIC_SITE_URL — canonical URLs, OG tags, sitemap");
  if (!contact.phone) missing.push("NEXT_PUBLIC_PHONE — call button");
  if (!contact.whatsapp) missing.push("NEXT_PUBLIC_WHATSAPP — WhatsApp buttons, enquiry fallback");
  if (!contact.email) missing.push("NEXT_PUBLIC_EMAIL — email link");
  if (!contact.addressLines) missing.push("contact.addressLines — shop street address");
  if (!contact.openingHours) missing.push("contact.openingHours — business hours");
  if (!contact.geo) missing.push("contact.geo — LocalBusiness coordinates");
  if (!contact.mapEmbedUrl) missing.push("NEXT_PUBLIC_MAP_EMBED_URL — map on /contact");
  if (!contact.mapDirectionsUrl) missing.push("NEXT_PUBLIC_MAP_DIRECTIONS_URL — directions button");
  if (!contact.justdialUrl) missing.push("NEXT_PUBLIC_JUSTDIAL_URL — Justdial listing link");
  if (!onlineStore.url) missing.push("NEXT_PUBLIC_STORE_URL — online store links");
  if (!social.instagram) missing.push("NEXT_PUBLIC_INSTAGRAM_URL");
  if (!social.whatsappCommunity)
    missing.push("NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL — WhatsApp community invite");
  if (!social.telegram) missing.push("NEXT_PUBLIC_TELEGRAM_URL — Telegram community invite");
  if (!social.facebook) missing.push("NEXT_PUBLIC_FACEBOOK_URL");
  if (!social.youtube) missing.push("NEXT_PUBLIC_YOUTUBE_URL");
  if (!enquiryEndpoint) missing.push("NEXT_PUBLIC_ENQUIRY_ENDPOINT — enquiry form delivery");
  if (!analyticsId) missing.push("NEXT_PUBLIC_GA4_ID — Google Analytics 4");
  return missing;
}
