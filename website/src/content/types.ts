/**
 * The shapes every content module is written against.
 *
 * Content lives as typed data rather than as JSX inside pages so that a CMS, or the ERP itself,
 * can supply the same objects later without a single page component changing. A page's job is to
 * lay out a `GarmentPage`; where that object came from is not its concern.
 */

export type ImageAsset = {
  src: string;
  width: number;
  height: number;
  /** Written as a description of the garment, not as a keyword dump. */
  alt: string;
};

/**
 * What to show where there is no photograph yet.
 *
 * There is one photographic subject in the supplied brand assets — the monogrammed shirt — so
 * most categories have no image and inventing one would misrepresent the work. A plate is the
 * honest alternative: a woven navy or cream panel carrying the monogram and the category name,
 * designed to look deliberate rather than empty. Swap `image` in on the same object the day real
 * photography exists and every card, hero and grid picks it up.
 */
export type Plate = {
  tone: "ink" | "cream" | "gold";
  /** Two or three words set in the display serif across the plate. */
  motif: string;
};

export type Faq = { question: string; answer: string };

export type Detail = { title: string; text: string };

export type Crumb = { name: string; path: string };

export type GarmentPage = {
  slug: string;
  /** Path including the leading slash — garments sit at the root for short, clean URLs. */
  path: string;
  navLabel: string;
  /** H1. */
  title: string;
  eyebrow: string;
  seoTitle: string;
  seoDescription: string;
  /** The opening paragraph under the H1. */
  lead: string;
  /** One line for category cards elsewhere on the site. */
  cardDescription: string;
  cardCta: string;
  image?: ImageAsset;
  plate: Plate;
  /**
   * Overrides the site-wide social card. Set it only where a page has genuine photography of its
   * own — a shared brand card is better than a card that misrepresents the page.
   */
  ogImage?: ImageAsset;
  sections: { heading: string; body: string[] }[];
  /** The decisions a customer makes with us — the substance of a made-to-measure garment. */
  details: Detail[];
  detailsHeading: string;
  occasionsHeading: string;
  occasions: string[];
  faqs: Faq[];
  /** Slugs of the other garment pages worth reading next. */
  related: string[];
};

export type BulkSegment = {
  slug: string;
  path: string;
  navLabel: string;
  title: string;
  eyebrow: string;
  seoTitle: string;
  seoDescription: string;
  lead: string;
  cardDescription: string;
  sections: { heading: string; body: string[] }[];
  garments: string[];
  considerations: Detail[];
  faqs: Faq[];
  plate: Plate;
};

export type JournalPost = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  category: string;
  /** ISO date. Editorial publication date, set by hand when the article is written. */
  datePublished: string;
  dateModified?: string;
  readingMinutes: number;
  /** Rendered by <ArticleBody>; a closed block union keeps the journal CMS-portable. */
  body: Block[];
  related?: string[];
};

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; text: string };

/**
 * A verified customer story. The array in `testimonials.ts` is empty on purpose: nothing is
 * published here until a real customer has given real words and real permission.
 */
export type Testimonial = {
  quote: string;
  name: string;
  profession?: string;
  location?: string;
  garment?: string;
  image?: ImageAsset;
};
