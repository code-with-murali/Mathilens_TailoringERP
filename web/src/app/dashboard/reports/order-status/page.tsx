"use client";

import { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getOrderStatusSummaryReport, type OrderStatusSummaryReport } from "@/lib/api/reports";
import { orderStatusLabel } from "@/components/ui/StatusBadge";
import { ReportRangeFilter, toUtcRange, useReportRange } from "../ReportRange";

/** How many orders sit at each status in the chosen period. */
export default function OrderStatusReportPage() {
  const range = useReportRange();
  const [data, setData] = useState<OrderStatusSummaryReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fromDate, toDate } = range;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { fromUtc, toUtc } = toUtcRange(fromDate, toDate);
      setData(await getOrderStatusSummaryReport(fromUtc, toUtc, getAccessToken()));
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
        <h1 className="text-2xl font-semibold">Orders by Status</h1>
        <p className="mt-1 text-sm text-foreground/70">Where the period&apos;s orders currently stand.</p>
      </div>

      <ReportRangeFilter range={range} />

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : !data || data.statusCounts.length === 0 ? (
        <p className="text-sm text-foreground/70">No orders in this period.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Count</th>
              </tr>
            </thead>
            <tbody>
              {data.statusCounts.map((row) => (
                <tr key={row.status} className="border-b border-border last:border-0">
                  {/* Through the shared label map — this table used to print the raw enum. */}
                  <td className="px-4 py-3">{orderStatusLabel(row.status)}</td>
                  <td className="px-4 py-3">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
