import { brand, contact, onlineStore, social } from "@/content/site";
import { absoluteUrl } from "@/lib/seo";

/**
 * Structured data.
 *
 * The rule this file follows is that a property is emitted only when the business has actually
 * supplied the fact behind it. A telephone, an opening-hours specification or a geo point that
 * nobody confirmed is worse than none at all — Google surfaces it in the knowledge panel and on
 * Maps, where a wrong number is a lost customer and a support burden. So every optional field
 * below is spread in conditionally.
 */

const ORG_ID = () => `${absoluteUrl("/")}#organization`;
const WEBSITE_ID = () => `${absoluteUrl("/")}#website`;

type Json = Record<string, unknown>;

function compact(input: Json): Json {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined && v !== null));
}

const sameAs = [social.instagram, social.facebook, social.youtube, contact.justdialUrl, contact.googleBusinessUrl]
  .filter((v): v is string => Boolean(v));

const postalAddress = () =>
  compact({
    "@type": "PostalAddress",
    streetAddress: contact.addressLines?.join(", "),
    addressLocality: contact.locality,
    addressRegion: contact.administrativeArea,
    postalCode: contact.postalCode,
    addressCountry: brand.countryCode,
  });

/**
 * The business itself. Typed as ClothingStore — a LocalBusiness subtype — because RADHA is a
 * physical shop selling fabric and tailoring from one address in Mannargudi, and the more specific
 * type carries more weight in local results than a bare LocalBusiness.
 */
export function organizationSchema(areaServed: string[]) {
  return compact({
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": ORG_ID(),
    name: brand.name,
    alternateName: `${brand.displayName} — ${brand.tagline}`,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/radha-wordmark.png").replace(/\/$/, ""),
    image: absoluteUrl("/images/og-default.jpg").replace(/\/$/, ""),
    description:
      `Men's fabric and tailoring house in ${brand.city}, ${brand.region}. Custom suits, blazers, ` +
      "shirts, trousers and wedding wear made to measure, plus bulk and corporate uniform orders.",
    slogan: brand.statement,
    address: postalAddress(),
    areaServed: areaServed.map((name) => ({ "@type": "Place", name })),
    currenciesAccepted: "INR",
    telephone: contact.phone ? `+${contact.phone}` : undefined,
    email: contact.email ?? undefined,
    hasMap: contact.mapDirectionsUrl ?? undefined,
    geo: contact.geo
      ? { "@type": "GeoCoordinates", latitude: contact.geo.latitude, longitude: contact.geo.longitude }
      : undefined,
    openingHours: contact.openingHours ?? undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    knowsLanguage: ["ta", "en"],
    // What the shop does, as a catalogue of services rather than of products. Every entry is an
    // Offer with no price, because no price has been published — an offer without a price is a
    // normal and honest thing in schema.org; an invented one is not.
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${brand.name} — men's tailoring`,
      itemListElement: offerCatalog.map((group) => ({
        "@type": "OfferCatalog",
        name: group.name,
        itemListElement: group.items.map((item) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: item.name,
            url: absoluteUrl(item.path),
          },
        })),
      })),
    },
  });
}

/**
 * The service catalogue, grouped the way the site groups it.
 *
 * Kept as a literal here rather than imported from the content modules: this is the one place in
 * the codebase where a change should be a deliberate statement about what the business offers,
 * not a side effect of editing marketing copy.
 */
const offerCatalog = [
  {
    name: "Custom men's clothing",
    items: [
      { name: "Custom men's suits", path: "/suits" },
      { name: "Custom men's blazers", path: "/blazers" },
      { name: "Custom men's shirts", path: "/shirts" },
      { name: "Custom men's trousers", path: "/trousers" },
      { name: "Wedding and groom wear", path: "/wedding" },
    ],
  },
  {
    name: "Tailoring services",
    items: [
      { name: "Men's tailoring", path: "/services/mens-tailoring" },
      { name: "Made-to-measure clothing", path: "/services/custom-clothing" },
    ],
  },
  {
    name: "Bulk and uniform orders",
    items: [
      { name: "Corporate and company uniforms", path: "/bulk-orders/corporate" },
      { name: "School uniforms", path: "/bulk-orders/schools" },
      { name: "College and campus clothing", path: "/bulk-orders/colleges" },
      { name: "Institutional and hospitality uniforms", path: "/bulk-orders/institutions" },
    ],
  },
];

export function websiteSchema() {
  // No SearchAction: the site has no search endpoint, and claiming one that does not resolve is
  // an invitation for Google to render a broken sitelinks search box.
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID(),
    url: absoluteUrl("/"),
    name: brand.name,
    inLanguage: "en-IN",
    publisher: { "@id": ORG_ID() },
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** A tailoring service. No price or delivery estimate is ever attached — none has been confirmed. */
export function serviceSchema(input: { name: string; description: string; path: string; serviceType: string }) {
  return compact({
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    serviceType: input.serviceType,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: { "@id": ORG_ID() },
    areaServed: { "@type": "Country", name: brand.country },
  });
}

/** Body copy may carry inline `[label](/path)` links; structured data wants the sentence. */
const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1");

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: plain(faq.answer) },
    })),
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  section?: string;
  wordCount?: number;
  readingMinutes?: number;
}) {
  return compact({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    articleSection: input.section,
    wordCount: input.wordCount,
    timeRequired: input.readingMinutes ? `PT${input.readingMinutes}M` : undefined,
    // The journal has no per-article photography, so every article shares the brand card rather
    // than claiming an image of its own.
    image: absoluteUrl("/images/og-default.jpg").replace(/\/$/, ""),
    author: { "@id": ORG_ID() },
    publisher: { "@id": ORG_ID() },
    inLanguage: "en-IN",
  });
}

/** The online store, linked as a separate presence rather than described as stock we can list. */
export function onlineStoreSchema() {
  if (!onlineStore.url) return null;
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: `${brand.name} Online`,
    url: onlineStore.url,
    parentOrganization: { "@id": ORG_ID() },
  };
}
