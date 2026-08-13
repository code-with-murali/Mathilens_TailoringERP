"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { GarmentType } from "@/lib/api/measurements";
import { useMeasurementFields } from "@/lib/use-measurement-templates";

export type ValueRowInput = { name: string; value: string };

type Row = ValueRowInput & { id: number };

function toRows(fields: readonly string[], values: Record<string, number>): Row[] {
  return fields.map((name, id) => ({ id, name, value: values[name] !== undefined ? String(values[name]) : "" }));
}

type MeasurementValuesEditorProps = {
  garmentType: GarmentType;
  initialValues?: Record<string, number>;
  onChange: (rows: ValueRowInput[]) => void;
};

/** Renders the shop's configured measurement points for a garment type (Settings › Measurement
 * Templates), in the configured order. Callers should remount this (e.g. a `key` on the parent
 * form keyed to whatever's being edited) when switching targets — entered values are not kept in
 * sync with later prop changes. */
export function MeasurementValuesEditor({ garmentType, initialValues = {}, onChange }: MeasurementValuesEditorProps) {
  const { fields, isLoading } = useMeasurementFields(garmentType);
  const [rows, setRows] = useState<Row[]>(() => toRows(fields, initialValues));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // The template arrives from the API, so the rows are rebuilt when it lands rather than only
    // at mount. Reporting them to the parent immediately also matters for the pre-filled case:
    // reviewing existing values and saving without touching a field must not look like nothing
    // was entered.
    const next = toRows(fields, initialValues);
    // Genuinely synchronizing with an external system: the template is fetched, so the rows it
    // defines cannot be known during the first render and there is nothing to derive them from.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(next);
    onChange(next.map(({ name, value }) => ({ name, value })));
    // initialValues/onChange are caller-recreated each render; `fields` is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

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

  if (isLoading) {
    return <p className="text-sm text-foreground/70">Loading measurement points…</p>;
  }

  if (fields.length === 0) {
    return <p className="text-sm text-foreground/70">No measurement points configured for {garmentType} yet.</p>;
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
