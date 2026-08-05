import { apiDelete, apiGetPaged, apiPut } from "@/lib/api-client";

export type Setting = {
  id: string;
  key: string;
  value: string;
  createdAtUtc: string;
  lastModifiedAtUtc: string | null;
};

export function listSettings(page: number, pageSize: number, token: string | null) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return apiGetPaged<Setting>(`/api/v1/settings?${params}`, token);
}

export function upsertSetting(key: string, value: string, token: string | null) {
  return apiPut<Setting>(`/api/v1/settings/${encodeURIComponent(key)}`, { value }, token);
}

export function deleteSetting(key: string, token: string | null) {
  return apiDelete(`/api/v1/settings/${encodeURIComponent(key)}`, token);
}
