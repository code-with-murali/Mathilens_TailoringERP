/**
 * Site navigation.
 *
 * The header carries five items and no more. A men's clothing brand is browsed, not searched, and
 * a nav that lists twenty URLs reads like a directory; the deeper pages are reached from the
 * sections that introduce them and from the footer, which is where a visitor who wants the index
 * actually looks.
 */

export type NavItem = {
  label: string;
  href: string;
  /** Shown under the label in the mobile drawer, where there is room for a line of orientation. */
  blurb?: string;
  children?: { label: string; href: string }[];
};

export const primaryNav: NavItem[] = [
  {
    label: "Collections",
    href: "/services",
    blurb: "Suits, blazers, shirts, trousers and wedding wear, cut to your measurements.",
    children: [
      { label: "Suits", href: "/suits" },
      { label: "Blazers", href: "/blazers" },
      { label: "Shirts", href: "/shirts" },
      { label: "Trousers", href: "/trousers" },
      { label: "Wedding & Groom", href: "/wedding" },
      { label: "All services", href: "/services" },
    ],
  },
  {
    label: "Fabric",
    href: "/fabrics",
    blurb: "How the cloth is chosen, and what each family of fabric is good for.",
  },
  {
    label: "Tailoring",
    href: "/process",
    blurb: "Seven steps from the first conversation to the finished garment.",
    children: [
      { label: "The tailoring process", href: "/process" },
      { label: "Men's tailoring", href: "/services/mens-tailoring" },
      { label: "Custom clothing", href: "/services/custom-clothing" },
      { label: "Digital measurements", href: "/process#digital-measurements" },
    ],
  },
  {
    label: "Bulk Orders",
    href: "/bulk-orders",
    blurb: "Uniforms and volume clothing for companies, schools, colleges and institutions.",
    children: [
      { label: "Bulk & corporate overview", href: "/bulk-orders" },
      { label: "Corporate uniforms", href: "/bulk-orders/corporate" },
      { label: "School uniforms", href: "/bulk-orders/schools" },
      { label: "College uniforms", href: "/bulk-orders/colleges" },
      { label: "Institutional uniforms", href: "/bulk-orders/institutions" },
    ],
  },
  {
    label: "House",
    href: "/about",
    blurb: "Who RADHA is, where we are, and how far the work travels.",
    children: [
      { label: "About RADHA", href: "/about" },
      { label: "Mannargudi", href: "/mannargudi" },
      { label: "Delta region", href: "/delta-region" },
      { label: "Journal", href: "/journal" },
    ],
  },
];

export const footerGroups: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Garments",
    links: [
      { label: "Custom suits", href: "/suits" },
      { label: "Custom blazers", href: "/blazers" },
      { label: "Custom shirts", href: "/shirts" },
      { label: "Custom trousers", href: "/trousers" },
      { label: "Wedding & groom wear", href: "/wedding" },
      { label: "Fabric collection", href: "/fabrics" },
    ],
  },
  {
    title: "Tailoring",
    links: [
      { label: "Men's tailoring", href: "/services/mens-tailoring" },
      { label: "Custom clothing", href: "/services/custom-clothing" },
      { label: "The process", href: "/process" },
      { label: "All services", href: "/services" },
    ],
  },
  {
    title: "Bulk & corporate",
    links: [
      { label: "Bulk orders", href: "/bulk-orders" },
      { label: "Corporate uniforms", href: "/bulk-orders/corporate" },
      { label: "School uniforms", href: "/bulk-orders/schools" },
      { label: "College uniforms", href: "/bulk-orders/colleges" },
      { label: "Institutional uniforms", href: "/bulk-orders/institutions" },
    ],
  },
  {
    title: "House",
    links: [
      { label: "About RADHA", href: "/about" },
      { label: "Mannargudi", href: "/mannargudi" },
      { label: "Delta region", href: "/delta-region" },
      { label: "Journal", href: "/journal" },
      { label: "Shop online", href: "/shop" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export const legalLinks = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of use", href: "/terms" },
  { label: "Shipping policy", href: "/shipping-policy" },
  { label: "Alterations & returns", href: "/alterations-and-returns" },
];
