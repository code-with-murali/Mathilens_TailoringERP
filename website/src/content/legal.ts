import type { Block } from "@/content/types";
import { brand } from "@/content/site";

/**
 * Legal pages.
 *
 * These describe only what is verifiably true of this website and of how a tailoring order works,
 * and they say plainly that the commercial terms of any particular order are agreed at the time
 * of that order. Nothing here invents a refund window, a delivery time, a fee, or a data
 * processor that has not been set up.
 *
 * Before launch these should be read by whoever is responsible for RADHA's legal position, and
 * the shipping and alterations pages rewritten once the business has settled its actual terms.
 * They are written to be safe and honest in the meantime, not to be a substitute for that.
 */

export type LegalPage = {
  slug: string;
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  lead: string;
  updated: string;
  body: Block[];
};

const contactLine =
  "For anything in this document, use the enquiry form on our contact page or speak to us at the shop in " +
  `${brand.city}, ${brand.region}.`;

export const legalPages: LegalPage[] = [
  {
    slug: "privacy",
    path: "/privacy",
    title: "Privacy policy",
    seoTitle: "Privacy Policy",
    description: `How ${brand.name} handles the information you give us through this website and at our Mannargudi shop.`,
    lead:
      "What this website collects, what we do with it, and what we do not do with it. Written to be read rather than to be survived.",
    updated: "2026-09-04",
    body: [
      { type: "h2", text: "What this website collects" },
      {
        type: "p",
        text: "This site does not ask you to create an account and does not require any information to read it. Two things can result in information reaching us.",
      },
      {
        type: "ul",
        items: [
          "The enquiry form. If you complete it, we receive what you typed into it — your name, your phone number, and whichever of the optional fields you filled in. We use it to reply to your enquiry and to plan the work you are asking about, and for nothing else.",
          "Analytics. If website analytics has been enabled, our analytics provider records anonymous usage information such as which pages were visited and from which country. It is used to understand which parts of the site are useful. It does not identify you by name.",
        ],
      },
      { type: "h2", text: "Cookies" },
      {
        type: "p",
        text: "This website sets no cookies of its own. If analytics is enabled, the analytics provider may set its own cookies; your browser settings control whether it can, and blocking them does not affect anything on this site.",
      },
      { type: "h2", text: "Information given at the shop" },
      {
        type: "p",
        text: "When you place an order with us in person we record what is needed to make and deliver your garment: your name, contact details, measurements, fit notes and order history. This is kept in our own tailoring system so that a repeat order can begin from your record rather than from the beginning.",
      },
      {
        type: "p",
        text: "We keep it for as long as it is useful to you as a customer. If you would like your record removed, tell us and we will remove it.",
      },
      { type: "h2", text: "What we do not do" },
      {
        type: "ul",
        items: [
          "We do not sell your information.",
          "We do not share it with anyone who is not involved in making or delivering your order.",
          "We do not send marketing messages to people who have not asked for them.",
        ],
      },
      { type: "h2", text: "Third-party links" },
      {
        type: "p",
        text: "This site links to services we do not control, including social media, mapping and our separate online store. Their own privacy practices apply once you leave this site.",
      },
      { type: "h2", text: "Getting in touch" },
      { type: "p", text: contactLine },
    ],
  },

  {
    slug: "terms",
    path: "/terms",
    title: "Terms of use",
    seoTitle: "Terms of Use",
    description:
      `The terms on which ${brand.name} provides this website — what the descriptions here mean, ` +
      "why we do not publish prices, and how our brand content may be used.",
    lead: "The terms that apply to this website. The terms that apply to a garment order are agreed with you when you place it.",
    updated: "2026-09-04",
    body: [
      { type: "h2", text: "About this website" },
      {
        type: "p",
        text: `This website is published by ${brand.displayName}, a fabric and tailoring business in ${brand.city}, ${brand.region}, ${brand.country}. It exists to describe what we make and how we work.`,
      },
      { type: "h2", text: "The information here is descriptive, not an offer" },
      {
        type: "p",
        text: "Descriptions of garments, fabrics, services and processes on this site are written to explain the work. They are not a quotation, a contract or a guarantee. What can be made, in what cloth, at what price and by when, is agreed with you directly — at the shop or in reply to your enquiry.",
      },
      {
        type: "p",
        text: "We deliberately do not publish prices, minimum order quantities or turnaround times on this website, because all three depend on the garment, the cloth and the season. Anyone quoting them on our behalf is not doing so with our agreement.",
      },
      { type: "h2", text: "Fabric and colour" },
      {
        type: "p",
        text: "Colour on a screen is not colour in daylight, and no two screens agree. Photographs and swatches here are indicative. Cloth should be seen in person before a decision, which is why we ask you to choose it at the counter.",
      },
      { type: "h2", text: "Our brand and content" },
      {
        type: "p",
        text: "The RADHA name, the monogram, the wordmark, and the photographs and written content on this site belong to us. Please do not reproduce them without asking. Quoting a short passage with a link back is welcome.",
      },
      { type: "h2", text: "Availability" },
      {
        type: "p",
        text: "We try to keep this site accurate and available, but we do not promise it will be uninterrupted or free of error. If you find something wrong, we would genuinely like to know.",
      },
      { type: "h2", text: "Links out" },
      {
        type: "p",
        text: "Where we link to other services — social media, maps, listings, our separate online store — we are not responsible for their content or their terms.",
      },
      { type: "h2", text: "Getting in touch" },
      { type: "p", text: contactLine },
    ],
  },

  {
    slug: "shipping-policy",
    path: "/shipping-policy",
    title: "Collection and delivery",
    seoTitle: "Collection & Delivery",
    description:
      `How a finished garment reaches you from ${brand.name} in Mannargudi — collection at the shop, ` +
      "delivery arranged for your order, and why we do not publish general timelines.",
    lead:
      "How a finished garment gets to you. The short version: most are collected at the shop, and anything else is arranged with you for your order.",
    updated: "2026-09-04",
    body: [
      { type: "h2", text: "Collection at the shop" },
      {
        type: "p",
        text: `A custom garment is fitted on you before it is finished, so almost every order involves a visit to our ${brand.city} shop anyway. The finished garment is pressed, packed and handed to you there.`,
      },
      { type: "h2", text: "Delivery" },
      {
        type: "p",
        text: "Where a garment needs to be sent rather than collected, we arrange it with you for your particular order. Because it depends on where you are, what is being sent and when you need it, we agree the arrangement and any cost with you at the time rather than publishing a general rule that would be wrong for most orders.",
      },
      {
        type: "p",
        text: "If delivery matters to you, say so in your enquiry or when you place the order and we will settle it up front.",
      },
      { type: "h2", text: "Timelines" },
      {
        type: "p",
        text: "We do not publish turnaround times. A single shirt, a three-piece wedding suit and a four-hundred-piece uniform run are different pieces of work, and the honest answer depends on the cloth, the complexity and the time of year. Tell us your deadline and we will tell you what is realistic before you commit.",
      },
      { type: "h2", text: "Bulk orders" },
      {
        type: "p",
        text: "Bulk and uniform orders are delivered against the arrangement agreed in the order — including how the run is split, where it is delivered and how new joiners are handled later. See our bulk orders section for how those conversations start.",
      },
      { type: "h2", text: "The online store" },
      {
        type: "p",
        text: "RADHA is building a separate online shopping platform. When it opens it will carry its own delivery terms, which will be published there.",
      },
      { type: "h2", text: "Getting in touch" },
      { type: "p", text: contactLine },
    ],
  },

  {
    slug: "alterations-and-returns",
    path: "/alterations-and-returns",
    title: "Alterations and returns",
    seoTitle: "Alterations & Returns",
    description: `How alterations, trials and returns work on custom garments made by ${brand.name}.`,
    lead:
      "Custom clothing is corrected before it is finished rather than returned afterwards. Here is how that actually works.",
    updated: "2026-09-04",
    body: [
      { type: "h2", text: "The trial is the point at which things get fixed" },
      {
        type: "p",
        text: "Every custom garment is fitted on you before it is finished. That is not a formality — it is the step where a shoulder is eased, a sleeve is shortened, and the trouser break is set to the shoes you actually wear.",
      },
      {
        type: "p",
        text: "Please treat the trial as the moment to say what is not right. Sit down in the garment, reach, move. Anything raised at the trial is corrected as part of making it.",
      },
      { type: "h2", text: "Alterations after delivery" },
      {
        type: "p",
        text: "Bring the garment back to the shop and we will look at it with you. Whether an adjustment is possible depends on the garment and on how much cloth there is to work with, so it is a conversation to have with the garment in hand rather than a promise made in advance.",
      },
      {
        type: "p",
        text: "Alteration is part of what a tailor does. A garment we made that has stopped sitting correctly is work for the same hands that cut it.",
      },
      { type: "h2", text: "Returns on custom garments" },
      {
        type: "p",
        text: "A made-to-measure garment is cut for one person from cloth chosen by that person, so it cannot simply be returned to stock in the way a ready-made garment can. What applies to your particular order — including anything you are entitled to if something has gone wrong on our side — is confirmed with you when you place the order.",
      },
      {
        type: "p",
        text: "If you are unhappy with something we have made, tell us. We would far rather hear it and put it right than have you wear something you do not like.",
      },
      { type: "h2", text: "Bulk orders" },
      {
        type: "p",
        text: "Bulk runs are made against a physical sample approved by you before production begins. That approved sample is the reference every unit is checked against, and it is what any question about a delivered run is settled by.",
      },
      { type: "h2", text: "Getting in touch" },
      { type: "p", text: contactLine },
    ],
  },
];

export const legalBySlug = Object.fromEntries(legalPages.map((page) => [page.slug, page]));
