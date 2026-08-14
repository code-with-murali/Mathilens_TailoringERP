import { getSetting, upsertSetting, SHOP_NAME_KEY, SHOP_CONTACT_NUMBER_KEY } from "./settings";
import { SHOP_ADDRESS_KEY } from "./branding";

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
};

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  companyName: "",
  address: "",
  phoneNumber: "",
  numberPrefix: DEFAULT_NUMBER_PREFIX,
  numberIncludeYear: true,
  dateFormat: "dd/MM/yyyy",
  footerNote: DEFAULT_FOOTER_NOTE,
  taxRatePercent: 0,
};

function isDateFormat(value: string | undefined): value is DateFormat {
  return DATE_FORMATS.includes(value as DateFormat);
}

/**
 * Everything the shop decides about its invoices.
 *
 * <p>A key that has never been set 404s, which is the normal state for a shop that has not opened
 * this screen — so a miss becomes the default rather than an error, and one absent key never blanks
 * the rest.</p>
 */
export async function getInvoiceSettings(token: string | null): Promise<InvoiceSettings> {
  const keys = [
    SHOP_NAME_KEY,
    SHOP_ADDRESS_KEY,
    SHOP_CONTACT_NUMBER_KEY,
    INVOICE_NUMBER_PREFIX_KEY,
    INVOICE_NUMBER_INCLUDE_YEAR_KEY,
    INVOICE_DATE_FORMAT_KEY,
    INVOICE_FOOTER_NOTE_KEY,
    INVOICE_TAX_RATE_KEY,
  ];

  const [name, address, phone, prefix, includeYear, dateFormat, footer, tax] = await Promise.all(
    keys.map((key) => getSetting(key, token).catch(() => null)),
  );

  const rate = Number(tax?.value);

  return {
    companyName: name?.value ?? "",
    address: address?.value ?? "",
    phoneNumber: phone?.value ?? "",
    numberPrefix: prefix?.value?.trim() || DEFAULT_NUMBER_PREFIX,
    // Anything other than an explicit "false" keeps the year, which is what the shop's sample
    // invoice showed and what most of them expect.
    numberIncludeYear: includeYear?.value !== "false",
    dateFormat: isDateFormat(dateFormat?.value) ? dateFormat.value : DEFAULT_INVOICE_SETTINGS.dateFormat,
    footerNote: footer?.value?.trim() || DEFAULT_FOOTER_NOTE,
    // A stored value that isn't a usable rate falls back to no tax. Charging a customer on the
    // strength of an unparseable setting is the one outcome worth ruling out here.
    taxRatePercent: Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 0,
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
