"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { invalidateMeasurementTemplates } from "@/lib/use-measurement-templates";
import {
  listMeasurementTemplates,
  setMeasurementTemplate,
  resetMeasurementTemplate,
  GARMENT_TYPES,
  type GarmentType,
  type MeasurementTemplate,
} from "@/lib/api/measurements";

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

/**
 * Which measurement points a garment type asks for, and in what order — "Pant: 1. length,
 * 2. waist" is a shop preference, not a fact about tailoring, so it is configured rather than
 * hardcoded. The order set here is the order the points appear in on the New Order screen and on
 * the customer measurement form.
 */
export function MeasurementTemplatesSection() {
  const { showToast } = useToast();
  const [garmentType, setGarmentType] = useState<GarmentType>(GARMENT_TYPES[0]);
  const [templates, setTemplates] = useState<Record<string, MeasurementTemplate>>({});
  const [points, setPoints] = useState<string[]>([]);
  const [newPoint, setNewPoint] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await listMeasurementTemplates(getAccessToken());
      setTemplates(Object.fromEntries(loaded.map((t) => [t.garmentType, t])));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load measurement templates.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-dependency-change pattern is intentionally not
    // restructured around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    // Switching garment type discards any unsaved edits to the previous one — the alternative is
    // silently carrying half-finished lists between garments, which is worse.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPoints(templates[garmentType]?.points ?? []);
    setNewPoint("");
  }, [garmentType, templates]);

  const current = templates[garmentType];
  const isDirty = current !== undefined && JSON.stringify(points) !== JSON.stringify(current.points);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= points.length) {
      return;
    }
    const next = [...points];
    [next[index], next[target]] = [next[target], next[index]];
    setPoints(next);
  }

  function remove(index: number) {
    setPoints(points.filter((_, i) => i !== index));
  }

  function rename(index: number, value: string) {
    setPoints(points.map((p, i) => (i === index ? value : p)));
  }

  function add() {
    const name = newPoint.trim();
    if (!name) {
      return;
    }
    if (points.some((p) => p.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" is already in this template.`);
      return;
    }
    setError(null);
    setPoints([...points, name]);
    setNewPoint("");
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      const saved = await setMeasurementTemplate(garmentType, points, getAccessToken());
      setTemplates((prev) => ({ ...prev, [garmentType]: saved }));
      // Screens already open (New Order, customer measurements) pick the new order up without a reload.
      invalidateMeasurementTemplates();
      showToast(`${garmentType} measurement points saved.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save this template.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    setError(null);
    setIsSaving(true);
    try {
      await resetMeasurementTemplate(garmentType, getAccessToken());
      await load();
      invalidateMeasurementTemplates();
      showToast(`${garmentType} restored to the standard points.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reset this template.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      <div>
        <h2 className="text-lg font-semibold">Measurement Templates</h2>
        <p className="text-sm text-foreground/70">
          The measurement points staff are asked for on each garment, in the order they are asked. Drag-free reordering
          with the arrows; the order here is the order on the New Order screen.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="templateGarmentType" className="text-sm font-medium">
          Garment type
        </label>
        <select
          id="templateGarmentType"
          value={garmentType}
          onChange={(e) => setGarmentType(e.target.value as GarmentType)}
          className={fieldClassName}
          disabled={isLoading}
        >
          {GARMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
              {templates[type]?.isCustomised ? " (customised)" : ""}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : (
        <>
          <ol className="flex flex-col gap-2">
            {points.map((point, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-sm text-foreground/60">{index + 1}.</span>
                <input
                  aria-label={`Measurement point ${index + 1}`}
                  value={point}
                  onChange={(e) => rename(index, e.target.value)}
                  className={`flex-1 ${fieldClassName}`}
                />
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${point} up`}
                  className="rounded-md border border-border px-2 py-1 text-sm text-foreground/70 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === points.length - 1}
                  aria-label={`Move ${point} down`}
                  className="rounded-md border border-border px-2 py-1 text-sm text-foreground/70 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${point}`}
                  className="rounded-md border border-border px-2 py-1 text-sm text-danger transition-colors hover:text-danger-hover"
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>

          {points.length === 0 && (
            <p className="text-sm text-foreground/70">No points yet — add the first one below.</p>
          )}

          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="newPoint" className="text-sm font-medium">
                Add a measurement point
              </label>
              <input
                id="newPoint"
                value={newPoint}
                placeholder="e.g. Bottom opening"
                onChange={(e) => setNewPoint(e.target.value)}
                onKeyDown={(e) => {
                  // Enter inside the Settings page's other forms submits them; this input is not
                  // in a form, so it adds the point instead of doing nothing.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                }}
                className={fieldClassName}
              />
            </div>
            <Button type="button" variant="secondary" onClick={add} disabled={newPoint.trim() === ""}>
              Add
            </Button>
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving || !current?.isCustomised}
              className="text-sm text-foreground/70 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Restore standard points
            </button>
            <Button type="button" onClick={handleSave} disabled={isSaving || points.length === 0 || !isDirty}>
              {isSaving ? "Saving…" : "Save template"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
