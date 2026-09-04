import type { Detail, Faq } from "@/content/types";

/**
 * The seven steps a garment passes through at the shop.
 *
 * These describe what happens, in order, and stop there. No step claims a duration, because no
 * turnaround has been confirmed — and a tailoring timeline that varies with cloth, complexity and
 * season is not something to invent on a website.
 */
export type ProcessStep = {
  /** Two digits, set in the display serif at a large size — the spine of the process section. */
  number: string;
  title: string;
  summary: string;
  detail: string;
};

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Consult",
    summary: "What the garment is for, before what it looks like.",
    detail:
      "We start with the occasion, not the catalogue. A suit for court, a blazer for a reception and a shirt worn six days a week are three different problems, and knowing which one we are solving changes every choice that follows.",
  },
  {
    number: "02",
    title: "Choose the cloth",
    summary: "In daylight, with the weight in your hand.",
    detail:
      "Cloth is chosen at the counter where you can see the colour truthfully and feel the weight. We will tell you how each behaves through a working day and through a Tamil Nadu summer, and let you decide with that in front of you.",
  },
  {
    number: "03",
    title: "Measure",
    summary: "Taken by hand, recorded against your name.",
    detail:
      "Measurements are taken at the shop and entered into our tailoring system under your record, along with the fit notes that matter — how you like a collar to sit, where you want a waistband, which shoulder sits higher.",
  },
  {
    number: "04",
    title: "Customise",
    summary: "The details that make it yours.",
    detail:
      "Collar and cuff, lapel and pocket, buttons, lining, vents, the break at the shoe, a monogram if you want one. Every one of these is a decision, and every one is written onto the order before anything is cut.",
  },
  {
    number: "05",
    title: "Tailor",
    summary: "Cut and made at our Mannargudi workshop.",
    detail:
      "The garment is cut from your measurements and made here, in Mannargudi. Nothing is drawn from a rail of finished stock and adjusted to approximate you.",
  },
  {
    number: "06",
    title: "Trial and quality check",
    summary: "Worn, looked at, corrected.",
    detail:
      "You come in and put it on. A shoulder is eased, a sleeve is taken up, a trouser is set to the shoes you actually wear. The garment is checked over before it is finished and pressed — this is the step that separates a made garment from a bought one.",
  },
  {
    number: "07",
    title: "Delivery",
    summary: "Finished, pressed, packed and handed over.",
    detail:
      "The finished garment is pressed, packed and handed to you at the shop, and your record is updated so the next order can start from it rather than from the beginning.",
  },
];

export const digitalMeasurement = {
  eyebrow: "The digital advantage",
  title: "Your measurements, kept",
  lead:
    "RADHA already runs its tailoring on its own ERP. The practical consequence for you is simple: the measurements taken at the counter do not live on a paper slip that has to be found again.",
  body: [
    "Every customer has a record. Measurements are entered against it when they are taken, with the fit notes that go with them, and previous orders sit alongside. A tailor picking up your next order can see what was made last time and what was adjusted at the trial.",
    "That matters most for the things men order more than once. A second set of shirts, a trouser to go with a jacket made last year, a suit for a son's wedding — none of those need the measuring session repeated from scratch. We confirm what may have changed and work from the record for the rest.",
    "It matters for families and for organisations too. A wedding party or a company uniform order is a list of people, each with their own record, rather than a stack of paper that has to be kept in order by hand.",
  ],
  points: [
    { title: "Recorded, not remembered", text: "Measurements are entered under your name at the shop, not written on a slip." },
    { title: "Fit notes travel with them", text: "What was adjusted at the trial is recorded alongside the numbers." },
    { title: "Repeat orders start further along", text: "A reorder begins from your record; we confirm what may have changed." },
    { title: "Order history in one place", text: "Previous garments are visible against the same record." },
  ] as Detail[],
  /** Deliberately modest: this describes what the ERP does today, not a roadmap sold as a feature. */
  caveat:
    "Measurements are taken in person at our Mannargudi shop. We will always confirm anything that may have changed before a new garment is cut.",
};

export const processFaqs: Faq[] = [
  {
    question: "How does custom tailoring at RADHA work?",
    answer:
      "Seven steps: we talk through what the garment is for, you choose the cloth, we take your measurements at the shop, you make the detail choices, the garment is cut and made in Mannargudi, you come in for a trial where anything that is not right is corrected, and the finished garment is pressed and handed over.",
  },
  {
    question: "Do I need an appointment?",
    answer:
      "Visit the shop in Mannargudi and we will take it from there. For a wedding order, or for a bulk requirement where several people need measuring, send an enquiry first so we can plan the visit properly.",
  },
  {
    question: "Are my measurements stored?",
    answer:
      "Yes. RADHA runs its own tailoring system, and measurements taken at the shop are recorded against your customer record along with the fit notes from your trial. A repeat order starts from that record rather than from the beginning.",
  },
  {
    question: "What should I bring to a fitting?",
    answer:
      "The shoes you plan to wear with the garment, and anything it has to work with — a jacket you already own, the shirt that goes under it. The trial is where length and break are decided, and both depend on what is on your feet.",
  },
];
