"use client";

import { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getRevenueReport, type RevenueReport } from "@/lib/api/reports";
import { ReportRangeFilter, StatTile, toUtcRange, useReportRange } from "../ReportRange";

/** Invoices raised in a period — the billing position, which differs from order value. */
export default function RevenueReportPage() {
  const range = useReportRange();
  const [data, setData] = useState<RevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fromDate, toDate } = range;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { fromUtc, toUtc } = toUtcRange(fromDate, toDate);
      setData(await getRevenueReport(fromUtc, toUtc, getAccessToken()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load this report.");
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Revenue</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Invoices raised in this period — the billing position, which will differ from the order
          value on Orders &amp; Collections.
        </p>
      </div>

      <ReportRangeFilter range={range} />

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Invoices" value={String(data.invoiceCount)} />
          <StatTile label="Invoiced" value={data.totalInvoiced.toFixed(2)} />
          <StatTile label="Collected" value={data.totalCollected.toFixed(2)} />
          <StatTile label="Outstanding" value={data.totalOutstanding.toFixed(2)} />
        </div>
      ) : null}
    </div>
  );
}
