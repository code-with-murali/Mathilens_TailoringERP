import type { Detail, Faq } from "@/content/types";

/**
 * The two service pages that sit under /services.
 *
 * These carry the broad search intent — "men's tailoring", "custom clothing" — that the garment
 * pages are too specific to answer, and they are where a visitor who does not yet know what they
 * want is sent. Everything they claim is a description of the work, not of its outcome.
 */

export type ServicePage = {
  slug: string;
  path: string;
  title: string;
  eyebrow: string;
  seoTitle: string;
  seoDescription: string;
  serviceType: string;
  lead: string;
  cardDescription: string;
  sections: { heading: string; body: string[] }[];
  includes: Detail[];
  includesHeading: string;
  faqs: Faq[];
};

export const servicePages: ServicePage[] = [
  {
    slug: "mens-tailoring",
    path: "/services/mens-tailoring",
    title: "Men's tailoring",
    eyebrow: "Service",
    seoTitle: "Men's Tailoring in Mannargudi",
    seoDescription:
      "Men's tailoring at RADHA APPARELS, Mannargudi. Suits, blazers, shirts and trousers cut to your measurements, with fabric selection, fitting and alteration at our shop.",
    serviceType: "Men's tailoring",
    lead:
      "Everything a man wears above the waist and below it, cut to his own measurements: this is the work the shop was built around, and the work every other service here grows out of.",
    cardDescription:
      "The core of the house — suits, blazers, shirts and trousers, measured and made in Mannargudi.",
    sections: [
      {
        heading: "What a tailor is actually for",
        body: [
          "A tailor is not a shop that sells clothes slightly differently. A tailor is the person who decides where a shoulder ends, how much room a chest needs, and where a waistband should sit on the particular body standing in front of him — and then makes the garment to those answers.",
          "That is a service, not a product. It is why the conversation at the counter matters as much as the machine in the back, and why the same cloth makes a different garment for two different men.",
        ],
      },
      {
        heading: "Full-wardrobe tailoring",
        body: [
          "We make the whole of a man's formal wardrobe: [suits](/suits), [blazers](/blazers), [shirts](/shirts) and [trousers](/trousers) to go with any of them. Because it is all made in one place, pieces made months apart still work together — the trouser cut this year is drafted from the same record as the jacket cut last year.",
          "Alterations are part of the service too. A garment that no longer sits as it did is a job for the same hands that made it.",
        ],
      },
      {
        heading: "Made for the working professional",
        body: [
          "Most of what leaves this shop is worn to work: to a courtroom, a consulting room, a classroom, a branch office, a factory floor — we have written a [dressing guide for each of those professions](/journal/formal-dressing-guide-for-professionals). Clothing worn that hard is judged on whether it still looks composed at six in the evening, not on how it looked at nine in the morning.",
          "That standard — comfortable, quiet, correct all day — is what we tailor to.",
        ],
      },
    ],
    includesHeading: "What the service covers",
    includes: [
      { title: "Consultation", text: "What the garment is for, and what it has to work with." },
      { title: "Fabric selection", text: "At the counter, in daylight, with the weight in your hand." },
      { title: "Measurement", text: "Taken by hand and recorded against your name in our system." },
      { title: "Customisation", text: "Collar, cuff, lapel, pocket, lining, break — written onto the order." },
      { title: "Tailoring", text: "Cut and made at the Mannargudi workshop." },
      { title: "Trial and alteration", text: "Fitted on you and corrected before it is finished." },
      { title: "Quality check and finishing", text: "Checked over, pressed and packed." },
      { title: "Repeat orders", text: "Started from your record rather than from the beginning." },
    ],
    faqs: [
      {
        question: "What garments do you tailor for men?",
        answer:
          "Suits, blazers, shirts, trousers and wedding and groom wear, along with alterations to garments we have made. Bulk and uniform orders are handled through the bulk orders section.",
      },
      {
        question: "Do you alter clothes as well as make them?",
        answer:
          "Yes. Alteration is part of the tailoring service — a garment that has stopped sitting correctly is work for the same hands that cut it. Bring it to the shop and we will look at it with you.",
      },
      {
        question: "Where is your tailoring done?",
        answer:
          "At our shop in Mannargudi, Tamil Nadu. Consultation, fabric selection, measurement, cutting, tailoring, trial and finishing all happen there.",
      },
    ],
  },

  {
    slug: "custom-clothing",
    path: "/services/custom-clothing",
    title: "Custom clothing",
    eyebrow: "Service",
    seoTitle: "Custom Men's Clothing, Made to Measure",
    seoDescription:
      "Made-to-measure men's clothing from RADHA APPARELS, Mannargudi. Personalised fit, fabric and detailing on every garment, with measurements recorded for repeat orders.",
    serviceType: "Made-to-measure clothing",
    lead:
      "Custom clothing is not a more expensive way to buy the same shirt. It is a different transaction: you decide what the garment is, and the garment is made afterwards.",
    cardDescription:
      "Made to measure from the cloth up — fit, fabric and detail decided by you, recorded for next time.",
    sections: [
      {
        heading: "Ready-made, altered, custom",
        body: [
          "[Ready-made](/journal/ready-made-vs-custom-tailored) is a finished garment in a standard size. Altered is that same garment with its hem and waist moved, which fixes length and never fixes shape. Custom is a garment that did not exist until your measurements and your choices defined it.",
          "The difference shows in exactly the places alteration cannot reach: the shoulder, the armhole, the chest, the rise. Those are drafted, not adjusted.",
        ],
      },
      {
        heading: "Personalisation that is not decoration",
        body: [
          "Some customisation is visible — a collar shape, a lapel, a monogram on a pocket. Most of it is not. Whether a sleeve is cut for a man who spends the day reaching across a desk, whether a trouser is cut for someone on his feet, whether a jacket allows for a phone in the inside pocket without breaking its line: these are choices too, and they are the ones you feel.",
          "We ask about them because they are the difference between a garment that fits and a garment you forget you are wearing.",
        ],
      },
      {
        heading: "Made once, reorderable after",
        body: [
          "The first custom order is the longest, because it is where [the measuring and the deciding](/process) happen. Everything after it is quicker: your record already holds the measurements, the fit notes from your trial, and what was made last time.",
          "That is the practical case for having clothes made rather than bought. The second order is easier than the first, and the fifth is easier still.",
        ],
      },
    ],
    includesHeading: "What you decide",
    includes: [
      { title: "The garment", text: "Suit, blazer, shirt, trouser, or a set planned together." },
      { title: "The cloth", text: "Chosen for the occasion, the climate and how hard it will be worn." },
      { title: "The fit", text: "Drafted from your measurements, with the room you actually want." },
      { title: "The details", text: "Collar, cuff, pocket, lapel, lining, buttons, break." },
      { title: "The personalisation", text: "Monogram, thread colour, and the small choices nobody else will notice." },
      { title: "The record", text: "All of it stored against your name for the next order." },
    ],
    faqs: [
      {
        question: "What is made-to-measure clothing?",
        answer:
          "Clothing drafted from your own measurements and to your own specification, rather than bought in a standard size and altered afterwards. You choose the cloth and the details; the garment is made to those decisions and fitted on you before it is finished.",
      },
      {
        question: "Is custom clothing only for special occasions?",
        answer:
          "The opposite, usually. The garments that benefit most are the ones worn most — office shirts and trousers — because fit is felt rather than admired. Occasion wear is where custom clothing is most visible, not where it is most useful.",
      },
      {
        question: "Can I order custom clothing if I am not in Mannargudi?",
        answer:
          "Measurements are taken in person at our Mannargudi shop, and that is where the tailoring happens. If you are elsewhere, send us an enquiry describing what you need and we will tell you honestly what is practical.",
      },
    ],
  },
];

export const serviceBySlug = Object.fromEntries(servicePages.map((s) => [s.slug, s]));
export const serviceSlugs = servicePages.map((s) => s.slug);
