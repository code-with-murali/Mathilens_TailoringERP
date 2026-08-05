"use client";

import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import {
  getRevenueReport,
  getOrderStatusSummaryReport,
  getOutstandingInvoicesReport,
  type RevenueReport,
  type OrderStatusSummaryReport,
  type OutstandingInvoice,
} from "@/lib/api/reports";

const PAGE_SIZE = 20;
const fieldClassName =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20";

function isoDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-4">
      <div className="text-sm text-foreground/70">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState(() => isoDateDaysAgo(30));
  const [toDate, setToDate] = useState(() => isoDateDaysAgo(0));

  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [statusSummary, setStatusSummary] = useState<OrderStatusSummaryReport | null>(null);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(true);
  const [summariesError, setSummariesError] = useState<string | null>(null);

  const [invoicePage, setInvoicePage] = useState(1);
  const [outstandingInvoices, setOutstandingInvoices] = useState<OutstandingInvoice[]>([]);
  const [invoicesMeta, setInvoicesMeta] = useState<PaginationMeta | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const loadSummaries = useCallback(async () => {
    setIsLoadingSummaries(true);
    setSummariesError(null);
    try {
      const fromUtc = new Date(fromDate).toISOString();
      const toUtc = new Date(toDate).toISOString();
      const [revenueData, statusData] = await Promise.all([
        getRevenueReport(fromUtc, toUtc, getAccessToken()),
        getOrderStatusSummaryReport(fromUtc, toUtc, getAccessToken()),
      ]);
      setRevenue(revenueData);
      setStatusSummary(statusData);
    } catch (error) {
      setSummariesError(error instanceof ApiError ? error.message : "Unable to load report data.");
    } finally {
      setIsLoadingSummaries(false);
    }
  }, [fromDate, toDate]);

  const loadOutstandingInvoices = useCallback(async () => {
    setIsLoadingInvoices(true);
    setInvoicesError(null);
    try {
      const { items, meta } = await getOutstandingInvoicesReport(invoicePage, PAGE_SIZE, getAccessToken());
      setOutstandingInvoices(items);
      setInvoicesMeta(meta);
    } catch (error) {
      setInvoicesError(error instanceof ApiError ? error.message : "Unable to load outstanding invoices.");
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [invoicePage]);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-dependency-change pattern is intentionally not
    // restructured around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOutstandingInvoices();
  }, [loadOutstandingInvoices]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="fromDate" className="text-sm font-medium">
            From
          </label>
          <input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={fieldClassName} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="toDate" className="text-sm font-medium">
            To
          </label>
          <input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={fieldClassName} />
        </div>
      </div>

      {isLoadingSummaries ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : summariesError ? (
        <p role="alert" className="text-sm text-red-600">
          {summariesError}
        </p>
      ) : (
        <>
          {revenue && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Revenue</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Invoices" value={String(revenue.invoiceCount)} />
                <StatTile label="Invoiced" value={revenue.totalInvoiced.toFixed(2)} />
                <StatTile label="Collected" value={revenue.totalCollected.toFixed(2)} />
                <StatTile label="Outstanding" value={revenue.totalOutstanding.toFixed(2)} />
              </div>
            </section>
          )}

          {statusSummary && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Orders by Status</h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface">
                    <tr>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusSummary.statusCounts.map((row) => (
                      <tr key={row.status} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">{row.status}</td>
                        <td className="px-4 py-3">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Outstanding Invoices</h2>
        {isLoadingInvoices ? (
          <p className="text-sm text-foreground/70">Loading…</p>
        ) : invoicesError ? (
          <p role="alert" className="text-sm text-red-600">
            {invoicesError}
          </p>
        ) : outstandingInvoices.length === 0 ? (
          <p className="text-sm text-foreground/70">No outstanding invoices.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {outstandingInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{invoice.status}</td>
                    <td className="px-4 py-3">{invoice.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3">{invoice.amountPaid.toFixed(2)}</td>
                    <td className="px-4 py-3">{invoice.remainingBalance.toFixed(2)}</td>
                    <td className="px-4 py-3">{new Date(invoice.createdAtUtc).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {invoicesMeta && <Pagination meta={invoicesMeta} onPageChange={setInvoicePage} />}
      </section>
    </div>
  );
}
