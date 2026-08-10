"use client";

import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import {
  getRevenueReport,
  getOrderCollectionsReport,
  getOrderStatusSummaryReport,
  getOutstandingInvoicesReport,
  type RevenueReport,
  type OrderCollectionsReport,
  type OrderStatusSummaryReport,
  type OutstandingInvoice,
} from "@/lib/api/reports";

const PAGE_SIZE = 20;
const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

/** Ranges the shop actually thinks in — day-to-day operations at the short end, season-over-season comparison at the long end. */
const RANGE_PRESETS = [
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "3m", label: "Last 3 months", months: 3 },
  { key: "6m", label: "Last 6 months", months: 6 },
  { key: "9m", label: "Last 9 months", months: 9 },
  { key: "1y", label: "Last 1 year", months: 12 },
] as const;

type RangePreset = (typeof RANGE_PRESETS)[number];
type PresetKey = RangePreset["key"] | "custom";

const DEFAULT_PRESET: PresetKey = "30d";

/** yyyy-MM-dd read off the local calendar — "today" has to mean the shop's today, not UTC's. */
function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Both ends inclusive: "Last 7 days" is today and the six before it, not today minus seven. */
function presetRange(key: PresetKey): { from: string; to: string } {
  const preset = RANGE_PRESETS.find((p) => p.key === key);
  const to = new Date();
  const from = new Date();

  if (preset && "days" in preset) {
    from.setDate(from.getDate() - (preset.days - 1));
  } else if (preset) {
    // Month arithmetic rolls short months forward (31 Aug − 6 months lands on 2 or 3 Mar);
    // close enough for a report range, and never silently drops days off the end.
    from.setMonth(from.getMonth() - preset.months);
  }

  return { from: toIsoDate(from), to: toIsoDate(to) };
}

/**
 * The picked days as an inclusive UTC instant range. The end of the range has to be the *end* of
 * the To date — sending its midnight (as this page originally did) excluded everything that
 * happened on the last day, so today's figures never appeared at all.
 */
function toUtcRange(fromDate: string, toDate: string): { fromUtc: string; toUtc: string } {
  return {
    fromUtc: new Date(`${fromDate}T00:00:00.000Z`).toISOString(),
    toUtc: new Date(`${toDate}T23:59:59.999Z`).toISOString(),
  };
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
  const [preset, setPreset] = useState<PresetKey>(DEFAULT_PRESET);
  const [fromDate, setFromDate] = useState(() => presetRange(DEFAULT_PRESET).from);
  const [toDate, setToDate] = useState(() => presetRange(DEFAULT_PRESET).to);

  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [collections, setCollections] = useState<OrderCollectionsReport | null>(null);
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
      const { fromUtc, toUtc } = toUtcRange(fromDate, toDate);
      const [revenueData, collectionsData, statusData] = await Promise.all([
        getRevenueReport(fromUtc, toUtc, getAccessToken()),
        getOrderCollectionsReport(fromUtc, toUtc, getAccessToken()),
        getOrderStatusSummaryReport(fromUtc, toUtc, getAccessToken()),
      ]);
      setRevenue(revenueData);
      setCollections(collectionsData);
      setStatusSummary(statusData);
    } catch (error) {
      setSummariesError(error instanceof ApiError ? error.message : "Unable to load report data.");
    } finally {
      setIsLoadingSummaries(false);
    }
  }, [fromDate, toDate]);

  function applyPreset(key: PresetKey) {
    const { from, to } = presetRange(key);
    setPreset(key);
    setFromDate(from);
    setToDate(to);
  }

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

      <div className="flex flex-col gap-4">
        {/* One range control for the whole page, so no two sections can silently describe different periods. */}
        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => applyPreset(option.key)}
              aria-pressed={preset === option.key}
              className={
                preset === option.key
                  ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-full border border-border px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:border-primary hover:text-foreground"
              }
            >
              {option.label}
            </button>
          ))}
          <span
            aria-hidden="true"
            className={
              preset === "custom"
                ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-border px-3 py-1.5 text-sm text-foreground/50"
            }
          >
            Custom
          </span>
        </div>

        {/* Editing either date is itself the way into Custom — no need to pick the chip first. */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="fromDate" className="text-sm font-medium">
              From
            </label>
            <input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setPreset("custom");
                setFromDate(e.target.value);
              }}
              className={fieldClassName}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="toDate" className="text-sm font-medium">
              To
            </label>
            <input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => {
                setPreset("custom");
                setToDate(e.target.value);
              }}
              className={fieldClassName}
            />
          </div>
        </div>
      </div>

      {isLoadingSummaries ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : summariesError ? (
        <p role="alert" className="text-sm text-danger">
          {summariesError}
        </p>
      ) : (
        <>
          {collections && (
            <section className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-semibold">Orders &amp; Collections</h2>
                <p className="mt-1 text-sm text-foreground/70">
                  Orders booked in this period, valued at quantity × price — so work that hasn&apos;t been invoiced yet is counted too. These are
                  sales figures, not profit: the shop&apos;s cloth cost, labour and overheads aren&apos;t recorded against an order.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Orders" value={String(collections.orderCount)} />
                <StatTile label="Order value" value={collections.orderValue.toFixed(2)} />
                <StatTile label="Delivered value" value={collections.deliveredValue.toFixed(2)} />
                <StatTile label="Collected" value={collections.collectedAmount.toFixed(2)} />
                <StatTile label="Pending" value={collections.pendingAmount.toFixed(2)} />
                <StatTile label="Cancelled" value={collections.cancelledValue.toFixed(2)} />
                <StatTile label="Discounts given" value={collections.discountsGiven.toFixed(2)} />
              </div>
            </section>
          )}

          {revenue && (
            <section className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-semibold">Revenue</h2>
                <p className="mt-1 text-sm text-foreground/70">Invoices raised in this period — billing position, which will differ from order value above.</p>
              </div>
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
          <p role="alert" className="text-sm text-danger">
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
