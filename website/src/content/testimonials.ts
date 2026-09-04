import type { Testimonial } from "@/content/types";

/**
 * Customer stories.
 *
 * This array is empty, and that is the point. RADHA has not yet supplied verified testimonials,
 * and a website that invents them — or dresses up a generic quote as a real customer — is doing
 * the one thing a premium brand cannot afford to be caught doing.
 *
 * The section renders regardless: while the array is empty it shows an honest invitation to be
 * the first customer whose words appear here. Push real, permissioned quotes into this array and
 * the same section becomes a testimonial carousel with no other change.
 *
 * Each entry needs, at minimum, the customer's own words and their name. Profession, town and the
 * garment they ordered are shown when supplied — they are what make a story credible to the next
 * reader, who is usually a professional from the same district.
 */
export const testimonials: Testimonial[] = [];

export const testimonialsCopy = {
  eyebrow: "Customer stories",
  title: "The words we have not written yet",
  /** Shown while `testimonials` is empty. */
  emptyLead:
    "We would rather show you nothing than show you something we made up. Customer stories will appear here as our customers give them to us, in their own words and with their permission.",
  emptyCta: "If we have made something for you, we would be glad to hear how it wore.",
  /** Shown once real testimonials exist. */
  filledLead:
    "Professionals across the delta, in their own words, about the garments we made for them.",
};
