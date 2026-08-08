"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { GarmentType } from "@/lib/api/measurements";

export type ValueRowInput = { name: string; value: string };

type Row = ValueRowInput & { id: number };

/** Fixed measurement-point template per garment type, matching the shop's standard measurement
 * sheet — no free-form add/remove. Only Shirt and Trousers have a defined template today; other
 * garment types fall back to a "not configured yet" message rather than inventing fields. */
const GARMENT_MEASUREMENT_FIELDS: Partial<Record<GarmentType, readonly string[]>> = {
  Shirt: ["Neck", "Shoulder width", "Chest", "Waist", "Hip", "Sleeve length", "Bicep", "Wrist", "Shirt length"],
  Trousers: [
    "Waist",
    "Hip/Seat",
    "Thigh",
    "Knee",
    "Calf",
    "Inseam (inside leg)",
    "Outseam (waist to ankle)",
    "Rise (front & back)",
    "Bottom opening (ankle width)",
  ],
};

function toRows(fields: readonly string[], values: Record<string, number>): Row[] {
  return fields.map((name, id) => ({ id, name, value: values[name] !== undefined ? String(values[name]) : "" }));
}

/** The fixed measurement-point names for a garment type, in their standard order — exposed so
 * callers that need to lay the points out themselves (rather than rendering this component's
 * own single-list layout) don't have to duplicate the template. */
export function getMeasurementFields(garmentType: GarmentType): readonly string[] {
  return GARMENT_MEASUREMENT_FIELDS[garmentType] ?? [];
}

type MeasurementValuesEditorProps = {
  garmentType: GarmentType;
  initialValues?: Record<string, number>;
  onChange: (rows: ValueRowInput[]) => void;
};

/** Renders the fixed measurement points for a garment type. Callers should remount this (e.g. a
 * `key` on the parent form keyed to whatever's being edited) when switching targets — internal
 * state is only initialized once, not kept in sync with later prop changes. */
export function MeasurementValuesEditor({ garmentType, initialValues = {}, onChange }: MeasurementValuesEditorProps) {
  const fields = GARMENT_MEASUREMENT_FIELDS[garmentType] ?? [];
  const [rows, setRows] = useState<Row[]>(() => toRows(fields, initialValues));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // Reports the pre-filled rows to the parent immediately — otherwise reviewing existing
    // values and saving without touching a field would look like nothing had been entered.
    onChange(rows.map(({ name, value }) => ({ name, value })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateValue(id: number, value: string) {
    const next = rows.map((row) => (row.id === id ? { ...row, value } : row));
    setRows(next);
    onChange(next.map(({ name, value }) => ({ name, value })));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key !== "Enter") return;
    const next = inputRefs.current[index + 1];
    if (next) {
      // Not the last field — move to the next measurement field instead of submitting, so
      // staff can keep both hands on the keyboard like Tab.
      e.preventDefault();
      next.focus();
      return;
    }
    // Last field: let the browser's native Enter-submits-form behavior through, which saves
    // via the form's onSubmit — same as clicking the Save button.
  }

  if (fields.length === 0) {
    return <p className="text-sm text-foreground/70">No measurement template configured for {garmentType} yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <div key={row.id} className="flex items-center gap-3">
          <label className="w-48 shrink-0 text-sm text-foreground/80">{row.name}</label>
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            aria-label={`${row.name} measurement value`}
            type="number"
            step="0.1"
            min="0"
            placeholder="cm"
            value={row.value}
            onChange={(e) => updateValue(row.id, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-28 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>
      ))}
    </div>
  );
}
