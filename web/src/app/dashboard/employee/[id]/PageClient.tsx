"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { useRouteId } from "@/lib/use-route-id";
import { usePermissions } from "@/lib/use-permissions";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { PERMISSIONS } from "@/lib/api/users";
import {
  getEmployee,
  getEmployeeOrders,
  retireEmployee,
  EMPLOYMENT_TYPE_LABELS,
  type Employee,
  type EmployeeOrder,
} from "@/lib/api/employees";

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

/** yyyy-MM-dd off the local calendar, for date inputs and defaults. */
function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** A date-only value from the API is already yyyy-MM-dd; parsing it as UTC avoids a day-shift. */
function formatDate(isoDate: string | null): string {
  return isoDate ? new Date(`${isoDate}T00:00:00Z`).toLocaleDateString() : "—";
}

/** Timestamps are real instants, so they render in the reader's own zone. */
function formatInstant(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-foreground/50">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

/**
 * Everything about one employee: who they are on top, and every order they have worked below.
 *
 * The order table reports the work timestamps the order workflow records — when the job was picked
 * up and when it was finished — which is not the same as when the customer collected it.
 */
export default function EmployeeViewPage() {
  const employeeId = useRouteId();
  const { showToast } = useToast();
  const { can } = usePermissions();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [orders, setOrders] = useState<EmployeeOrder[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showRetire, setShowRetire] = useState(false);
  const [lastWorkingDate, setLastWorkingDate] = useState(todayIsoDate);
  const [retireError, setRetireError] = useState<string | null>(null);
  const [isRetiring, setIsRetiring] = useState(false);

  const canManage = can(PERMISSIONS.employeesManage);

  const loadEmployee = useCallback(async () => {
    try {
      setEmployee(await getEmployee(employeeId, getAccessToken()));
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load this employee.");
    }
  }, [employeeId]);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { items, meta } = await getEmployeeOrders(employeeId, page, pageSize, getAccessToken());
      setOrders(items);
      setMeta(meta);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load this employee's orders.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, page, pageSize]);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-dependency-change pattern is intentionally not
    // restructured around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEmployee();
  }, [loadEmployee]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
  }, [loadOrders]);

  async function handleRetire(returnToWork: boolean) {
    setRetireError(null);
    setIsRetiring(true);
    try {
      const updated = await retireEmployee(employeeId, returnToWork ? null : lastWorkingDate, getAccessToken());
      setEmployee(updated);
      setShowRetire(false);
      showToast(returnToWork ? `${updated.fullName} is back on the active roster.` : `${updated.fullName} retired.`);
    } catch (error) {
      setRetireError(error instanceof ApiError ? error.message : "Unable to update this employee.");
    } finally {
      setIsRetiring(false);
    }
  }

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-danger">
        {loadError}
      </p>
    );
  }

  if (!employee) {
    return <p className="text-sm text-foreground/70">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{employee.fullName}</h1>
          <p className="mt-1 text-sm text-foreground/70">
            {employee.employeeCode}
            {employee.jobTitle ? ` · ${employee.jobTitle}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && !employee.isActive && (
            <Button type="button" variant="secondary" onClick={() => handleRetire(true)} disabled={isRetiring}>
              Return to work
            </Button>
          )}
          {canManage && employee.isActive && !showRetire && (
            <Button type="button" variant="secondary" onClick={() => setShowRetire(true)}>
              Retire
            </Button>
          )}
          <Link href={`/dashboard/employees/${employee.id}`}>
            <Button type="button">Edit</Button>
          </Link>
          <Link href="/dashboard/employees" className="text-sm text-foreground/70 hover:text-foreground">
            Back to employees
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Employee code" value={employee.employeeCode} />
          <Detail label="Phone" value={employee.phoneNumber} />
          <Detail label="Email" value={employee.email ?? "—"} />
          <Detail label="Job title" value={employee.jobTitle ?? "—"} />
          <Detail label="Joining date" value={formatDate(employee.joiningDate)} />
          <Detail label="Employment type" value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]} />
          <Detail label="Last working date" value={formatDate(employee.lastWorkingDate)} />
          <Detail
            label="Status"
            value={
              employee.isActive ? (
                <span className="text-success">Active</span>
              ) : (
                <span className="text-foreground/60">Retired</span>
              )
            }
          />
        </div>

        {showRetire && (
          <div className="flex flex-wrap items-end gap-4 rounded-md border border-border bg-background/40 p-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="lastWorkingDate" className="text-sm font-medium">
                Last working date
              </label>
              <input
                id="lastWorkingDate"
                type="date"
                value={lastWorkingDate}
                min={employee.joiningDate}
                onChange={(e) => setLastWorkingDate(e.target.value)}
                className={fieldClassName}
              />
            </div>
            <Button type="button" onClick={() => handleRetire(false)} disabled={isRetiring}>
              {isRetiring ? "Saving…" : "Confirm retire"}
            </Button>
            <button
              type="button"
              onClick={() => setShowRetire(false)}
              className="py-2 text-sm text-foreground/70 hover:text-foreground"
            >
              Cancel
            </button>
            <p className="w-full text-sm text-foreground/60">
              Retiring keeps their record and order history — it only takes them off the list for new work.
            </p>
            {retireError && (
              <p role="alert" className="w-full text-sm text-danger">
                {retireError}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Order History</h2>

        {isLoading ? (
          <p className="text-sm text-foreground/70">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-foreground/70">No orders have been assigned to this employee yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Work started</th>
                  <th className="px-4 py-3 font-medium">Work finished</th>
                  <th className="px-4 py-3 font-medium">Delivered</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      <Link href={`/dashboard/orders/${order.orderId}`} className="hover:text-primary">
                        #{order.orderId.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3">{order.itemCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{order.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatInstant(order.dueAtUtc)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatInstant(order.workStartedAtUtc)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatInstant(order.workCompletedAtUtc)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatInstant(order.deliveredAtUtc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && (
          <Pagination
            meta={meta}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}
