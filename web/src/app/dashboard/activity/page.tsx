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
 * The viewer's own zone, resolved once — the log stores UTC, but "when did this happen" only means
 * anything in the reader's local time. Shown alongside the time (IST for a shop in India) so a
 * reader never has to wonder which clock a row is quoting.
 */
const TIME_ZONE_LABEL = (() => {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
})();

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
 * What one entry changed.
 *
 * <p>An edit shows each field's before-and-after, which is the thing worth reading. A create or a
 * delete has only one side, so it falls back to the description — the values the action carried.
 * Older entries have neither and say so, rather than looking like an action that changed nothing.</p>
 */
function ChangeList({ log }: { log: ActivityLog }) {
  if (log.changes.length > 0) {
    return (
      <ul className="flex flex-col gap-1">
        {log.changes.map((change, index) => (
          <li key={`${change.entity}-${change.field}-${index}`} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium text-foreground">{change.field}</span>
            <span className="text-foreground/60 line-through">{change.from ?? "empty"}</span>
            <span aria-hidden="true" className="text-foreground/50">
              →
            </span>
            <span className="font-medium text-foreground">{change.to ?? "empty"}</span>
          </li>
        ))}
      </ul>
    );
  }

  return <span>{log.description ?? "—"}</span>;
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
          Every change made in the system — who did it and when. Records actions that changed something; viewing pages is not recorded.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
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
            {filters.screens.map((option) => (
              <option key={option} value={option}>
                {option}
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
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time{TIME_ZONE_LABEL && ` (${TIME_ZONE_LABEL})`}</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Screen</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">What changed</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const occurred = new Date(log.occurredAtUtc);
                return (
                  <tr key={log.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">{occurred.toLocaleDateString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{occurred.toLocaleTimeString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{log.userName ?? "System"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{log.screen}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{log.action}</td>
                    {/* The widest column by far, so it is the one allowed to wrap. */}
                    <td className="min-w-[20rem] px-4 py-3 text-foreground/80">
                      <ChangeList log={log} />
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
