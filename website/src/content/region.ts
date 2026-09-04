import { brand } from "@/content/site";

/**
 * The service region.
 *
 * Read this before editing: RADHA has one shop, and it is in Mannargudi. The towns below are
 * places customers travel from, not places RADHA has premises in. Every string here is phrased so
 * that it stays true when quoted out of context, because that is exactly what a search result
 * snippet does to it.
 */

export type Town = {
  name: string;
  /** One line of genuine local orientation — no invented distances or drive times. */
  note: string;
};

export const homeTown: Town = {
  name: "Mannargudi",
  note: "Where the shop is, and where every garment is cut, made and fitted.",
};

export const deltaTowns: Town[] = [
  { name: "Thiruvarur", note: "District headquarters, and a regular journey for customers ordering formal wear." },
  { name: "Thiruthuraipoondi", note: "Customers travel in for suiting, shirting and wedding orders." },
  { name: "Muthupet", note: "Coastal end of the delta, within an easy visit for a fitting." },
  { name: "Pattukottai", note: "A steady source of professional and wedding customers." },
  { name: "Kumbakonam", note: "Wedding orders in particular are planned with families from here." },
  { name: "Thanjavur", note: "The delta's largest centre, and a familiar journey to the shop." },
];

/** Used for LocalBusiness `areaServed`. Mannargudi first, because that is where the shop is. */
export const areaServed = [homeTown.name, ...deltaTowns.map((t) => t.name), brand.region, brand.country];

export const regionCopy = {
  eyebrow: "The delta",
  title: "Based in Mannargudi. Worn across the delta.",
  lead:
    "RADHA has one shop, and it is in Mannargudi. What travels is the work — customers come to us from across the Thanjavur delta for suiting, shirting and wedding orders, and go home in something cut for them here.",
  clarification:
    "We do not have branches in these towns. They are where our customers come from, which is a different and, we think, better thing to be able to say.",
};
