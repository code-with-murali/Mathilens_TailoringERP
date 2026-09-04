import type { Metadata } from "next";
import { brand, searchConsoleVerification, siteUrl } from "@/content/site";
import { asset } from "@/lib/asset";

/** The social preview card, derived from the brand creative by scripts/build-assets.py. */
export const defaultOgImage = {
  src: "/images/og-default.jpg",
  width: 1200,
  height: 630,
  alt: `${brand.name} — ${brand.tagline}, ${brand.city}, ${brand.region}`,
};

export function absoluteUrl(path: string) {
  const clean = path === "/" ? "/" : `/${path.replace(/^\/|\/$/g, "")}/`;
  return `${siteUrl}${clean}`;
}

type PageSeo = {
  /** Without the brand suffix — `pageMetadata` appends it. Keep under ~45 characters. */
  title: string;
  description: string;
  /** Route path, e.g. "/suits". */
  path: string;
  /**
   * Overrides the default social card when a page has its own imagery. Takes the same
   * `ImageAsset` shape the content modules use, so a page can pass its hero image straight in.
   */
  image?: { src: string; width: number; height: number; alt: string };
  /** Set on thin utility pages (legal, thank-you) that should stay out of the index. */
  noIndex?: boolean;
  /**
   * Suppresses the "| RADHA APPARELS" suffix. Only the home page needs this — its title already
   * names the brand, and the template would print it twice.
   */
  absoluteTitle?: boolean;
};

/**
 * One place that builds a page's `<head>`, so no page can ship without a canonical URL, a
 * description or a social card. Titles are suffixed rather than written out per page — that keeps
 * the brand in every SERP entry without any page having to remember to add it.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noIndex,
  absoluteTitle,
}: PageSeo): Metadata {
  const url = absoluteUrl(path);
  const og = image ?? defaultOgImage;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      siteName: brand.name,
      locale: "en_IN",
      url,
      title: `${title} | ${brand.name}`,
      description,
      images: [
        {
          url: absoluteUrl(og.src).replace(/\/$/, ""),
          width: og.width,
          height: og.height,
          alt: og.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brand.name}`,
      description,
      images: [absoluteUrl(og.src).replace(/\/$/, "")],
    },
  };
}

/** The root layout's metadata — the parts every page inherits rather than repeats. */
export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brand.name} — Premium Men's Custom Clothing in ${brand.city}`,
    template: `%s | ${brand.name}`,
  },
  description:
    `Men's fabric and tailoring house in ${brand.city}, ${brand.region}. Custom suits, blazers, ` +
    "shirts, trousers and wedding wear cut to measure, plus bulk and uniform orders.",
  applicationName: brand.name,
  authors: [{ name: brand.displayName }],
  creator: brand.displayName,
  publisher: brand.displayName,
  category: "Men's custom clothing",
  formatDetection: { telephone: false, address: false, email: false },
  ...(searchConsoleVerification
    ? { verification: { google: searchConsoleVerification } }
    : {}),
  icons: {
    icon: [{ url: asset("/icon.png"), sizes: "512x512", type: "image/png" }],
    apple: [{ url: asset("/apple-icon.png"), sizes: "180x180", type: "image/png" }],
  },
};
