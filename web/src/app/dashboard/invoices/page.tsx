"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/Pagination";
import { StatusBadge, INVOICE_STATUS_BADGE } from "@/components/ui/StatusBadge";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { searchInvoices, INVOICE_STATUSES, type DateRange, type Invoice, type InvoiceStatus } from "@/lib/api/billing";

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

/** The windows staff actually ask for at the counter, plus an explicit range for everything else. */
const DATE_PRESETS = [
  { key: "all", label: "All dates", days: null },
  { key: "today", label: "Today", days: 1 },
  { key: "3d", label: "Last 3 days", days: 3 },
  { key: "7d", label: "Last 7 days", days: 7 },
] as const;

type DatePresetKey = (typeof DATE_PRESETS)[number]["key"] | "custom";

/** yyyy-MM-dd read off the local calendar — "today" has to mean the shop's today, not UTC's. */
function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Both ends inclusive: "Last 7 days" is today and the six before it, not today minus seven. */
function presetDates(key: DatePresetKey): { from: string; to: string } {
  const preset = DATE_PRESETS.find((p) => p.key === key);
  const to = new Date();
  const from = new Date();
  if (preset?.days) {
    from.setDate(from.getDate() - (preset.days - 1));
  }
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

/**
 * The picked days as the half-open [from, to) instant range the API expects. The upper bound is
 * the *start of the day after* the To date, so an invoice raised late on the last day is still in
 * range without anyone having to reason about how precise the stored timestamp is.
 */
function toRange(fromDate: string, toDate: string): DateRange {
  const exclusiveEnd = new Date(`${toDate}T00:00:00.000Z`);
  exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
  return {
    fromUtc: new Date(`${fromDate}T00:00:00.000Z`).toISOString(),
    toUtc: exclusiveEnd.toISOString(),
  };
}

export default function InvoicesPage() {
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [datePreset, setDatePreset] = useState<DatePresetKey>("all");
  const [customFrom, setCustomFrom] = useState(() => presetDates("7d").from);
  const [customTo, setCustomTo] = useState(() => presetDates("today").to);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const range: DateRange =
      datePreset === "all"
        ? { fromUtc: null, toUtc: null }
        : datePreset === "custom"
          ? toRange(customFrom, customTo)
          : (() => {
              const { from, to } = presetDates(datePreset);
              return toRange(from, to);
            })();

    try {
      const { items, meta } = await searchInvoices(null, status || null, page, pageSize, getAccessToken(), range);
      setInvoices(items);
      setMeta(meta);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load invoices.");
    } finally {
      setIsLoading(false);
    }
  }, [status, datePreset, customFrom, customTo, page, pageSize]);

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

  function handleDatePresetChange(value: string) {
    setDatePreset(value as DatePresetKey);
    // A narrower window can be shorter than the page you're on.
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Invoices</h1>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="statusFilter" className="text-sm font-medium">
            Filter by status
          </label>
          <select
            id="statusFilter"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`max-w-xs ${fieldClassName}`}
          >
            <option value="">All statuses</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dateFilter" className="text-sm font-medium">
            Filter by date
          </label>
          <select
            id="dateFilter"
            value={datePreset}
            onChange={(e) => handleDatePresetChange(e.target.value)}
            className={`max-w-xs ${fieldClassName}`}
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
            <option value="custom">Custom range…</option>
          </select>
        </div>

        {/* Only the explicit range needs the two date boxes — the presets already know their dates. */}
        {datePreset === "custom" && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="dateFrom" className="text-sm font-medium">
                From
              </label>
              <input
                id="dateFrom"
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setPage(1);
                }}
                className={fieldClassName}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="dateTo" className="text-sm font-medium">
                To
              </label>
              <input
                id="dateTo"
                type="date"
                value={customTo}
                min={customFrom}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setPage(1);
                }}
                className={fieldClassName}
              />
            </div>
          </>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : loadError ? (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-foreground/70">No invoices found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
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
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(invoice.createdAtUtc).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge {...INVOICE_STATUS_BADGE[invoice.status]} />
                  </td>
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

      {meta && <Pagination
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />}
    </div>
  );
}
