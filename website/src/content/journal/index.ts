import type { JournalPost } from "@/content/types";
import { blazerFit } from "./blazer-fit";
import { digitalMeasurements } from "./digital-measurements";
import { professionalWardrobe } from "./professional-wardrobe";
import { professionalsGuide } from "./professionals-guide";
import { readyMadeVsCustom } from "./ready-made-vs-custom";
import { suitFabric } from "./suit-fabric";
import { suitVsBlazer } from "./suit-vs-blazer";
import { uniformPlanning } from "./uniform-planning";
import { weddingSuit } from "./wedding-suit";

/**
 * The journal.
 *
 * One file per article, collected here, so an article can be written, reviewed and replaced on its
 * own — and so this index is the only thing a CMS integration has to replace later.
 *
 * The editorial standard is deliberately restrictive: an article is published here only if it
 * teaches a reader something a tailor actually knows. Nine considered pieces will earn more
 * search visibility, and far more trust, than a hundred generated ones.
 */
const posts: JournalPost[] = [
  digitalMeasurements,
  uniformPlanning,
  professionalsGuide,
  professionalWardrobe,
  readyMadeVsCustom,
  suitFabric,
  weddingSuit,
  suitVsBlazer,
  blazerFit,
];

/** Newest first. Dates are set by hand in each article file. */
export const journalPosts = [...posts].sort((a, b) =>
  b.datePublished.localeCompare(a.datePublished),
);

export const journalBySlug = Object.fromEntries(journalPosts.map((p) => [p.slug, p])) as Record<
  string,
  JournalPost
>;

export const journalSlugs = journalPosts.map((p) => p.slug);

export const journalCategories = Array.from(new Set(journalPosts.map((p) => p.category))).sort();

export const journalCopy = {
  eyebrow: "Journal",
  title: "Notes from the workshop",
  lead:
    "What we get asked across the counter, written down properly: how garments should fit, how cloth behaves, and how to plan an order — whether it is one suit or four hundred shirts.",
};
