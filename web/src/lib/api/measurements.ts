import { apiDelete, apiGet, apiGetPaged, apiPost, apiPut } from "@/lib/api-client";

/**
 * A garment is whatever the shop calls it — "Shirt", "Saree", "Chudidhar".
 *
 * This was a union of eight fixed names, matching a C# enum the API validated against. It is plain
 * text on both sides now: the garments a shop stitches are its own list, kept under
 * Settings › Garments, and a tailor working in sarees and chudidhars had nowhere to put them.
 */
export type GarmentType = string;

/**
 * The garments this system ships with, and the ones that arrive with standard measurement points.
 *
 * Only a starting list — a shop adds its own and may remove any of these. Read the shop's actual
 * list with getGarments (lib/api/garments), never this.
 */
export const GARMENT_TYPES = ["Shirt", "Trousers", "Suit", "Blazer", "Kurta", "Blouse", "Dress", "Other"] as const;

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

/** The measurement points to ask for on a garment, in the order the shop wants them entered. */
export type MeasurementTemplate = {
  garmentType: GarmentType;
  points: string[];
  /** False when the shop has never edited this garment type and is on the built-in starting list. */
  isCustomised: boolean;
};

/** Served by the Measurements module, not Settings — front desk and tailor staff take
 * measurements but hold no Settings permission, so reading the template must not need one. */
export function listMeasurementTemplates(token: string | null) {
  return apiGet<MeasurementTemplate[]>("/api/v1/measurements/templates", token);
}

// Encoded, because a garment is named by the shop and "Saree Blouse" is an ordinary name — the
// space, and anything else that means something in a URL, has to survive the trip as itself.
export function setMeasurementTemplate(garmentType: GarmentType, points: string[], token: string | null) {
  return apiPut<MeasurementTemplate>(`/api/v1/measurements/templates/${encodeURIComponent(garmentType)}`, { points }, token);
}

export function resetMeasurementTemplate(garmentType: GarmentType, token: string | null) {
  return apiDelete(`/api/v1/measurements/templates/${encodeURIComponent(garmentType)}`, token);
}
