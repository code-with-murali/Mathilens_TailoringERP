"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api-client";
import { GARMENT_TYPES, type GarmentType } from "@/lib/api/measurements";
import { MeasurementValuesEditor, type ValueRowInput } from "./MeasurementValuesEditor";

type MeasurementFormProps = {
  /** Fixed (and the select disabled) when editing — a measurement's garment type never changes after creation. */
  garmentType?: GarmentType;
  initialValues?: Record<string, number>;
  submitLabel: string;
  onSubmit: (garmentType: GarmentType, values: Record<string, number>) => Promise<void>;
};

export function MeasurementForm({ garmentType: fixedGarmentType, initialValues, submitLabel, onSubmit }: MeasurementFormProps) {
  const [garmentType, setGarmentType] = useState<GarmentType>(fixedGarmentType ?? GARMENT_TYPES[0]);
  const [rows, setRows] = useState<ValueRowInput[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const values: Record<string, number> = {};
    for (const row of rows) {
      if (row.value.trim() === "") {
        // Fixed fields are individually optional — skip the ones not measured yet, rather than
        // forcing every point to be filled in before anything can be saved.
        continue;
      }
      const numericValue = Number(row.value);
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        setFormError(`"${row.name}" needs a value greater than zero.`);
        return;
      }
      values[row.name] = numericValue;
    }

    if (Object.keys(values).length === 0) {
      setFormError("Add at least one measurement point.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(garmentType, values);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="garmentType" className="text-sm font-medium">
          Garment type
        </label>
        <select
          id="garmentType"
          value={garmentType}
          disabled={Boolean(fixedGarmentType)}
          onChange={(e) => setGarmentType(e.target.value as GarmentType)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-60"
        >
          {GARMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <MeasurementValuesEditor key={garmentType} garmentType={garmentType} initialValues={initialValues} onChange={setRows} />

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
