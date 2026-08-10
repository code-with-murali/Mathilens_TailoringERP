import { apiGet, apiGetPaged } from "@/lib/api-client";

export type ActivityLog = {
  id: string;
  userId: string | null;
  userName: string | null;
  screen: string;
  action: string;
  requestName: string;
  occurredAtUtc: string;
};

export type ActivityLogUser = { userId: string; userName: string };

/** Only the values actually present in the log, so a filter can never come back empty by construction. */
export type ActivityLogFilters = { screens: string[]; users: ActivityLogUser[] };

export function searchActivityLogs(
  filters: { fromUtc: string | null; toUtc: string | null; userId: string | null; screen: string | null },
  page: number,
  pageSize: number,
  token: string | null,
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.fromUtc) {
    params.set("fromUtc", filters.fromUtc);
  }
  if (filters.toUtc) {
    params.set("toUtc", filters.toUtc);
  }
  if (filters.userId) {
    params.set("userId", filters.userId);
  }
  if (filters.screen) {
    params.set("screen", filters.screen);
  }
  return apiGetPaged<ActivityLog>(`/api/v1/activity-logs?${params}`, token);
}

export function getActivityLogFilters(token: string | null) {
  return apiGet<ActivityLogFilters>("/api/v1/activity-logs/filters", token);
}
