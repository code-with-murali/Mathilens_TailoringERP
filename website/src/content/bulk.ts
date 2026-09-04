import type { BulkSegment, Detail, Faq } from "@/content/types";

/**
 * Bulk and B2B.
 *
 * The hard rule here: no minimum order quantity, no lead time, no production capacity, no unit
 * price, no client names. None of those has been supplied, and every one of them is the kind of
 * number a purchasing officer will hold you to. Each page ends in an enquiry instead, which is
 * how a real bulk conversation starts anyway.
 */

export const bulkOverview = {
  eyebrow: "Bulk & corporate",
  title: "Custom clothing at scale",
  seoTitle: "Bulk Orders & Corporate Uniforms",
  seoDescription:
    "Bulk clothing and uniform orders from RADHA APPARELS, Mannargudi. Corporate, school, college and institutional uniforms made to one agreed specification.",
  lead:
    "From corporate teams to schools, colleges, factories and institutions, RADHA supports customised bulk clothing requirements through its Mannargudi tailoring operation.",
  body: [
    "A uniform order is not a large version of a personal order. It is a specification problem: one garment, one cloth, one set of details, made consistently across a group of people who are all different shapes — and made again next year to match what was made this year.",
    "That is a job for a workshop that [records what it did](/process#digital-measurements). Every person measured for a bulk order gets their own record, and the specification for the order sits alongside it, which is what makes a repeat run match the first one.",
  ],
  ctaTitle: "Discuss your bulk requirement",
  ctaBody:
    "Tell us who the clothing is for, roughly how many people, and when you need it. We will come back to you with what is practical — quantities, cloth and timelines are decided in that conversation rather than published here.",
};

/** Bulk shown as what it is — a category, standing alongside the garments rather than beneath them. */
export const bulkCategoryCard = {
  href: "/bulk-orders",
  title: "Bulk & corporate orders",
  description:
    "Uniforms and volume clothing for companies, schools, colleges, factories and institutions.",
  cta: "Discuss a bulk order",
  plate: { tone: "gold" as const, motif: "Bulk Orders" },
};

export const bulkHowItWorks: Detail[] = [
  {
    title: "Brief",
    text: "What the clothing is for, who wears it, and the conditions it has to survive — an office, a shop floor, a classroom, a kitchen.",
  },
  {
    title: "Specification",
    text: "Garment, cloth, colour, collar and cuff, pocket, and any branding or monogram. Agreed once and written down, so every unit matches.",
  },
  {
    title: "Sampling",
    text: "A sample garment made and approved before the run begins. Nobody signs off a uniform from a description.",
  },
  {
    title: "Measuring",
    text: "Your people are measured and each gets their own record, which is what makes next year's top-up run fit the same bodies.",
  },
  {
    title: "Production",
    text: "The run is cut and made at our Mannargudi workshop against the approved specification.",
  },
  {
    title: "Check and delivery",
    text: "Garments are checked against the approved sample before they are packed and handed over.",
  },
];

export const bulkGarments = [
  "Formal and uniform shirts",
  "Trousers",
  "Blazers and jackets",
  "Waistcoats",
  "Aprons and service wear",
  "Custom clothing to your own specification",
];

export const bulkFaqs: Faq[] = [
  {
    question: "What is your minimum order quantity for bulk clothing?",
    answer:
      "We do not publish a fixed minimum, because it depends on the garment and the cloth. Send us your requirement and we will tell you straight away whether it is something we can take on.",
  },
  {
    question: "How long does a bulk uniform order take?",
    answer:
      "Timelines depend on the garment, the quantity, the cloth and the time of year, so we would rather give you a real answer for your order than a general one on a website. Include your deadline in the enquiry and we will tell you what is realistic.",
  },
  {
    question: "Can you match a uniform we already have?",
    answer:
      "Bring or send us a sample garment. Whether a close match is possible depends on the cloth and the trims, which is a question we can answer properly with the garment in front of us.",
  },
  {
    question: "Do you handle repeat and top-up orders?",
    answer:
      "Yes, and this is where recorded measurements matter most. Each person measured for your order has their own record, and the approved specification is kept with it, so a top-up run for new joiners matches the original.",
  },
  {
    question: "Can our logo be added to the garments?",
    answer:
      "Branding and monogramming are part of the specification conversation. Tell us what you need in the enquiry and we will confirm what is possible.",
  },
];

export const bulkSegments: BulkSegment[] = [
  {
    slug: "corporate",
    path: "/bulk-orders/corporate",
    navLabel: "Corporate uniforms",
    title: "Corporate and company uniforms",
    eyebrow: "Bulk order",
    seoTitle: "Corporate & Company Uniform Tailoring",
    seoDescription:
      "Corporate uniform tailoring in Mannargudi. Company shirts, trousers and blazers for offices, IT teams and factories, made to one agreed specification.",
    lead:
      "A company uniform is worn by people who did not choose it, in front of people who judge the company by it. Both facts should shape how it is specified.",
    cardDescription: "Office, IT, factory and worker uniforms made to one agreed specification.",
    sections: [
      {
        heading: "Front of house and shop floor are different problems",
        body: [
          "A uniform worn at a reception desk is judged on how it looks at the end of the day. A uniform worn on a factory floor is judged on whether it survives the week and whether it is comfortable to work in for eight hours. The same cloth rarely does both well.",
          "We would rather specify two garments properly than one garment that compromises everywhere, and that is usually the first thing worth deciding in a corporate enquiry.",
        ],
      },
      {
        heading: "Consistency is the whole job",
        body: [
          "The measure of a uniform order is not the first garment; it is the fortieth, and the ten more ordered next March for new joiners. Getting that right is a matter of an approved sample, a written specification and a record for each person who was measured.",
          "That record-keeping is not an extra service here. It is how the workshop already runs.",
        ],
      },
    ],
    garments: ["Formal shirts", "Trousers", "Blazers", "Waistcoats", "Worker and factory wear"],
    considerations: [
      { title: "Wear conditions", text: "Office, air-conditioned floor, outdoors, shop floor or kitchen — each asks for different cloth." },
      { title: "Laundering", text: "How often, and industrially or at home. This decides the fabric more than colour does." },
      { title: "Branding", text: "Embroidered monogram, logo placement and thread colour, agreed on the sample." },
      { title: "Roles", text: "Whether one specification covers everyone, or front-of-house and floor staff need their own." },
      { title: "Growth", text: "How new joiners will be measured and fitted through the year." },
    ],
    faqs: [
      {
        question: "Can you supply uniforms for both office and factory staff?",
        answer:
          "Yes, and they are usually specified as two garments rather than one. Office and shop-floor clothing — [corporate uniforms](/bulk-orders/corporate) and workwear — are judged on different things, and a single specification that tries to do both tends to disappoint both.",
      },
      {
        question: "How are new joiners handled after the main order?",
        answer:
          "Each person measured for your order has their own record, and the approved specification is kept alongside it, so a later top-up run is made to the same standard. Send us the new names and we will arrange measuring.",
      },
    ],
    plate: { tone: "ink", motif: "Corporate" },
  },

  {
    slug: "schools",
    path: "/bulk-orders/schools",
    navLabel: "School uniforms",
    title: "School uniforms",
    eyebrow: "Bulk order",
    seoTitle: "School Uniform Tailoring in Bulk",
    seoDescription:
      "School uniform tailoring from RADHA APPARELS, Mannargudi. Bulk school shirts, trousers and blazers made to one specification, with records kept for the next academic year.",
    lead:
      "School clothing is worn every day by children who grow out of it, washed constantly, and has to look the same on the last day of the year as on the first.",
    cardDescription: "Bulk school shirts, trousers and blazers, specified once and repeatable each year.",
    sections: [
      {
        heading: "Specified for the wash, not the shelf",
        body: [
          "The thing that decides whether a school uniform still looks like a uniform in February is how the cloth holds colour and shape through repeated washing. That is the question we start with, before colour and before cut.",
          "Comfort matters just as much. A child sits in this clothing for six hours a day, and a collar or a waistband that is wrong is worn regardless.",
        ],
      },
      {
        heading: "The same uniform, year after year",
        body: [
          "A school changes its intake every year and its uniform rarely. Keeping the specification and the approved sample on record is what allows next year's order to match this year's, so a class does not end up in two slightly different shades of the same shirt.",
          "Measuring sessions for a school are planned with you rather than left to individual families, when that is how you want to run it.",
        ],
      },
    ],
    garments: ["Uniform shirts", "Trousers and shorts", "Blazers", "Waistcoats and ties where required"],
    considerations: [
      { title: "Wash durability", text: "Colour hold and shrinkage across a full academic year of washing." },
      { title: "Comfort", text: "Cloth weight and collar construction for a child wearing it all day." },
      { title: "Sizing across ages", text: "How a single specification is graded across year groups." },
      { title: "House and section colours", text: "Where the uniform differs by house, year or section." },
      { title: "Annual repeatability", text: "Keeping specification and sample on record for next year's run." },
    ],
    faqs: [
      {
        question: "Can you match our school's existing uniform?",
        answer:
          "Send or bring a sample garment. Matching cloth, colour and trims is a question best answered with the existing uniform in hand rather than from a description.",
      },
      {
        question: "How is measuring organised for a whole school?",
        answer:
          "That is planned with you — measuring sessions can be organised around your calendar. Send an enquiry with your numbers and timeline and we will work out the practical arrangement together.",
      },
    ],
    plate: { tone: "cream", motif: "Schools" },
  },

  {
    slug: "colleges",
    path: "/bulk-orders/colleges",
    navLabel: "College uniforms",
    title: "College and campus clothing",
    eyebrow: "Bulk order",
    seoTitle: "College Uniform & Campus Clothing",
    seoDescription:
      "College uniform and campus clothing tailored in Mannargudi. Department shirts, formal blazers, and clothing for convocations, placements and college events, made in bulk.",
    lead:
      "Campus clothing covers more ground than a school uniform: a department shirt, a blazer for placement season, and something formal enough for a convocation.",
    cardDescription: "Department shirts, placement blazers and convocation wear, made in quantity.",
    sections: [
      {
        heading: "Placement season is a deadline, not a preference",
        body: [
          "Formal wear ordered for a placement season has a fixed date attached to it and a room full of students who will be judged partly on how they look. That is worth planning early, and worth specifying properly — a blazer that fits badly on the day is worse than no blazer.",
          "Tell us the date in the enquiry. It changes what we recommend.",
        ],
      },
      {
        heading: "One institution, several specifications",
        body: [
          "Colleges rarely need one garment. Departments differ, staff and students differ, and convocation wear is its own thing. Each can be specified separately and made against the same agreed standard, so the institution reads as one place even where the clothing varies.",
        ],
      },
    ],
    garments: ["Department and section shirts", "Formal blazers", "Trousers", "Convocation and event wear"],
    considerations: [
      { title: "Departments", text: "Where colour or detailing differs by department or section." },
      { title: "Students and staff", text: "Whether both are covered, and whether the specification differs." },
      { title: "Event deadlines", text: "Convocations, placement season, sports and college days." },
      { title: "Branding", text: "College crest or monogram, placement and thread colour." },
      { title: "Repeat batches", text: "How each incoming year is measured and supplied." },
    ],
    faqs: [
      {
        question: "Can you make formal blazers for a placement batch?",
        answer:
          "Yes — that is a common campus enquiry. Send the numbers and the date you need them by, and we will tell you what is realistic and what we would recommend for the cloth.",
      },
      {
        question: "Can different departments have different uniforms?",
        answer:
          "Yes. Each department can be specified separately and made against the same agreed standard, which keeps the institution consistent even where the clothing differs.",
      },
    ],
    plate: { tone: "ink", motif: "Colleges" },
  },

  {
    slug: "institutions",
    path: "/bulk-orders/institutions",
    navLabel: "Institutional uniforms",
    title: "Institutional and hospitality uniforms",
    eyebrow: "Bulk order",
    seoTitle: "Institutional & Hospitality Uniforms",
    seoDescription:
      "Institutional uniform tailoring from RADHA APPARELS, Mannargudi. Uniforms for hotels, hospitals, trusts, events and organisations, made to one specification in bulk.",
    lead:
      "Hotels, hospitals, trusts and event organisations dress people who are the first thing a visitor sees. The clothing is part of the service, and it is judged as such.",
    cardDescription: "Uniforms for hotels, hospitals, trusts, events and organisations of every kind.",
    sections: [
      {
        heading: "Clothing that is on duty",
        body: [
          "An institutional uniform works hard in ways ordinary clothing does not: long shifts, industrial laundering, and a standard of presentation that has to hold at the end of a shift as well as the start of one.",
          "Cloth choice does most of the work here, and it is where we would spend the first part of any conversation.",
        ],
      },
      {
        heading: "Distinguishing roles without fragmenting the look",
        body: [
          "Most institutions need to tell roles apart at a glance while still looking like one organisation. That is usually solved with a consistent garment and a controlled variation — a colour, a trim, a monogram — rather than with different uniforms per department.",
          "Specified that way, the order is simpler to make, simpler to repeat and simpler to recognise.",
        ],
      },
    ],
    garments: ["Shirts", "Trousers", "Blazers and waistcoats", "Aprons and service wear", "Event and function clothing"],
    considerations: [
      { title: "Shift length", text: "Comfort over eight or twelve hours, not over an hour of trying on." },
      { title: "Laundering", text: "Industrial washing and how often — the first question for the cloth." },
      { title: "Role identification", text: "How departments and seniority are distinguished at a glance." },
      { title: "Hygiene and safety", text: "Where the setting places requirements on the garment." },
      { title: "Turnover", text: "How new staff are measured and supplied through the year." },
    ],
    faqs: [
      {
        question: "Do you make uniforms for hotels and hospitals?",
        answer:
          "Yes — hospitality and healthcare are among the institutional enquiries we take. Tell us the setting, the shift pattern and how the clothing is laundered, and we will start from there.",
      },
      {
        question: "Can we distinguish departments within one uniform?",
        answer:
          "That is usually the best way to do it: one garment with a controlled variation — a colour, a trim, a monogram — rather than several different uniforms. It is easier to recognise and far easier to repeat.",
      },
    ],
    plate: { tone: "cream", motif: "Institutions" },
  },
];

export const bulkSegmentBySlug = Object.fromEntries(bulkSegments.map((s) => [s.slug, s]));
export const bulkSegmentSlugs = bulkSegments.map((s) => s.slug);

/** The organisations named in the brief, used as an "who we make for" strip. */
export const bulkAudiences = [
  "Companies",
  "Corporate offices",
  "IT teams",
  "Factories",
  "Workers",
  "Schools",
  "Colleges",
  "Hotels",
  "Hospitals",
  "Trusts and institutions",
  "Events",
];
