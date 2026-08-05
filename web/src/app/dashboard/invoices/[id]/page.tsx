"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getInvoice, recordPayment, voidInvoice, PAYMENT_METHODS, type Invoice, type PaymentMethod } from "@/lib/api/billing";

const fieldClassName =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const [confirmingVoid, setConfirmingVoid] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getInvoice(params.id, getAccessToken());
      setInvoice(data);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load this invoice.");
    }
  }, [params.id]);

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
      await recordPayment(params.id, amount, paymentMethod, getAccessToken());
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
      await voidInvoice(params.id, getAccessToken());
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
      <p role="alert" className="text-sm text-red-600">
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoice</h1>
        <Link href="/dashboard/invoices" className="text-sm text-foreground/70 hover:text-foreground">
          Back to invoices
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-foreground/70">Status</dt>
            <dd className="font-medium">{invoice.status}</dd>
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
            <dt className="text-foreground/70">Remaining balance</dt>
            <dd className="font-medium">{invoice.remainingBalance.toFixed(2)}</dd>
          </div>
        </dl>

        {canVoid && (
          <div className="mt-4">
            <Button type="button" variant="danger" onClick={() => setConfirmingVoid(true)}>
              Void Invoice
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
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
          <form onSubmit={handleRecordPayment} className="mt-4 flex flex-col gap-3 rounded-md border border-border bg-background p-4">
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
              <p role="alert" className="text-sm text-red-600">
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
