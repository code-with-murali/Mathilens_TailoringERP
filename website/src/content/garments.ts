import type { GarmentPage } from "@/content/types";

/**
 * The garment pages.
 *
 * Written as data because the same object feeds four different surfaces: the category grid on the
 * home page, the collections index, the garment page itself and the "read next" links between
 * them. Copy is edited here once and every surface follows.
 *
 * A standing rule for anything written in this file: describe the decisions, not the outcome.
 * RADHA has not published turnaround times, prices, construction specifications or fit guarantees,
 * so nothing here promises them. What made-to-measure genuinely offers — that the choices are
 * yours and the measurements are yours — is more persuasive than a claim anyway.
 */

const SHIRT_PHOTO = {
  src: "/images/shirt-monogram-detail.webp",
  width: 869,
  height: 981,
  alt: "A white RADHA shirt with a spread collar, patch pocket and the navy R monogram embroidered on the pocket",
};

export const garments: GarmentPage[] = [
  {
    slug: "suits",
    path: "/suits",
    navLabel: "Suits",
    title: "Custom men's suits",
    eyebrow: "The suit",
    // Titles are kept short deliberately: the layout appends "| RADHA APPARELS", and a title
    // that overruns roughly 60 characters is truncated in the result Google actually shows.
    seoTitle: "Custom Men's Suits in Mannargudi",
    seoDescription:
      "Custom men's suits tailored in Mannargudi. Choose the cloth, the cut and the detail, and have the suit made to your own measurements for work, weddings and formal occasions.",
    lead:
      "A suit is the one garment a man is measured by before he has said anything. Ours are cut one at a time, from cloth you have chosen yourself, to measurements taken and kept at our Mannargudi shop.",
    cardDescription:
      "Two-piece and three-piece suits, cut to your measurements for work, court, wedding and occasion.",
    cardCta: "Explore suits",
    plate: { tone: "ink", motif: "Suits" },
    sections: [
      {
        heading: "Why a suit is worth having made",
        body: [
          "A [ready-made suit](/journal/ready-made-vs-custom-tailored) is cut for an average of thousands of men and then adjusted, at best, at the waist and the hem. Everything that actually decides how a suit looks — where the shoulder ends, how the chest sits, how much sleeve shows a wrist — is fixed before you ever see it.",
          "Made to measure inverts that. The shoulder is placed on your shoulder. The chest is drafted with the room you need to move and no more. The trouser is cut to your rise, not to a size chart. The result is a garment that looks composed when you are standing still and stays composed when you sit down, reach across a table or spend a day in it.",
        ],
      },
      {
        heading: "Cloth first",
        body: [
          "Every suit starts at [the fabric counter](/fabrics), because the cloth decides more than the cut does. A hard-finished worsted holds a crease and photographs cleanly under office light. A softer, more open weave breathes through a Tamil Nadu summer but creases at the elbow by afternoon. A wedding suit can carry a sheen that would be wrong in a courtroom.",
          "We put the options in front of you, in daylight, and talk through where the suit is going to be worn before anything is cut. If you would rather read first, we have written up [how to choose suit fabric](/journal/how-to-choose-the-right-suit-fabric). That conversation is the part of the process most often skipped and the part most often regretted.",
        ],
      },
      {
        heading: "Fitted, then fitted again",
        body: [
          "Measurements are taken at the shop and [recorded against your name](/process#digital-measurements) in our tailoring system, so the next suit begins where this one finished. The garment is made, you come in for a trial, and what is not right is corrected before it is finished and pressed.",
          "That trial is not a formality. It is where a shoulder is eased, a sleeve is shortened by the half-inch that matters, and the trouser break is set to the shoes you actually wear.",
        ],
      },
    ],
    detailsHeading: "The decisions you make",
    details: [
      { title: "Two-piece or three", text: "Jacket and trouser, or the waistcoat that turns the same suit into occasion wear." },
      { title: "Lapel", text: "Notch for work and everyday formality, peak when the suit needs presence." },
      { title: "Button stance", text: "Where the waist is marked, and how much of the shirt and tie the jacket shows." },
      { title: "Vents", text: "Single, double or none, decided by how you sit and what you carry in your pockets." },
      { title: "Pockets", text: "Flap, jetted or slanted, with or without a ticket pocket." },
      { title: "Trouser", text: "Rise, taper, pleats or a flat front, cuffed or plain, and the break at the shoe." },
      { title: "Lining and buttons", text: "The parts nobody else sees, which is exactly why men choose them carefully." },
      { title: "Monogram", text: "Your initials, discreetly placed, on request." },
    ],
    occasionsHeading: "Where these suits go",
    occasions: [
      "Court and chambers",
      "Consulting rooms and hospital administration",
      "Board meetings and client presentations",
      "Campus convocations and faculty occasions",
      "Bank and corporate offices",
      "Weddings and receptions",
      "Interviews and first impressions",
    ],
    faqs: [
      {
        question: "What is a made-to-measure suit?",
        answer:
          "A suit cut to your own measurements and to the choices you make about cloth, lapel, pockets and trouser, rather than picked off a rail in a standard size. You choose the fabric, we measure you at the shop, the suit is made, and it is fitted on you before it is finished.",
      },
      {
        question: "How many measurements are taken for a suit?",
        answer:
          "A suit is drafted from a full set of upper-body and lower-body measurements — chest, waist, seat, shoulder, sleeve, jacket and trouser lengths, and the balance points that decide how the jacket hangs. They are taken at the shop and stored against your record, so a repeat order does not need the whole session again.",
      },
      {
        question: "Can I have a suit made for a wedding?",
        answer:
          "Yes. Wedding and reception suits are one of the things we are asked for most. Come in early enough to choose cloth without rushing, and plan the whole look — suit, shirt, waistcoat if you want one — in one conversation.",
      },
      {
        question: "Do you tailor suits for customers outside Mannargudi?",
        answer:
          "Our shop, and all the tailoring, is in Mannargudi. Customers travel to us from across the Thanjavur delta — Thiruvarur, Thiruthuraipoondi, Muthupet, Pattukottai, Kumbakonam and Thanjavur among them. If you are further away, send us an enquiry and we will tell you what is practical.",
      },
    ],
    related: ["blazers", "wedding", "trousers"],
  },

  {
    slug: "blazers",
    path: "/blazers",
    navLabel: "Blazers",
    title: "Custom men's blazers",
    eyebrow: "The blazer",
    seoTitle: "Custom Men's Blazers in Mannargudi",
    seoDescription:
      "Custom men's blazers tailored in Mannargudi. Formal, occasion and wedding blazers cut to your measurements, with the cloth, lapel and pockets chosen by you.",
    lead:
      "The blazer is the most useful jacket a man owns. Worn over a shirt it dresses up an ordinary day; worn with a contrast trouser it carries an evening. Cut properly, it does both without looking like it is trying.",
    cardDescription:
      "Single and double-breasted blazers for work, evenings and celebrations, cut to your measurements.",
    cardCta: "Discover blazers",
    plate: { tone: "ink", motif: "Blazers" },
    sections: [
      {
        heading: "A blazer is not half a suit",
        body: [
          "A [suit](/suits) jacket is drafted to live with its own trouser and looks orphaned without it. A blazer is drafted to stand alone: often a little shorter, usually in a cloth with more texture, and cut to sit well over more than one thing underneath it.",
          "That is why buying a suit and wearing the jacket separately rarely works, and why men who own one good blazer end up wearing it more than anything else in the wardrobe.",
        ],
      },
      {
        heading: "Where the fit is won or lost",
        body: [
          "Four things decide whether a blazer looks made for you — and we set them out in full in [how a blazer should fit](/journal/how-should-a-mens-blazer-fit). The shoulder seam must finish where your shoulder finishes. The collar must sit against your shirt collar without a gap when you stand and without riding up when you move. The chest must close cleanly with no strain across the button. And the sleeve must end where the wrist begins, so a little shirt cuff shows.",
          "None of those can be bought in a standard size and only two of them can be altered afterwards. They are set at the drafting stage, from your measurements, which is the whole argument for having a blazer made.",
        ],
      },
      {
        heading: "Texture is what makes it a blazer",
        body: [
          "Where a suit usually wants a smooth, even cloth, a blazer is allowed to be interesting. A weave with a visible structure, a subtle check, a deep solid with some life in it — texture is what tells the eye this is a jacket in its own right rather than the top half of something missing.",
          "We will show you what suits the way you plan to wear it: over formal shirting for work, over something softer for an evening, or in the heavier cloth an air-conditioned office actually calls for.",
        ],
      },
    ],
    detailsHeading: "The decisions you make",
    details: [
      { title: "Single or double-breasted", text: "The everyday jacket, or the one that makes an entrance." },
      { title: "Lapel", text: "Notch, peak or shawl, sized to your frame rather than to the season's fashion." },
      { title: "Buttons", text: "Horn, metal or covered — a metal button reads as a classic blazer, plain reads as a jacket." },
      { title: "Pockets", text: "Patch pockets for something relaxed, flap or jetted for something formal." },
      { title: "Length", text: "Set against your height and your seat, not against a size chart." },
      { title: "Lining", text: "Full, half or minimal, decided by the cloth and by the weather you will wear it in." },
      { title: "Sleeve buttons", text: "How many, and whether they open." },
      { title: "Monogram", text: "Initials inside the jacket or discreetly on the cuff, on request." },
    ],
    occasionsHeading: "Where these blazers go",
    occasions: [
      "Office and client meetings",
      "Conferences and seminars",
      "Wedding receptions and engagements",
      "Faculty and institutional occasions",
      "Evening events and family functions",
      "Travel, where one jacket has to do everything",
    ],
    faqs: [
      {
        question: "What is the difference between a blazer and a suit jacket?",
        answer:
          "A suit jacket is made from the same cloth as its trouser and belongs with it. A blazer is made to be worn on its own, over different trousers, and is usually cut in a cloth with more texture and sometimes at a slightly different length.",
      },
      {
        question: "How should a men's blazer fit?",
        answer:
          "The shoulder seam should end where your shoulder ends, the collar should rest against your shirt collar without gapping, the front should close without pulling, and the sleeve should stop far enough up the wrist to show a little shirt cuff. Length is set against your height and seat.",
      },
      {
        question: "Can a blazer be made for a wedding?",
        answer:
          "Yes — reception blazers are a large part of what we make. The cloth and the detailing are chosen for the event rather than for the office, and the fit is planned around what else you will be wearing that day.",
      },
    ],
    related: ["suits", "wedding", "shirts"],
  },

  {
    slug: "shirts",
    path: "/shirts",
    navLabel: "Shirts",
    title: "Custom men's shirts",
    eyebrow: "The shirt",
    seoTitle: "Custom Men's Shirts in Mannargudi",
    seoDescription:
      "Custom shirts tailored in Mannargudi. Choose the shirting, collar, cuff and fit, and have shirts made to your own measurements for office and formal wear.",
    lead:
      "The shirt is worn more than anything else in a man's wardrobe and forgiven the least. A collar that stands, a shoulder that sits and a sleeve that ends in the right place are the difference between looking dressed and looking merely covered.",
    cardDescription:
      "Formal and everyday shirts in your collar, cuff and fit — the garment most worth having made.",
    cardCta: "Custom shirts",
    image: SHIRT_PHOTO,
    ogImage: SHIRT_PHOTO,
    plate: { tone: "cream", motif: "Shirts" },
    sections: [
      {
        heading: "Start with the collar",
        body: [
          "The collar is the only part of an outfit that sits beside your face all day, so it is where a custom shirt earns its keep first. Its height, spread and point length change the shape of a face more than any other detail on the garment — and a collar that is too low or too soft is what makes an otherwise good shirt look tired by eleven in the morning.",
          "We fit the collar to your neck and to how you wear the shirt: closed with a tie, open at the throat, or under a jacket where the collar has to hold its shape against a lapel.",
        ],
      },
      {
        heading: "Fit that survives a working day",
        body: [
          "Most men wear shirts that are too full in the body and too short in the sleeve, because those are the two measurements a size chart handles worst. Cut properly, a shirt has enough room across the back and chest to reach and turn, follows the body without pulling at the button line, and has a sleeve long enough that the cuff stays at the wrist when the arm is raised.",
          "It is also cut to be worn tucked, so it stays tucked — length is set against your torso rather than against a standard.",
        ],
      },
      {
        heading: "The shirting decides the day",
        body: [
          "A crisp, densely woven shirting holds a collar upright and looks formal but sits warm. A softer, more open cotton is kinder in the heat and less severe under a fan, at the cost of some structure. A textured weave hides a long day; a smooth one photographs well and shows every crease.",
          "We show you [the shirting](/fabrics) in daylight and talk about where the shirt is going before we cut it. Weight matters here more than colour does.",
        ],
      },
    ],
    detailsHeading: "The decisions you make",
    details: [
      { title: "Collar", text: "Spread, semi-spread, point or button-down, in the height that suits your neck." },
      { title: "Cuff", text: "Single button, two-button, angled or a double cuff for links." },
      { title: "Placket", text: "A stitched front placket, a plain front, or a concealed placket for evening." },
      { title: "Pocket", text: "One, two or none — and rounded, angled or flapped if you want one." },
      { title: "Fit", text: "How much room through the chest, waist and armhole, set from your measurements." },
      { title: "Sleeve", text: "Full or half, with the length taken to your wrist rather than to a size." },
      { title: "Buttons", text: "Colour and finish, and whether the stitching matches or contrasts." },
      { title: "Monogram", text: "Initials on the pocket or the cuff, in a thread colour you choose." },
    ],
    occasionsHeading: "Where these shirts go",
    occasions: [
      "Daily office and consulting wear",
      "Under a suit or blazer, with a tie",
      "Court, clinic and classroom",
      "Formal evenings and functions",
      "Company and institutional shirting in volume",
    ],
    faqs: [
      {
        question: "Is it worth having shirts made rather than buying them?",
        answer:
          "A shirt is the garment where fit is felt rather than admired — at the collar, the shoulder and the cuff. Those are exactly the three places a standard size compromises. If you wear a shirt five or six days a week, it is usually the first garment worth having made.",
      },
      {
        question: "Which collar should I choose?",
        answer:
          "As a rough guide, a wider spread balances a narrower face and suits a jacket; a point collar lengthens a rounder face and works well open at the throat. Bring in what you wear with your shirts and we will fit the collar to your neck and your habits rather than to a trend.",
      },
      {
        question: "Can I reorder shirts without being measured again?",
        answer:
          "Yes. Your measurements are recorded against your name in our tailoring system when they are taken at the shop, so a repeat order can start from the record. We will still confirm anything that may have changed before cutting.",
      },
      {
        question: "Do you make shirts in bulk for companies and institutions?",
        answer:
          "Yes. Shirting is the most common bulk request we receive, for corporate teams, factories, schools, colleges and hotels. See the bulk orders section for how those enquiries are handled.",
      },
    ],
    related: ["trousers", "suits", "blazers"],
  },

  {
    slug: "trousers",
    path: "/trousers",
    navLabel: "Trousers",
    title: "Custom men's trousers",
    eyebrow: "The trouser",
    seoTitle: "Custom Men's Trousers in Mannargudi",
    seoDescription:
      "Custom men's trousers tailored in Mannargudi. Formal and office trousers cut to your rise, waist and length, with the pleat, taper and break decided by you.",
    lead:
      "Trousers are the half of an outfit men think about least and adjust most. Cut to your own rise and seat, they stop needing adjusting — which is the whole point.",
    cardDescription:
      "Formal and office trousers cut to your rise, seat and length, with the taper and break you want.",
    cardCta: "Custom trousers",
    plate: { tone: "cream", motif: "Trousers" },
    sections: [
      {
        heading: "The rise is the measurement that matters",
        body: [
          "Almost every complaint about ready-made trousers — the waistband that will not stay put, the seat that pulls when you sit, the crease that never falls straight — comes back to the rise being wrong for the body wearing them. It is the one measurement a standard size cannot approximate, because two men with the same waist rarely have the same rise.",
          "Cut to your own rise — one of the measurements a [custom garment](/services/custom-clothing) exists to solve — the waistband sits where you want it and stays there, the seat is clean, and the front crease runs unbroken to the shoe.",
        ],
      },
      {
        heading: "Comfort you can actually work in",
        body: [
          "A trouser worn from morning to evening has to allow sitting, walking and stairs without reminding you it is there. That is a question of how the seat and thigh are cut, not of how loose the waist is. Room in the right places lets a trouser look clean and still be forgettable to wear.",
          "For customers who are on their feet all day, or who spend the day in an air-conditioned office, the cloth weight is chosen with that in mind too.",
        ],
      },
      {
        heading: "Finished to your shoes",
        body: [
          "The break — how much the trouser rests on the shoe — is set at the trial with the shoes you actually wear, because a formal shoe and a loafer take different lengths. So does whether you want a cuff.",
          "It is a small decision that decides how the whole outfit reads from a distance, and it is the one most often left to chance.",
        ],
      },
    ],
    detailsHeading: "The decisions you make",
    details: [
      { title: "Rise", text: "Where the waistband sits — taken from you, not from a size." },
      { title: "Pleats", text: "Flat front for a cleaner line, single or double pleat for room and drape." },
      { title: "Taper", text: "How the leg narrows from thigh to hem, set against your build." },
      { title: "Waistband", text: "Standard, extended tab, or side adjusters instead of a belt." },
      { title: "Pockets", text: "Slant, straight or frogmouth at the front; welted or buttoned at the back." },
      { title: "Hem", text: "Plain or cuffed, with the cuff depth chosen to your height." },
      { title: "Break", text: "Full, half or none — set at the trial, on your shoes." },
    ],
    occasionsHeading: "Where these trousers go",
    occasions: [
      "Everyday office and formal wear",
      "Worn with a blazer as a contrast trouser",
      "Uniform trousers for teams and institutions",
      "Occasion and wedding wear",
    ],
    faqs: [
      {
        question: "Why do ready-made trousers never sit right?",
        answer:
          "Usually because the rise is wrong. Waist and length are printed on the label; rise is not, and it is the measurement that decides whether the waistband stays put and the seat sits cleanly. Cut to your own rise, most of the usual problems disappear.",
      },
      {
        question: "Can you make trousers to match a jacket I already own?",
        answer:
          "Bring the jacket to the shop and we will look at it with you. Whether a close match is possible depends entirely on the cloth, so it is a conversation to have in person rather than a promise to make in advance.",
      },
      {
        question: "Do you make uniform trousers in quantity?",
        answer:
          "Yes — trousers are part of most bulk uniform orders we are asked about, alongside shirts. Send a bulk enquiry with what you need and we will take it from there.",
      },
    ],
    related: ["shirts", "suits", "blazers"],
  },

  {
    slug: "wedding",
    path: "/wedding",
    navLabel: "Wedding & Groom",
    title: "Wedding and groom wear",
    eyebrow: "The wedding",
    seoTitle: "Wedding Suits & Groom Wear, Mannargudi",
    seoDescription:
      "Wedding suits, reception blazers and groom wear tailored in Mannargudi. Plan the full wedding look — cloth, cut and detail — with measurements taken and kept at our shop.",
    lead:
      "A wedding is the one day a man is photographed from every angle, and the photographs outlast the day by fifty years. Groom wear is worth planning properly, early, and in person.",
    cardDescription:
      "Wedding suits, reception blazers and groom wear, planned as a complete look rather than a single garment.",
    cardCta: "Plan your wedding look",
    plate: { tone: "gold", motif: "Wedding" },
    sections: [
      {
        heading: "Plan the whole look, not one garment",
        body: [
          "A wedding is rarely one outfit. There is the ceremony, the [reception](/blazers), and often an engagement or a family function before either. Planned together, those outfits share a logic — the cloths sit well beside each other in photographs, nothing is repeated, and each one is right for the light and the hour it is worn in.",
          "Planned separately and at short notice, they usually are not. Coming in early is the single most useful thing a groom can do — our [guide to choosing a wedding suit](/journal/how-to-choose-a-suit-for-a-wedding) sets out the order to decide things in.",
        ],
      },
      {
        heading: "Cloth chosen for the camera and the climate",
        body: [
          "Wedding cloth is chosen against two things at once: how it photographs and how it wears. A fabric with a sheen catches light beautifully in the evening and can look severe in flat daylight. A heavier cloth holds its shape through a long ceremony and asks something of the wearer in a Tamil Nadu afternoon.",
          "We will show you [wedding cloth](/fabrics) in daylight, tell you honestly how each will behave over a full day, and let you decide with that in front of you.",
        ],
      },
      {
        heading: "Fitted with time to spare",
        body: [
          "Wedding orders follow [the same seven steps](/process) as everything else, with room in the calendar to correct anything that is not right. Measurements are recorded against your name, which also matters for the family: fathers, brothers and groomsmen are often measured in the same visit, and those records make a coordinated order far simpler to manage.",
          "Bring the shoes. Bring anything you already plan to wear with it. The trial is where the outfit stops being a plan and becomes a garment.",
        ],
      },
    ],
    detailsHeading: "What a wedding order usually covers",
    details: [
      { title: "The ceremony", text: "The principal outfit, planned around the venue, the hour and the light." },
      { title: "The reception", text: "Usually a blazer or a suit with more evening in it than the ceremony wear." },
      { title: "Engagement and functions", text: "The occasions before the day, planned so nothing is repeated." },
      { title: "Shirting", text: "Collar, cuff and cloth chosen to sit correctly under the jacket." },
      { title: "The waistcoat", text: "Where the look calls for a third piece." },
      { title: "The family", text: "Father, brothers and groomsmen, measured together and made to one plan." },
      { title: "Monogram", text: "Initials or a date, discreetly placed, on request." },
    ],
    occasionsHeading: "Occasions we plan for",
    occasions: ["Wedding ceremony", "Reception", "Engagement", "Family functions", "Post-wedding photography"],
    faqs: [
      {
        question: "How early should a groom start his wedding order?",
        answer:
          "As early as you can. Starting early is what buys you an unhurried choice of cloth and a comfortable trial with time to correct anything. Come in or send an enquiry as soon as the date is fixed and we will tell you what is realistic for your timeline.",
      },
      {
        question: "Can the whole family be measured together?",
        answer:
          "Yes, and it is the easiest way to do it. Measurements for each person are recorded separately against their own name, so a coordinated order for the groom, his father, brothers and friends can be planned and tracked as one.",
      },
      {
        question: "Do you make both the wedding and the reception outfit?",
        answer:
          "Most wedding orders cover more than one occasion — ceremony, reception and often an engagement. Planning them in one conversation is how you avoid two outfits that fight each other in the photographs.",
      },
    ],
    related: ["suits", "blazers", "shirts"],
  },
];

export const garmentBySlug = Object.fromEntries(garments.map((g) => [g.slug, g])) as Record<
  string,
  GarmentPage
>;

