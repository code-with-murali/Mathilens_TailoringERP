"use client";

import { useState } from "react";

export type ValueRowInput = { name: string; value: string };

type Row = ValueRowInput & { id: number };

let nextRowId = 0;

function toRows(values: Record<string, number>): Row[] {
  const entries = Object.entries(values);
  if (entries.length === 0) {
    return [{ id: nextRowId++, name: "", value: "" }];
  }
  return entries.map(([name, value]) => ({ id: nextRowId++, name, value: String(value) }));
}

type MeasurementValuesEditorProps = {
  initialValues?: Record<string, number>;
  onChange: (rows: ValueRowInput[]) => void;
};

/** Free-form name/value point editor — measurement points are a flexible set, not fixed fields (see the backend's Measurement domain entity). */
export function MeasurementValuesEditor({ initialValues = {}, onChange }: MeasurementValuesEditorProps) {
  const [rows, setRows] = useState<Row[]>(() => toRows(initialValues));

  function updateRows(next: Row[]) {
    setRows(next);
    onChange(next.map(({ name, value }) => ({ name, value })));
  }

  function updateRow(id: number, field: "name" | "value", newValue: string) {
    updateRows(rows.map((row) => (row.id === id ? { ...row, [field]: newValue } : row)));
  }

  function addRow() {
    updateRows([...rows, { id: nextRowId++, name: "", value: "" }]);
  }

  function removeRow(id: number) {
    updateRows(rows.filter((row) => row.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Measurement points (cm)</span>
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <input
            aria-label="Measurement point name"
            placeholder="e.g. Chest"
            value={row.name}
            onChange={(e) => updateRow(row.id, "name", e.target.value)}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <input
            aria-label="Measurement value"
            type="number"
            step="0.1"
            placeholder="cm"
            value={row.value}
            onChange={(e) => updateRow(row.id, "value", e.target.value)}
            className="w-28 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <button
            type="button"
            onClick={() => removeRow(row.id)}
            className="text-sm text-red-600 hover:text-red-700"
            aria-label="Remove measurement point"
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow} className="self-start text-sm text-foreground/70 hover:text-foreground">
        + Add point
      </button>
    </div>
  );
}
