"use client";

import { useState } from "react";

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

/**
 * Far enough back to predate any record the shop holds, so "All" needs no special case downstream.
 *
 * The reports take a required from-and-to; a sentinel keeps that contract intact rather than making
 * both ends nullable through the query, the handler and the export for the sake of one chip.
 */
export const ALL_TIME_FROM = "1900-01-01";

/**
 * Ranges the shop actually thinks in — everything at the top, then day-to-day operations at the
 * short end and season-over-season comparison at the long end.
 */
export const RANGE_PRESETS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "3m", label: "Last 3 months", months: 3 },
  { key: "6m", label: "Last 6 months", months: 6 },
  { key: "9m", label: "Last 9 months", months: 9 },
  { key: "1y", label: "Last 1 year", months: 12 },
] as const;

type RangePreset = (typeof RANGE_PRESETS)[number];
export type PresetKey = RangePreset["key"] | "custom";

/**
 * Every report opens on the full history. A shop opening Revenue is asking what the business has
 * done, not what the last thirty days did, and a default window quietly leaves figures out of a
 * total nobody was told was windowed. Narrowing is one click away; noticing that a number was
 * already narrowed is not.
 */
export const DEFAULT_PRESET: PresetKey = "all";

/** yyyy-MM-dd read off the local calendar — "today" has to mean the shop's today, not UTC's. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Both ends inclusive: "Last 7 days" is today and the six before it, not today minus seven. */
export function presetRange(key: PresetKey): { from: string; to: string } {
  const to = new Date();

  // Handled before the arithmetic because it is the one preset with no length to subtract.
  if (key === "all") {
    return { from: ALL_TIME_FROM, to: toIsoDate(to) };
  }

  const preset = RANGE_PRESETS.find((p) => p.key === key);
  const from = new Date();

  if (preset && "days" in preset) {
    from.setDate(from.getDate() - (preset.days - 1));
  } else if (preset && "months" in preset) {
    // Month arithmetic rolls short months forward (31 Aug − 6 months lands on 2 or 3 Mar);
    // close enough for a report range, and never silently drops days off the end.
    from.setMonth(from.getMonth() - preset.months);
  }

  return { from: toIsoDate(from), to: toIsoDate(to) };
}

/**
 * The picked days as an inclusive UTC instant range. The end of the range has to be the *end* of
 * the To date — sending its midnight excluded everything that happened on the last day, so today's
 * figures never appeared at all.
 */
export function toUtcRange(fromDate: string, toDate: string): { fromUtc: string; toUtc: string } {
  return {
    fromUtc: new Date(`${fromDate}T00:00:00.000Z`).toISOString(),
    toUtc: new Date(`${toDate}T23:59:59.999Z`).toISOString(),
  };
}

export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-4">
      <div className="text-sm text-foreground/70">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

export type ReportRange = ReturnType<typeof useReportRange>;

/**
 * The date range a report screen is showing.
 *
 * Held here rather than in each screen so the six reports cannot drift into describing different
 * periods with the same words — they were one page with one control until they were split apart,
 * and this keeps that guarantee.
 */
export function useReportRange(initial: PresetKey = DEFAULT_PRESET) {
  const [preset, setPreset] = useState<PresetKey>(initial);
  const [fromDate, setFromDate] = useState(() => presetRange(initial).from);
  const [toDate, setToDate] = useState(() => presetRange(initial).to);

  function applyPreset(key: PresetKey) {
    const { from, to } = presetRange(key);
    setPreset(key);
    setFromDate(from);
    setToDate(to);
  }

  return { preset, fromDate, toDate, applyPreset, setPreset, setFromDate, setToDate };
}

/** The preset chips and the two date boxes. Editing either date is itself the way into Custom. */
export function ReportRangeFilter({ range }: { range: ReportRange }) {
  const { preset, fromDate, toDate, applyPreset, setPreset, setFromDate, setToDate } = range;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {RANGE_PRESETS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => applyPreset(option.key)}
            aria-pressed={preset === option.key}
            className={
              preset === option.key
                ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-border px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:border-primary hover:text-foreground"
            }
          >
            {option.label}
          </button>
        ))}
        <span
          aria-hidden="true"
          className={
            preset === "custom"
              ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-white"
              : "rounded-full border border-border px-3 py-1.5 text-sm text-foreground/50"
          }
        >
          Custom
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="fromDate" className="text-sm font-medium">
            From
          </label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setPreset("custom");
              setFromDate(e.target.value);
            }}
            className={fieldClassName}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="toDate" className="text-sm font-medium">
            To
          </label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => {
              setPreset("custom");
              setToDate(e.target.value);
            }}
            className={fieldClassName}
          />
        </div>
      </div>
    </div>
  );
}
