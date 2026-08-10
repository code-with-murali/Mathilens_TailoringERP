"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge, INVOICE_STATUS_BADGE } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { useRouteId } from "@/lib/use-route-id";
import { ApiError } from "@/lib/api-client";
import { getInvoice, recordPayment, voidInvoice, PAYMENT_METHODS, type Invoice, type PaymentMethod } from "@/lib/api/billing";
import { getOrder, type Order } from "@/lib/api/orders";
import { getCustomer, type Customer } from "@/lib/api/customers";

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

export default function InvoiceDetailPage() {
  const invoiceId = useRouteId();
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const [confirmingVoid, setConfirmingVoid] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getInvoice(invoiceId, getAccessToken());
      setInvoice(data);
      // Neither the customer's name/phone nor the order's due date live on the invoice itself
      // (Invoice only stores CustomerId/OrderId) — fetched separately so this page can show them.
      const [orderData, customerData] = await Promise.all([
        getOrder(data.orderId, getAccessToken()),
        getCustomer(data.customerId, getAccessToken()),
      ]);
      setOrder(orderData);
      setCustomer(customerData);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load this invoice.");
    }
  }, [invoiceId]);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-mount pattern is intentionally not restructured
    // around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleRecordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaymentError(null);

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Enter a payment amount greater than zero.");
      return;
    }

    setIsRecordingPayment(true);
    try {
      await recordPayment(invoiceId, amount, paymentMethod, getAccessToken());
      showToast("Payment recorded.");
      setPaymentAmount("");
      await load();
    } catch (error) {
      setPaymentError(error instanceof ApiError ? error.message : "Unable to record this payment.");
    } finally {
      setIsRecordingPayment(false);
    }
  }

  async function handleVoid() {
    setIsVoiding(true);
    try {
      await voidInvoice(invoiceId, getAccessToken());
      showToast("Invoice voided.");
      setConfirmingVoid(false);
      await load();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Unable to void this invoice.", "error");
    } finally {
      setIsVoiding(false);
    }
  }

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-danger">
        {loadError}
      </p>
    );
  }

  if (!invoice) {
    return <p className="text-sm text-foreground/70">Loading…</p>;
  }

  const canRecordPayment = invoice.status !== "Void" && invoice.remainingBalance > 0;
  const canVoid = invoice.amountPaid === 0 && invoice.status !== "Void";

  return (
    <div className="flex flex-col gap-6">
      {/* print:block instead of a permanent header — the app-chrome title above says "Invoice"
          fine on screen, but a printed page needs its own letterhead since the dashboard nav
          (which carries the shop name) is hidden for print. */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-semibold">Mathilens Tailoring ERP</h1>
        <p className="text-sm text-foreground/70">Invoice #{invoice.id.slice(0, 8).toUpperCase()} — printed {new Date().toLocaleDateString()}</p>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold">Invoice</h1>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => window.print()} className="text-sm text-foreground/70 hover:text-foreground">
            Print
          </button>
          <Link href="/dashboard/invoices" className="text-sm text-foreground/70 hover:text-foreground">
            Back to invoices
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 print:border-0 print:p-0">
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-foreground/70">Customer</dt>
            <dd className="font-medium">{customer ? customer.fullName : "—"}</dd>
          </div>
          <div>
            <dt className="text-foreground/70">Phone number</dt>
            <dd className="font-medium">{customer ? customer.phoneNumber : "—"}</dd>
          </div>
          <div>
            <dt className="text-foreground/70">Due date</dt>
            <dd className="font-medium">{order ? new Date(order.dueAtUtc).toLocaleDateString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-foreground/70">Status</dt>
            <dd className="mt-0.5">
              <StatusBadge {...INVOICE_STATUS_BADGE[invoice.status]} />
            </dd>
          </div>
          <div>
            <dt className="text-foreground/70">Subtotal</dt>
            <dd className="font-medium">{invoice.subtotal.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-foreground/70">Tax</dt>
            <dd className="font-medium">{invoice.taxAmount.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-foreground/70">Discount</dt>
            <dd className="font-medium">{invoice.discountAmount.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-foreground/70">Total</dt>
            <dd className="font-medium">{invoice.totalAmount.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-foreground/70">Advance / Paid</dt>
            <dd className="font-medium">{invoice.amountPaid.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-foreground/70">Balance</dt>
            <dd className="font-medium">{invoice.remainingBalance.toFixed(2)}</dd>
          </div>
        </dl>

        {canVoid && (
          <div className="mt-4 print:hidden">
            <Button type="button" variant="danger" onClick={() => setConfirmingVoid(true)}>
              Void Invoice
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 print:border-0 print:p-0">
        <h2 className="mb-3 text-lg font-semibold">Payments</h2>
        {invoice.payments.length === 0 ? (
          <p className="text-sm text-foreground/70">No payments recorded yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {invoice.payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>{payment.method}</span>
                <span className="font-medium">{payment.amount.toFixed(2)}</span>
                <span className="text-foreground/70">{new Date(payment.createdAtUtc).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}

        {canRecordPayment && (
          <form onSubmit={handleRecordPayment} className="mt-4 flex flex-col gap-3 rounded-md border border-border bg-surface p-4 print:hidden">
            <span className="text-sm font-medium">Record a payment</span>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`Amount (balance: ${invoice.remainingBalance.toFixed(2)})`}
                className={fieldClassName}
              />
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={fieldClassName}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            {paymentError && (
              <p role="alert" className="text-sm text-danger">
                {paymentError}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={isRecordingPayment}>
                {isRecordingPayment ? "Recording…" : "Record payment"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <ConfirmDialog
        open={confirmingVoid}
        title="Void invoice"
        description="Are you sure you want to void this invoice? This cannot be undone."
        confirmLabel="Void"
        isConfirming={isVoiding}
        onConfirm={handleVoid}
        onCancel={() => setConfirmingVoid(false)}
      />
    </div>
  );
}
