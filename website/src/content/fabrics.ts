import type { Faq } from "@/content/types";

/**
 * The fabric collection.
 *
 * What this page can honestly do is explain the families of cloth a men's tailor works with and
 * what each is good for. What it must not do is publish an inventory: RADHA has not supplied
 * fabric names, mills, compositions, weights or prices, and stock at a fabric counter changes
 * week to week. So every entry below describes a category and its behaviour, and the page tells
 * the visitor plainly that what is on the shelf today is a question for the shop.
 *
 * When real fabric data arrives — names, images, availability — it drops into `FabricFamily.items`
 * without the page changing.
 */

export type FabricFamily = {
  slug: string;
  name: string;
  /** What garments this cloth is for. */
  usedFor: string[];
  summary: string;
  behaviour: string;
  /** Populated when RADHA supplies real fabric records. Empty means "ask at the shop". */
  items: {
    name: string;
    description: string;
    image?: { src: string; width: number; height: number; alt: string };
  }[];
};

export const fabricFamilies: FabricFamily[] = [
  {
    slug: "shirting",
    name: "Shirting",
    usedFor: ["Custom shirts", "Uniform shirts", "Wedding shirting"],
    summary:
      "The cloth worn closest to the skin and for the longest hours, where weight and weave matter more than pattern.",
    behaviour:
      "A denser, crisper shirting holds a collar upright and reads formal, at the cost of running warm. A softer, more open cotton is kinder through a Tamil Nadu afternoon but asks more of the collar construction. Texture forgives a long day; a smooth finish photographs well and shows every crease.",
    items: [],
  },
  {
    slug: "suiting",
    name: "Suiting",
    usedFor: ["Two and three-piece suits", "Formal trousers"],
    summary:
      "Cloth with enough structure to hold a shoulder and a crease across a full working day.",
    behaviour:
      "A hard-finished suiting keeps its line under office light and recovers from a day at a desk. An opener, softer weave is more comfortable in heat and creases sooner. Depth of colour matters more than pattern in a suit that has to work all week.",
    items: [],
  },
  {
    slug: "blazer-cloth",
    name: "Blazer cloth",
    usedFor: ["Single and double-breasted blazers", "Occasion jackets"],
    summary:
      "Where a suit wants evenness, a blazer is allowed to be interesting. This is the cloth with visible character.",
    behaviour:
      "Structure in the weave is what tells the eye a jacket stands on its own rather than being half a suit. A little texture also hides wear and travels well, which is why one good blazer usually outlives three plain ones.",
    items: [],
  },
  {
    slug: "wedding-cloth",
    name: "Wedding and occasion cloth",
    usedFor: ["Wedding suits", "Reception blazers", "Groom wear"],
    summary:
      "Chosen against two things at once — how it photographs, and how it wears over a very long day.",
    behaviour:
      "A cloth with sheen catches evening light beautifully and can look severe in flat daylight. A heavier cloth holds its shape through a ceremony and asks something of the wearer in the afternoon. This is the family most worth seeing in person before deciding.",
    items: [],
  },
  {
    slug: "uniform-cloth",
    name: "Uniform and workwear cloth",
    usedFor: ["Corporate uniforms", "School and college uniforms", "Institutional and factory wear"],
    summary:
      "Cloth judged on how it looks after fifty washes rather than on how it looks on the shelf.",
    behaviour:
      "Colour hold, shrinkage, and how the cloth behaves under repeated industrial laundering are what decide a uniform fabric. For bulk orders these are the questions we work through with you before quantities are discussed.",
    items: [],
  },
];

/**
 * The four shirting shades photographed for the brand — real RADHA product imagery, so they are
 * shown as what they are: the colours the monogrammed shirt was made in, not a colour card.
 */
export const shirtingShades = [
  { name: "White", src: "/images/shirting-white.webp", alt: "White RADHA shirt pocket with the monogram embroidered in navy" },
  { name: "Light blue", src: "/images/shirting-light-blue.webp", alt: "Light blue RADHA shirt pocket with the monogram embroidered in navy" },
  { name: "Olive", src: "/images/shirting-olive.webp", alt: "Olive RADHA shirt pocket with the monogram embroidered in gold" },
  { name: "Navy", src: "/images/shirting-navy.webp", alt: "Navy RADHA shirt pocket with the monogram embroidered in gold" },
];

export const fabricNote =
  "Fabric at a working counter changes with the season and with what has just come in. Rather than publish a catalogue that would be out of date by the time you read it, we would rather show you what is on the shelf today — either at the shop, or by telling us what you are looking for and letting us come back to you.";

export const fabricFaqs: Faq[] = [
  {
    question: "Can I bring my own fabric?",
    answer:
      "Bring it to the shop and we will look at it with you. Whether a particular cloth will make the garment you have in mind depends on its weight and weave, so it is a conversation to have with the fabric in hand.",
  },
  {
    question: "How do I choose a fabric for a suit?",
    answer:
      "Start with where the suit is going. A suit worn five days a week needs a cloth that holds a crease and recovers overnight; a wedding suit is chosen for how it behaves under the light it will be photographed in. Colour is the last decision, not the first.",
  },
  {
    question: "Do you keep a fixed fabric catalogue?",
    answer:
      "No. Stock at a fabric counter turns over, and publishing a list that goes stale helps nobody. Tell us what you need and we will tell you what we have.",
  },
];
