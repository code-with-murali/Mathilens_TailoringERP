import { apiGet, apiGetPaged, apiPost, apiPut } from "@/lib/api-client";

export const GARMENT_TYPES = ["Shirt", "Trousers", "Suit", "Blazer", "Kurta", "Blouse", "Dress", "Other"] as const;
export type GarmentType = (typeof GARMENT_TYPES)[number];

export type Measurement = {
  id: string;
  customerId: string;
  garmentType: GarmentType;
  values: Record<string, number>;
  createdAtUtc: string;
};

export type MeasurementHistoryEntry = {
  id: string;
  measurementId: string;
  garmentType: GarmentType;
  values: Record<string, number>;
  createdAtUtc: string;
};

export function listMeasurementsForCustomer(customerId: string, token: string | null) {
  return apiGet<Measurement[]>(`/api/v1/customers/${customerId}/measurements`, token);
}

export function getMeasurement(id: string, token: string | null) {
  return apiGet<Measurement>(`/api/v1/measurements/${id}`, token);
}

export function createMeasurement(
  customerId: string,
  garmentType: GarmentType,
  values: Record<string, number>,
  token: string | null,
) {
  return apiPost<Measurement>(`/api/v1/customers/${customerId}/measurements`, { garmentType, values }, token);
}

export function updateMeasurementValues(id: string, values: Record<string, number>, token: string | null) {
  return apiPut<Measurement>(`/api/v1/measurements/${id}`, { values }, token);
}

export function getMeasurementHistory(id: string, page: number, pageSize: number, token: string | null) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return apiGetPaged<MeasurementHistoryEntry>(`/api/v1/measurements/${id}/history?${params}`, token);
}
