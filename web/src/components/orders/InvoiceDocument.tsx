"use client";

import { Fragment, useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { getBranding, EMPTY_BRANDING, type Branding } from "@/lib/api/branding";
import {
  getInvoiceSettings,
  formatInvoiceDate,
  invoiceNumberFor,
  DEFAULT_INVOICE_SETTINGS,
  type InvoiceSettings,
} from "@/lib/api/invoice-settings";
import type { Invoice } from "@/lib/api/billing";
import type { Order } from "@/lib/api/orders";
import type { Customer } from "@/lib/api/customers";

const DEFAULT_SHOP_NAME = "Mathilens Tailoring";

function money(amount: number): string {
  return amount.toFixed(2);
}

/**
 * The bill slip — what the customer is handed, and the only definition of that layout.
 *
 * <p>A till receipt, not a page: one narrow column, monospaced so the figures line up, dashed rules
 * instead of boxes. It prints on a roll and gets folded into a pocket, so everything on it has to
 * earn its line. Rendered both in the print modal and on the order's Invoice card, from this one
 * component — a second copy of a document is where the two quietly stop matching.</p>
 *
 * <p>Letterhead, number format, date format and footer come from Invoice Settings (logo and tagline
 * from Branding), so each shop prints its own without a code change.</p>
 */
export function InvoiceDocument({
  invoice,
  order,
  customer,
  settings: settingsOverride,
}: {
  invoice: Invoice;
  order: Order;
  customer: Customer;
  /** Settings to render with instead of the saved ones — how the Invoice Settings screen previews
   * edits that haven't been saved yet. Omit everywhere else. */
  settings?: InvoiceSettings;
}) {
  const [branding, setBranding] = useState<Branding>(EMPTY_BRANDING);
  const [savedSettings, setSavedSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);

  const isPreview = settingsOverride !== undefined;

  useEffect(() => {
    // A shop that has configured nothing gets the defaults below rather than an error.
    getBranding(getAccessToken())
      .then(setBranding)
      .catch(() => {});

    // A preview is handed its settings, so reading the saved ones would be a request whose answer
    // is thrown away.
    if (!isPreview) {
      getInvoiceSettings(getAccessToken())
        .then(setSavedSettings)
        .catch(() => {});
    }
  }, [isPreview]);

  const settings = settingsOverride ?? savedSettings;
  const shopName = settings.companyName.trim() || DEFAULT_SHOP_NAME;
  const addressLines = settings.address.split("\n").map((line) => line.trim()).filter(Boolean);
  const showDate = (iso: string) => formatInvoiceDate(iso, settings.dateFormat);

  const orderNumber = order.orderNumber?.trim() || `#${order.id.slice(0, 8).toUpperCase()}`;

  return (
    // Smaller type on a narrower roll, but a touch more line spacing than the text size would
    // normally carry — a slip that is merely squeezed is harder to read across, not easier.
    <div className="mx-auto w-full max-w-[19rem] font-mono text-[11px] leading-[1.45] text-foreground">
      <div className="flex flex-col items-center text-center">
        {branding.logoUrl.trim() !== "" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt="" className="mb-1 h-7 w-auto object-contain" />
        )}
        <span className="text-[13px] font-bold uppercase leading-snug tracking-wide">{shopName}</span>
        {branding.tagline.trim() !== "" && <span>{branding.tagline}</span>}
        {addressLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
        {settings.phoneNumber.trim() !== "" && <span>Ph: {settings.phoneNumber}</span>}
      </div>

      <Rule />

      <Line label="Bill No" value={invoiceNumberFor(invoice.id, invoice.createdAtUtc, settings)} />
      <Line label="Date" value={showDate(invoice.createdAtUtc)} />
      <Line label="Order" value={orderNumber} />
      <Line label="Customer" value={customer.fullName} />
      <Line label="Phone" value={customer.phoneNumber} />

      <Rule />

      {/* Fixed columns so the figures stack in a straight line down the slip, which is the whole
          reason a receipt is monospaced. The name takes what's left and wraps if it has to. */}
      <div className="grid grid-cols-[1fr_1.5rem_3rem_3.5rem] gap-x-1">
        <span className="font-semibold">ITEM</span>
        <span className="text-right font-semibold">QTY</span>
        <span className="text-right font-semibold">RATE</span>
        <span className="text-right font-semibold">AMT</span>

        {order.items.map((item) => (
          <Fragment key={item.id}>
            <span className="break-words">{item.garmentType}</span>
            <span className="text-right">{item.quantity}</span>
            <span className="text-right">{money(item.unitPrice)}</span>
            <span className="text-right">{money(item.quantity * item.unitPrice)}</span>
          </Fragment>
        ))}
      </div>

      <Rule />

      {/* Tax and discount only when there is one — a permanent row of zeroes is a line the reader
          has to check and then ignore, on a slip where every line costs paper. No subtotal: with
          nothing added or taken off it just repeats the total, and when there is something the
          item lines above already add up to it. */}
      {invoice.taxAmount > 0 && <Line label="Tax" value={money(invoice.taxAmount)} />}
      {invoice.discountAmount > 0 && <Line label="Discount" value={money(invoice.discountAmount)} />}
      <Line label="TOTAL" value={money(invoice.totalAmount)} bold />

      <Rule />

      {/* No status word: Paid and Balance already say it, and "PART PAID" beside a balance of 500
          is the same fact twice. */}
      <Line label="Paid" value={money(invoice.amountPaid)} />
      <Line label="Balance" value={money(invoice.remainingBalance)} bold />

      <Rule />

      <div className="flex flex-col items-center gap-0.5 text-center">
        {/* The one date the customer came for. It is the due date under another name, so it is
            printed once, here, where they will look for it. */}
        <span className="font-semibold">Collect on {showDate(order.dueAtUtc)}</span>
        <span>Thank you for choosing {shopName}!</span>
        <span className="text-foreground/70">{settings.footerNote}</span>
      </div>
    </div>
  );
}

function Rule() {
  return <div aria-hidden="true" className="my-1 border-t border-dashed border-foreground/40" />;
}

function Line({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${bold ? "font-bold" : ""}`}>
      <span className={bold ? undefined : "text-foreground/70"}>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
