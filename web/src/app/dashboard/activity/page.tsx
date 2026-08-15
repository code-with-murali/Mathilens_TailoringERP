"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/Pagination";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import {
  searchActivityLogs,
  getActivityLogFilters,
  type ActivityLog,
  type ActivityLogFilters,
} from "@/lib/api/activity";

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

/**
 * Where each recorded area sits in the menu.
 *
 * The log stores the code's own name for the area — "Billing", "Pricing", "Auth" — which is not
 * what anyone reading it has ever seen on screen. Mapped here rather than at the point of writing
 * so entries recorded before this existed read correctly too, and so renaming a menu item is a
 * one-line change in one place.
 */
const MENU_LOCATION: Record<string, { module: string; screen: string }> = {
  Orders: { module: "Orders", screen: "Orders" },
  Customers: { module: "Customers", screen: "Customers" },
  Measurements: { module: "Customers", screen: "Measurements" },
  Billing: { module: "Invoices", screen: "Invoices" },
  Invoices: { module: "Invoices", screen: "Invoices" },
  Pricing: { module: "Inventory", screen: "Price Details" },
  Inventory: { module: "Inventory", screen: "Cloth Receipts" },
  Reports: { module: "Reports", screen: "Reports" },
  Occasions: { module: "Reports", screen: "Birthday & Wedding" },
  WhatsApp: { module: "WhatsApp", screen: "WhatsApp" },
  Employees: { module: "User Management", screen: "Employees" },
  Auth: { module: "User Management", screen: "Users" },
  Users: { module: "User Management", screen: "Users" },
  Authorization: { module: "User Management", screen: "User Rights" },
  Activity: { module: "User Management", screen: "Activity Log" },
  Settings: { module: "Settings", screen: "Settings" },
};

/** Falls back to the stored name, so an area added later reads sensibly before it is mapped. */
function locationOf(screen: string) {
  return MENU_LOCATION[screen] ?? { module: screen, screen };
}

/**
 * A picked day covers the whole of that day. Sending the To date's midnight would exclude
 * everything that happened on it — the same trap the Reports page fell into.
 */
function toInstant(date: string, endOfDay: boolean): string | null {
  if (!date) {
    return null;
  }
  return new Date(`${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`).toISOString();
}

/**
 * What one entry did, as one line of labels and their values.
 *
 * An edit reads "Phone Number: 98765 43210 → 91234 56789"; a create or a delete has only one side,
 * so it falls back to the values the action carried. Kept to a single line on purpose: one action
 * is one row, and a bulleted list of changed fields turned a single edit into six lines of table
 * that scanned like six separate events.
 */
function describe(log: ActivityLog): string {
  if (log.changes.length > 0) {
    return log.changes
      .map((change) => `${change.field}: ${change.from ?? "empty"} → ${change.to ?? "empty"}`)
      .join(" · ");
  }

  return log.description ?? "—";
}

export default function ActivityLogPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [userId, setUserId] = useState("");
  const [screen, setScreen] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [filters, setFilters] = useState<ActivityLogFilters>({ screens: [], users: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, meta } = await searchActivityLogs(
        {
          fromUtc: toInstant(fromDate, false),
          toUtc: toInstant(toDate, true),
          userId: userId || null,
          screen: screen || null,
        },
        page,
        pageSize,
        getAccessToken(),
      );
      setLogs(items);
      setMeta(meta);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load the activity log.");
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate, userId, screen, page, pageSize]);

  const loadFilters = useCallback(async () => {
    // Filter options are a convenience; failing to load them shouldn't take the page down.
    setFilters(await getActivityLogFilters(getAccessToken()).catch(() => ({ screens: [], users: [] })));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFilters();
  }, [loadFilters]);

  /** Any filter change re-narrows the list, so page 1 is the only sensible place to land. */
  function applyFilter(apply: () => void) {
    apply();
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity Log</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Every change a person made — who did it and when. Viewing a page is not recorded, and nor is anything the
          system does on its own.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="fromDate" className="text-sm font-medium">
            From
          </label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => applyFilter(() => setFromDate(e.target.value))}
            className={fieldClassName}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="toDate" className="text-sm font-medium">
            To
          </label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => applyFilter(() => setToDate(e.target.value))}
            className={fieldClassName}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="userFilter" className="text-sm font-medium">
            User
          </label>
          <select
            id="userFilter"
            value={userId}
            onChange={(e) => applyFilter(() => setUserId(e.target.value))}
            className={fieldClassName}
          >
            <option value="">All users</option>
            {filters.users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.userName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="screenFilter" className="text-sm font-medium">
            Screen
          </label>
          <select
            id="screenFilter"
            value={screen}
            onChange={(e) => applyFilter(() => setScreen(e.target.value))}
            className={fieldClassName}
          >
            <option value="">All screens</option>
            {/* The stored key is the value, the menu name is what is read — otherwise the filter
                offers "Billing" for a screen the menu calls Invoices. */}
            {filters.screens.map((option) => (
              <option key={option} value={option}>
                {locationOf(option).screen}
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
      ) : logs.length === 0 ? (
        <p className="text-sm text-foreground/70">No activity recorded for these filters.</p>
      ) : (
        <div className="table-wrap overflow-x-auto rounded-lg border border-border">
          <table className="stacked w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                {/* No zone in the heading. The times are the reader's own clock, which is the only
                    one they were ever going to read it as. */}
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Screen</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const occurred = new Date(log.occurredAtUtc);
                const location = locationOf(log.screen);
                return (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td data-label="Date" className="px-4 py-3 whitespace-nowrap">
                      {occurred.toLocaleDateString()}
                    </td>
                    <td data-label="Time" className="px-4 py-3 whitespace-nowrap">
                      {occurred.toLocaleTimeString()}
                    </td>
                    <td data-label="User" className="px-4 py-3 whitespace-nowrap">
                      {log.userName ?? "—"}
                    </td>
                    <td data-label="Module" className="px-4 py-3 whitespace-nowrap">
                      {location.module}
                    </td>
                    <td data-label="Screen" className="px-4 py-3 whitespace-nowrap">
                      {location.screen}
                    </td>
                    <td data-label="Action" className="px-4 py-3 whitespace-nowrap">
                      {log.action}
                    </td>
                    {/* The widest column by far, so it is the one allowed to wrap — but it stays
                        one entry on one row. */}
                    <td data-label="Description" className="px-4 py-3 text-foreground/80 md:min-w-[18rem]">
                      {describe(log)}
                    </td>
                  </tr>
                );
              })}
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
  );
}
