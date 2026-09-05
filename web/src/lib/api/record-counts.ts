import { apiGet } from "@/lib/api-client";

/**
 * How many records each list screen holds, keyed by screen.
 *
 * Mirrors RecordCountKeys on the server. Partial by design: the server leaves out any screen this
 * user may not open, so a missing key means "not yours to see", not "zero".
 */
export type RecordCounts = Partial<{
  orders: number;
  customers: number;
  invoices: number;
  fabricPrices: number;
  clothReceipts: number;
  employees: number;
  users: number;
}>;

export type RecordCountKey = keyof RecordCounts;

/**
 * The menu badge numbers, in one call.
 *
 * Never rejects: a badge is decoration on a menu that has to render regardless, so a failure here
 * returns no counts rather than taking down every screen's navigation.
 */
export function getRecordCounts(token: string | null): Promise<RecordCounts> {
  return apiGet<RecordCounts>("/api/v1/record-counts", token).catch(() => ({}));
}
