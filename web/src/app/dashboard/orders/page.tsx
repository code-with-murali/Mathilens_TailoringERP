"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/Pagination";
import { StatusBadge, ORDER_STATUS_BADGE, orderStatusLabel } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { searchOrders, deleteOrder, ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/api/orders";
import { getCustomer, type Customer } from "@/lib/api/customers";


/**
 * The shop's own reference — "MTL-0001".
 *
 * The fallback is a slice of the id, which is what this column showed before order numbers existed.
 * The AddOrderNumbers migration backfilled every order, so nothing should reach it; it is here so a
 * row can never render an empty cell where its identifier belongs.
 */
function orderNumber(order: Order) {
  return order.orderNumber?.trim() || `#${order.id.slice(0, 8).toUpperCase()}`;
}

export default function OrdersPage() {
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customersById, setCustomersById] = useState<Record<string, Customer>>({});
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, meta } = await searchOrders(
        null,
        status || null,
        page,
        pageSize,
        getAccessToken(),
        debouncedSearch,
      );
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
  }, [debouncedSearch, status, page, pageSize]);

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

  // Back to page one on every change: narrowing the list while sitting on page four otherwise shows
  // an empty table, which reads as "no matches" rather than "your matches are on page one".
  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteOrder(pendingDelete.id, getAccessToken());
      showToast("Order deleted.");
      setPendingDelete(null);
      await loadOrders();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Unable to delete this order.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Link href="/dashboard/orders/new">
          <Button type="button">New Order</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {/* One box for all three, because whoever is at the counter has been handed one of them —
            a number off a receipt, a name, or a phone — and should not have to know which. */}
        <div className="min-w-[16rem] flex-1">
          <Input
            id="orderSearch"
            label="Search by order number, name or phone"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="e.g. MTL-0007, Asha, 98765…"
          />
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
          <option value="">All Status</option>
          {/* Through the shared label map, not the raw value: this dropdown was the one place the
              enum leaked to the screen as "ReadyForDelivery". */}
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>
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
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Advanced</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
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
                    <td className="px-4 py-3 text-right tabular-nums">{order.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{order.amountPaid?.toFixed(2) ?? "—"}</td>
                    {/* Outstanding money is the number worth spotting from across the room. */}
                    <td
                      className={
                        order.balanceAmount !== null && order.balanceAmount > 0
                          ? "px-4 py-3 text-right font-medium tabular-nums text-danger"
                          : "px-4 py-3 text-right tabular-nums"
                      }
                    >
                      {order.balanceAmount?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge {...ORDER_STATUS_BADGE[order.status]} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <Link href={`/dashboard/orders/${order.id}`} className="text-foreground/70 hover:text-foreground">
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(order)}
                          className="text-danger hover:text-danger-hover"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete order"
        description={
          pendingDelete
            ? `Are you sure you want to delete order ${orderNumber(pendingDelete)}? To keep it in reporting, cancel it instead.`
            : ""
        }
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
