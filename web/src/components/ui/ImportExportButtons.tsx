"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { summarizeImport, uploadImport, type ImportResult } from "@/lib/api/import-export";
import { ExportButton } from "./ExportButton";

type ImportExportButtonsProps = {
  /** The API resource segment, e.g. "customers" — both endpoints hang off it. */
  resource: string;
  /** What to call the records in messages, e.g. "customers". */
  label: string;
  /** Called after a successful import so the list can reload. */
  onImported: () => void | Promise<void>;
};

/**
 * Export/Import pair for a master-data list page. Imports are partial-success, so a run that
 * reports failures shows them inline (addressed by spreadsheet row) rather than only toasting —
 * the operator needs to know which rows to fix before re-uploading.
 */
export function ImportExportButtons({ resource, label, onImported }: ImportExportButtonsProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  async function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset immediately so choosing the same file twice in a row still fires a change event.
    event.target.value = "";
    if (!file) {
      return;
    }

    setIsImporting(true);
    setLastResult(null);
    try {
      const result = await uploadImport(resource, file, getAccessToken());
      setLastResult(result);
      showToast(summarizeImport(result), result.failed > 0 ? "error" : "success");
      await onImported();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : `Unable to import ${label}.`, "error");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {/* Export is its own component now: it asks for a format, and the same chooser is reused by
            screens that have no import at all. */}
        <ExportButton resource={resource} label={label} />
        <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
          {isImporting ? "Importing…" : "Import"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChosen}
          className="hidden"
        />
      </div>

      {lastResult && lastResult.errors.length > 0 && (
        <div role="alert" className="max-w-md rounded-md border border-danger/40 bg-danger/5 p-3 text-left text-xs">
          <p className="font-medium text-danger">
            {lastResult.failed} row{lastResult.failed === 1 ? "" : "s"} could not be imported:
          </p>
          <ul className="mt-1 flex flex-col gap-0.5 text-foreground/80">
            {lastResult.errors.slice(0, 10).map((rowError) => (
              <li key={rowError.rowNumber}>
                Row {rowError.rowNumber}: {rowError.message}
              </li>
            ))}
          </ul>
          {lastResult.errors.length > 10 && (
            <p className="mt-1 text-foreground/60">…and {lastResult.errors.length - 10} more.</p>
          )}
        </div>
      )}
    </div>
  );
}
