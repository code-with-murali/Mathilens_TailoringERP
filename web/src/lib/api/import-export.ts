import { apiGetFile, apiPostFile } from "@/lib/api-client";
import { saveBlob } from "@/lib/download";

/** What an import did, per 00_MASTER_SPEC.md § 8.6 — rows that failed are addressed by their spreadsheet row number. */
export type ImportResult = {
  created: number;
  updated: number;
  failed: number;
  errors: { rowNumber: number; message: string }[];
};

/** Downloads a module's .xlsx export and hands it to the browser under the server's filename. */
export async function downloadExport(resource: string, token: string | null): Promise<void> {
  const { blob, filename } = await apiGetFile(`/api/v1/${resource}/export`, token);
  saveBlob(blob, filename);
}

export function uploadImport(resource: string, file: File, token: string | null): Promise<ImportResult> {
  return apiPostFile<ImportResult>(`/api/v1/${resource}/import`, file, token);
}

/** Turns an import result into the one-line summary the list pages toast. */
export function summarizeImport(result: ImportResult): string {
  const parts = [`${result.created} added`, `${result.updated} updated`];
  if (result.failed > 0) {
    parts.push(`${result.failed} failed`);
  }
  return parts.join(", ") + ".";
}
