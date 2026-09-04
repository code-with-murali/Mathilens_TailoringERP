import type { Faq } from "@/content/types";
import { brand } from "@/content/site";

/**
 * The home page's questions.
 *
 * Chosen as the ones a first-time visitor actually needs answered before they will consider a
 * visit — and answered without inventing a price, a turnaround or a guarantee. Where the honest
 * answer is "it depends, ask us", that is what it says; a vague answer that is true is worth more
 * than a specific one that is not.
 */
export const homeFaqs: Faq[] = [
  {
    question: "What does RADHA APPARELS make?",
    answer:
      `Men's clothing, made to measure: suits, blazers, shirts, trousers, and wedding and groom wear. We are a fabric and tailoring house, so we sell the cloth and make the garment from it. The same workshop also takes [bulk and uniform orders](/bulk-orders) for companies, schools, colleges and institutions.`,
  },
  {
    question: "Where is the shop?",
    answer:
      `In ${brand.city}, ${brand.region}. It is our only shop. Fabric selection, measurement, cutting, tailoring, the trial and finishing all happen there. Customers travel to us from across the Thanjavur delta, but we do not have branches in those towns.`,
  },
  {
    question: "How much does a custom garment cost?",
    answer:
      "That depends entirely on the garment and the cloth, so we would rather give you a real figure for what you actually want than a misleading range on a website. Tell us what you have in mind, or come to the counter, and you will have a straight answer.",
  },
  {
    question: "How long does it take?",
    answer:
      "It depends on the garment, the complexity and the time of year. Tell us your deadline when you enquire and we will tell you honestly whether it is realistic before you commit to anything.",
  },
  {
    question: "Do I need an appointment?",
    answer:
      `Not for an ordinary visit — come to the shop in ${brand.city}. For a wedding order, or where several people need measuring, send an enquiry first so we can plan the visit properly.`,
  },
  {
    question: "Do you keep my measurements for next time?",
    answer:
      "Yes. RADHA runs its own tailoring system, and [measurements taken at the shop](/process#digital-measurements) are recorded against your name along with the fit notes from your trial. A repeat order starts from that record rather than from the beginning — though we always confirm what may have changed before cutting.",
  },
  {
    question: "Can I order from outside Mannargudi?",
    answer:
      "Measurements are taken in person, so a first order needs a visit. A separate online shopping platform is being built to make exploring and ordering easier from further away. In the meantime, send an enquiry describing what you need and where you are, and we will tell you what is practical.",
  },
  {
    question: "Do you take bulk and uniform orders?",
    answer:
      "Yes — corporate and company uniforms, school and college uniforms, and institutional and hospitality wear. We do not publish minimum quantities or timelines because they depend on the garment and the cloth. Send us the requirement and we will answer both straight away.",
  },
];
