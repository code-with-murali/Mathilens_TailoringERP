"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge, ORDER_STATUS_BADGE } from "@/components/ui/StatusBadge";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { searchOrders, ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/api/orders";
import { getCustomer, type Customer } from "@/lib/api/customers";

const PAGE_SIZE = 20;

function orderNumber(order: Order) {
  return `#${order.id.slice(0, 8).toUpperCase()}`;
}

export default function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customersById, setCustomersById] = useState<Record<string, Customer>>({});
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, meta } = await searchOrders(null, status || null, page, PAGE_SIZE, getAccessToken());
      setOrders(items);
      setMeta(meta);

      const token = getAccessToken();
      const uniqueCustomerIds = Array.from(new Set(items.map((order) => order.customerId)));
      const customers = await Promise.all(
        uniqueCustomerIds.map((customerId) => getCustomer(customerId, token).catch(() => null)),
      );
      setCustomersById((prev) => {
        const next = { ...prev };
        customers.forEach((customer) => {
          if (customer) {
            next[customer.id] = customer;
          }
        });
        return next;
      });
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-dependency-change pattern is intentionally not
    // restructured around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
  }, [loadOrders]);

  function handleStatusChange(value: string) {
    setStatus(value as OrderStatus | "");
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Link href="/dashboard/orders/new">
          <Button type="button">New Order</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="statusFilter" className="text-sm font-medium">
          Filter by status
        </label>
        <select
          id="statusFilter"
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : loadError ? (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-foreground/70">No orders found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium">Order Number</th>
                <th className="px-4 py-3 font-medium">Customer Name</th>
                <th className="px-4 py-3 font-medium">Phone Number</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const customer = customersById[order.customerId];
                return (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-primary hover:underline">
                        {orderNumber(order)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{customer?.fullName ?? "—"}</td>
                    <td className="px-4 py-3">{customer?.phoneNumber ?? "—"}</td>
                    <td className="px-4 py-3">{new Date(order.dueAtUtc).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge {...ORDER_STATUS_BADGE[order.status]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
