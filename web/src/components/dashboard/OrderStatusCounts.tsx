"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { searchOrders, type OrderStatus } from "@/lib/api/orders";

const STATUS_TILES: { status: OrderStatus; label: string }[] = [
  { status: "Received", label: "Received" },
  { status: "InProgress", label: "In progress" },
  { status: "ReadyForDelivery", label: "Ready for delivery" },
];

type Counts = Partial<Record<OrderStatus, number>>;

/** Live counts of orders by status (Received/InProgress/ReadyForDelivery), read from each
 * status filter's pagination meta rather than fetching every order. Shared between the
 * Dashboard page and the New Order page's otherwise-blank Measurement panel. */
export function OrderStatusCounts() {
  const [counts, setCounts] = useState<Counts>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = getAccessToken();

    Promise.all(STATUS_TILES.map(({ status }) => searchOrders(null, status, 1, 1, token)))
      .then((results) => {
        if (cancelled) {
          return;
        }
        const next: Counts = {};
        results.forEach(({ meta }, index) => {
          next[STATUS_TILES[index].status] = meta.totalCount;
        });
        setCounts(next);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STATUS_TILES.map(({ status, label }) => (
        <div key={status} className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
          <span className="text-sm text-foreground/70">{label}</span>
          <span className="text-2xl font-semibold">{isLoading ? "—" : (counts[status] ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}
