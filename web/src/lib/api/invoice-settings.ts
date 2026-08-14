import { listSettings, upsertSetting, SHOP_NAME_KEY, SHOP_CONTACT_NUMBER_KEY } from "./settings";
import { SHOP_ADDRESS_KEY, SHOP_TAGLINE_KEY, BRANDING_LOGO_URL_KEY } from "./branding";

/**
 * The letterhead keys are the same three Branding writes, deliberately: a shop that changes its
 * phone number on one screen has changed it on the other, because there is only ever one stored
 * value. Two screens, one setting.
 */
export const INVOICE_NUMBER_PREFIX_KEY = "Invoice.NumberPrefix";
export const INVOICE_NUMBER_INCLUDE_YEAR_KEY = "Invoice.NumberIncludeYear";
export const INVOICE_DATE_FORMAT_KEY = "Invoice.DateFormat";
export const INVOICE_FOOTER_NOTE_KEY = "Invoice.FooterNote";
/** A percentage, stored as a plain number string — "5" means 5% of the order's own total. */
export const INVOICE_TAX_RATE_KEY = "Invoice.TaxRatePercent";

export const DATE_FORMATS = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd-MMM-yyyy"] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export const DEFAULT_FOOTER_NOTE = "Please retain this invoice for your records.";
export const DEFAULT_NUMBER_PREFIX = "INV";

export type InvoiceSettings = {
  companyName: string;
  address: string;
  phoneNumber: string;
  numberPrefix: string;
  numberIncludeYear: boolean;
  dateFormat: DateFormat;
  footerNote: string;
  taxRatePercent: number;
  /** Read for the letterhead, edited on the Branding screen — this screen never writes them. */
  tagline: string;
  logoUrl: string;
};

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  companyName: "",
  address: "",
  phoneNumber: "",
  numberPrefix: DEFAULT_NUMBER_PREFIX,
  numberIncludeYear: true,
  dateFormat: "dd/MM/yyyy",
  footerNote: "",
  taxRatePercent: 0,
  tagline: "",
  logoUrl: "",
};

function isDateFormat(value: string | undefined): value is DateFormat {
  return DATE_FORMATS.includes(value as DateFormat);
}

/** As many settings as the API will return in one page — there are a couple of dozen in total. */
const SETTINGS_PAGE_SIZE = 100;
const SETTINGS_MAX_PAGES = 5;

/**
 * Everything the shop decides about its invoices.
 *
 * <p>Read as one listing rather than a request per key. Eleven parallel lookups for one letterhead
 * was a lot of ways for a printed invoice to end up wearing the wrong shop's name, and every one of
 * them failed silently into a default. One request has one outcome: it worked, or it did not.</p>
 *
 * <p>Throws rather than returning defaults. A caller that would rather show something than nothing
 * can catch it — but that has to be a decision someone made, not what happens by omission.</p>
 */
export async function getInvoiceSettings(token: string | null): Promise<InvoiceSettings> {
  const values = new Map<string, string>();

  for (let page = 1; page <= SETTINGS_MAX_PAGES; page += 1) {
    const { items, meta } = await listSettings(page, SETTINGS_PAGE_SIZE, token);
    items.forEach((setting) => values.set(setting.key, setting.value));

    if (page >= meta.totalPages) {
      break;
    }
  }

  const rate = Number(values.get(INVOICE_TAX_RATE_KEY));
  const dateFormat = values.get(INVOICE_DATE_FORMAT_KEY);

  return {
    companyName: values.get(SHOP_NAME_KEY) ?? "",
    address: values.get(SHOP_ADDRESS_KEY) ?? "",
    phoneNumber: values.get(SHOP_CONTACT_NUMBER_KEY) ?? "",
    numberPrefix: values.get(INVOICE_NUMBER_PREFIX_KEY)?.trim() || DEFAULT_NUMBER_PREFIX,
    // Anything other than an explicit "false" keeps the year, which is what the shop's sample
    // invoice showed and what most of them expect.
    numberIncludeYear: values.get(INVOICE_NUMBER_INCLUDE_YEAR_KEY) !== "false",
    dateFormat: isDateFormat(dateFormat) ? dateFormat : DEFAULT_INVOICE_SETTINGS.dateFormat,
    // Returned exactly as stored, blank included. Substituting the default here put it in the
    // settings field as though someone had typed it, so saving wrote the default back as a real
    // value and a blank footer could never be told from a chosen one. The slip applies the default
    // when it prints; this is the stored value, and the round trip has to be faithful.
    footerNote: values.get(INVOICE_FOOTER_NOTE_KEY) ?? "",
    // A stored value that isn't a usable rate falls back to no tax. Charging a customer on the
    // strength of an unparseable setting is the one outcome worth ruling out here.
    taxRatePercent: Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 0,
    tagline: values.get(SHOP_TAGLINE_KEY) ?? "",
    logoUrl: values.get(BRANDING_LOGO_URL_KEY) ?? "",
  };
}

/** Writes blanks through as blanks — clearing the address on this screen has to actually clear it. */
export async function saveInvoiceSettings(settings: InvoiceSettings, token: string | null): Promise<void> {
  const values: [string, string][] = [
    [SHOP_NAME_KEY, settings.companyName.trim()],
    [SHOP_ADDRESS_KEY, settings.address.trim()],
    [SHOP_CONTACT_NUMBER_KEY, settings.phoneNumber.trim()],
    [INVOICE_NUMBER_PREFIX_KEY, settings.numberPrefix.trim().toUpperCase()],
    [INVOICE_NUMBER_INCLUDE_YEAR_KEY, String(settings.numberIncludeYear)],
    [INVOICE_DATE_FORMAT_KEY, settings.dateFormat],
    [INVOICE_FOOTER_NOTE_KEY, settings.footerNote.trim()],
    [INVOICE_TAX_RATE_KEY, String(settings.taxRatePercent)],
  ];

  for (const [key, value] of values) {
    await upsertSetting(key, value, token);
  }
}

const MONTH_ABBREVIATIONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Formatted by hand rather than through a locale, so what the shop picked is what prints. */
export function formatInvoiceDate(iso: string, format: DateFormat): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  switch (format) {
    case "MM/dd/yyyy":
      return `${month}/${day}/${year}`;
    case "yyyy-MM-dd":
      return `${year}-${month}-${day}`;
    case "dd-MMM-yyyy":
      return `${day}-${MONTH_ABBREVIATIONS[date.getMonth()]}-${year}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * The reference printed on the invoice — "INV-2026-93563890".
 *
 * <p>The tail is the invoice's own id, not a running count. An invoice has no number of its own in
 * the database, and a count generated in the browser could hand the same one to two invoices raised
 * at the same moment — a duplicated number on a document a customer holds is worse than an ugly
 * one. The code and the year are real settings; when the API grows a proper series, the tail is the
 * only part that changes.</p>
 */
export function invoiceNumberFor(invoiceId: string, createdAtUtc: string, settings: InvoiceSettings): string {
  const prefix = settings.numberPrefix.trim().toUpperCase() || DEFAULT_NUMBER_PREFIX;
  const reference = invoiceId.slice(0, 8).toUpperCase();

  return settings.numberIncludeYear
    ? `${prefix}-${new Date(createdAtUtc).getFullYear()}-${reference}`
    : `${prefix}-${reference}`;
}

/**
 * The tax to send with a new invoice, given the order's own total.
 *
 * <p>Computed here rather than server-side because the API takes an amount, not a rate. Rounded to
 * the paisa the same way in every caller — a figure printed on a customer's invoice should not
 * depend on which screen raised it.</p>
 */
export function taxAmountFor(subtotal: number, taxRatePercent: number): number {
  if (taxRatePercent <= 0) {
    return 0;
  }

  return Math.round(subtotal * taxRatePercent) / 100;
}
