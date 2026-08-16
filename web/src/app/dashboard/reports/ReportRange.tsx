"use client";

import { useState } from "react";

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

/**
 * Far enough back to predate any record the shop holds, so "All" needs no special case downstream.
 *
 * The reports take a required from-and-to; a sentinel keeps that contract intact rather than making
 * both ends nullable through the query, the handler and the export for the sake of one option.
 */
export const ALL_TIME_FROM = "1900-01-01";

/**
 * Ranges the shop actually thinks in — everything at the top, then day-to-day operations at the
 * short end and season-over-season comparison at the long end.
 *
 * Every one of them lives in the dropdown. They were a row of chips beside a permanently visible
 * From/To pair, which put three ways of saying the same thing on screen at once and let the chips
 * and the boxes disagree about the period being shown.
 */
export const RANGE_PRESETS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 Days", days: 7 },
  { key: "30d", label: "Last 30 Days", days: 30 },
  { key: "3m", label: "Last 3 Months", months: 3 },
  { key: "6m", label: "Last 6 Months", months: 6 },
  { key: "9m", label: "Last 9 Months", months: 9 },
  { key: "1y", label: "Last 1 Year", months: 12 },
] as const;

/**
 * The three the counter asks for by name, put within one tap of the screen opening.
 *
 * They are shortcuts into the dropdown beside them, not a second control: both write the same
 * selection, so whichever is used, the other shows it. The remaining windows stay in the dropdown
 * alone — a row of eight buttons is the chip row this replaced.
 */
const QUICK_PRESETS = ["today", "7d", "30d"] as const;

/** The windows that know their own dates — everything except Custom, which is told them. */
export type PresetOptionKey = (typeof RANGE_PRESETS)[number]["key"];
export type PresetKey = PresetOptionKey | "custom";

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
export function presetRange(key: PresetOptionKey): { from: string; to: string } {
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

/**
 * One figure, with a line saying what it counts.
 *
 * The explanation sits on the tile rather than in a paragraph at the top of the screen. A block of
 * prose above seven numbers has to name each of them before it can describe them, and nobody reads
 * it twice; a line under the number answers the question at the moment it gets asked.
 *
 * justify-between rather than a margin, so those lines sit on a common baseline across the row —
 * the grid already stretches every tile to the tallest, and without it a one-line description
 * floated up under its value while its neighbour's two-line one stayed put.
 */
export function StatTile({ label, value, description }: { label: string; value: string; description?: string }) {
  return (
    <div className="flex h-full flex-col justify-between gap-3 rounded-md border border-border bg-surface p-4">
      <div>
        <div className="text-sm text-foreground/70">{label}</div>
        {/* tabular-nums so the figures line up down the column instead of shifting with the digits. */}
        <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
      </div>
      {description && (
        <p className="border-t border-border pt-3 text-xs leading-snug text-foreground/60">{description}</p>
      )}
    </div>
  );
}

export type ReportRange = ReturnType<typeof useReportRange>;

/**
 * The date range a report screen is showing.
 *
 * Held here rather than in each screen so the three reports cannot drift into describing different
 * periods with the same words — they were one page with one control until they were split apart,
 * and this keeps that guarantee.
 *
 * A named window derives its dates rather than storing them; only Custom keeps a pair, because only
 * Custom has dates that cannot be worked out from the choice. That is what stops the old failure
 * where the chip said "Last 7 days" while the boxes beside it held something else entirely.
 */
export function useReportRange(initial: PresetKey = DEFAULT_PRESET) {
  const [preset, setPreset] = useState<PresetKey>(initial);
  const [customFrom, setCustomFrom] = useState(() => presetRange("today").from);
  const [customTo, setCustomTo] = useState(() => presetRange("today").to);

  const window = preset === "custom" ? { from: customFrom, to: customTo } : presetRange(preset);

  function applyPreset(key: PresetKey) {
    // Switching to Custom seeds the boxes with the window already on screen, so the report does not
    // jump to some unrelated period the moment the option is picked.
    if (key === "custom" && preset !== "custom") {
      setCustomFrom(window.from === ALL_TIME_FROM ? presetRange("30d").from : window.from);
      setCustomTo(window.to);
    }
    setPreset(key);
  }

  return {
    preset,
    fromDate: window.from,
    toDate: window.to,
    applyPreset,
    setCustomFrom,
    setCustomTo,
  };
}

/**
 * One dropdown. The two date boxes belong to Custom alone and appear with it — every other window
 * already knows its own dates, and showing them empty-handed beside a preset was the thing that
 * made the old control ambiguous.
 */
export function ReportRangeFilter({ range }: { range: ReportRange }) {
  const { preset, fromDate, toDate, applyPreset, setCustomFrom, setCustomTo } = range;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="reportRange" className="text-sm font-medium">
          Filter by date
        </label>
        <select
          id="reportRange"
          value={preset}
          onChange={(e) => applyPreset(e.target.value as PresetKey)}
          className={`max-w-xs ${fieldClassName}`}
        >
          {RANGE_PRESETS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
          <option value="custom">Custom range…</option>
        </select>
      </div>

      {/* Same padding and border as the select, so the row sits on one line rather than stepping. */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PRESETS.map((key) => {
          const option = RANGE_PRESETS.find((p) => p.key === key)!;
          const isActive = preset === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              /* aria-pressed, not colour alone — which of the three is on is otherwise carried by
                 nothing a screen reader reads out. */
              aria-pressed={isActive}
              className={
                isActive
                  ? "rounded-md border border-primary bg-primary px-3 py-2 text-sm font-medium text-white"
                  : "rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground/70 transition-colors hover:border-primary hover:text-foreground"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {preset === "custom" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="fromDate" className="text-sm font-medium">
              From
            </label>
            <input
              id="fromDate"
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setCustomFrom(e.target.value)}
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
              min={fromDate}
              onChange={(e) => setCustomTo(e.target.value)}
              className={fieldClassName}
            />
          </div>
        </>
      )}
    </div>
  );
}
