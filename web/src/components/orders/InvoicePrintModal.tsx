"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { getSetting, SHOP_NAME_KEY, SHOP_CONTACT_NUMBER_KEY } from "@/lib/api/settings";
import type { Invoice } from "@/lib/api/billing";
import type { Order } from "@/lib/api/orders";
import type { Customer } from "@/lib/api/customers";

type InvoicePrintModalProps = {
  invoice: Invoice;
  order: Order;
  customer: Customer;
  onClose: () => void;
  /** Opens straight into the print dialog (for the "Print Invoice" button) instead of waiting for
   * the on-screen Print button (for "View Invoice"). */
  autoPrint?: boolean;
};

const DEFAULT_SHOP_NAME = "Mathilens Tailoring";

/** Printable invoice shown right after Generate invoice, as a modal rather than a page navigation
 * so staff can print and keep working on the same order. Shop name/contact number are read from
 * the generic Settings key/value store (Shop.Name / Shop.ContactNumber) so each shop can set its
 * own letterhead from the Settings page without a code change. */
export function InvoicePrintModal({ invoice, order, customer, onClose, autoPrint = false }: InvoicePrintModalProps) {
  const [shopName, setShopName] = useState(DEFAULT_SHOP_NAME);
  const [shopContactNumber, setShopContactNumber] = useState("");

  useEffect(() => {
    getSetting(SHOP_NAME_KEY, getAccessToken())
      .then((setting) => setShopName(setting.value || DEFAULT_SHOP_NAME))
      .catch(() => {
        // No shop name configured yet — falls back to the default above.
      });
    getSetting(SHOP_CONTACT_NUMBER_KEY, getAccessToken())
      .then((setting) => setShopContactNumber(setting.value))
      .catch(() => {
        // No contact number configured yet — stays blank rather than showing a placeholder.
      });
  }, []);

  useEffect(() => {
    // Mount-only: this component is conditionally rendered (unmounted on Close), so every open
    // is a fresh mount and this fires exactly once per "Print Invoice" click.
    if (autoPrint) {
      window.print();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 print:static print:inset-auto print:z-auto print:block print:bg-transparent print:p-0"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-background p-6 print:max-h-none print:w-auto print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:p-0">
        <div className="flex items-center justify-between print:hidden">
          <h2 className="text-lg font-semibold">Invoice</h2>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => window.print()} className="text-sm text-foreground/70 hover:text-foreground">
              Print
            </button>
            <button type="button" onClick={onClose} className="text-sm text-foreground/70 hover:text-foreground">
              Close
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 border-b-2 border-black pb-3 text-center">
          <span className="text-xs uppercase tracking-wide text-foreground/60">Invoice</span>
          <span className="text-xl font-semibold">{shopName}</span>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-foreground/70">Order number</dt>
            <dd className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</dd>
          </div>
          <div>
            <dt className="text-foreground/70">Order date</dt>
            <dd className="font-medium">{new Date(order.createdAtUtc).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-foreground/70">Customer</dt>
            <dd className="font-medium">{customer.fullName}</dd>
          </div>
          <div>
            <dt className="text-foreground/70">Phone number</dt>
            <dd className="font-medium">{customer.phoneNumber}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-1 border-y-2 border-black py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground/70">Total amount</span>
            <span className="font-medium">{invoice.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/70">Advance paid</span>
            <span className="font-medium">{invoice.amountPaid.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/70">Balance due</span>
            <span className="font-medium">{invoice.remainingBalance.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/70">Collection date</span>
          <span className="font-medium">{new Date(order.dueAtUtc).toLocaleDateString()}</span>
        </div>

        {shopContactNumber && (
          <div className="text-center text-xs text-foreground/70">Contact: {shopContactNumber}</div>
        )}
      </div>
    </div>
  );
}
