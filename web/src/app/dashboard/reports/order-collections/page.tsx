"use client";

import { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getOrderCollectionsReport, type OrderCollectionsReport } from "@/lib/api/reports";
import { ReportRangeFilter, StatTile, toUtcRange, useReportRange } from "../ReportRange";

/** Orders booked in a period, and how much of that money has actually come in. */
export default function OrderCollectionsReportPage() {
  const range = useReportRange();
  const [data, setData] = useState<OrderCollectionsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fromDate, toDate } = range;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { fromUtc, toUtc } = toUtcRange(fromDate, toDate);
      setData(await getOrderCollectionsReport(fromUtc, toUtc, getAccessToken()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load this report.");
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-dependency-change pattern is intentionally not
    // restructured around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Orders &amp; Collections</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Orders booked in this period, valued at quantity × price — so work that hasn&apos;t been
          invoiced yet is counted too. These are sales figures, not profit: the shop&apos;s cloth
          cost, labour and overheads aren&apos;t recorded against an order.
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
          <StatTile label="Orders" value={String(data.orderCount)} />
          <StatTile label="Order value" value={data.orderValue.toFixed(2)} />
          <StatTile label="Delivered value" value={data.deliveredValue.toFixed(2)} />
          <StatTile label="Collected" value={data.collectedAmount.toFixed(2)} />
          <StatTile label="Pending" value={data.pendingAmount.toFixed(2)} />
          <StatTile label="Cancelled" value={data.cancelledValue.toFixed(2)} />
          <StatTile label="Discounts given" value={data.discountsGiven.toFixed(2)} />
        </div>
      ) : null}
    </div>
  );
}
