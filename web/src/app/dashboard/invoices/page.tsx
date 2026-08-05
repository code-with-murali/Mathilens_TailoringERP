"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/ui/Pagination";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { searchInvoices, INVOICE_STATUSES, type Invoice, type InvoiceStatus } from "@/lib/api/billing";

const PAGE_SIZE = 20;

export default function InvoicesPage() {
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [page, setPage] = useState(1);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, meta } = await searchInvoices(null, status || null, page, PAGE_SIZE, getAccessToken());
      setInvoices(items);
      setMeta(meta);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load invoices.");
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-dependency-change pattern is intentionally not
    // restructured around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInvoices();
  }, [loadInvoices]);

  function handleStatusChange(value: string) {
    setStatus(value as InvoiceStatus | "");
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Invoices</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="statusFilter" className="text-sm font-medium">
          Filter by status
        </label>
        <select
          id="statusFilter"
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        >
          <option value="">All statuses</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : loadError ? (
        <p role="alert" className="text-sm text-red-600">
          {loadError}
        </p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-foreground/70">No invoices found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{invoice.status}</td>
                  <td className="px-4 py-3">{invoice.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">{invoice.amountPaid.toFixed(2)}</td>
                  <td className="px-4 py-3">{invoice.remainingBalance.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/invoices/${invoice.id}`} className="text-foreground/70 hover:text-foreground">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
