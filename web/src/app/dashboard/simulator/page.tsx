"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SearchPicker } from "@/components/ui/SearchPicker";
import { GarmentDrawing } from "@/components/simulator/GarmentDrawing";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { searchCustomers, type Customer } from "@/lib/api/customers";
import { listMeasurementsForCustomer } from "@/lib/api/measurements";
import { PERMISSIONS } from "@/lib/api/users";
import { usePermissions } from "@/lib/use-permissions";
import {
  FIGURES,
  GARMENTS,
  SWATCHES,
  dimsFromMeasurement,
  figureById,
  garmentById,
  type Dims,
} from "@/lib/simulator/model";

/**
 * The simulator: what a garment will look like at this customer's measurements, in this cloth.
 *
 * <p>Built so a tailor can turn the screen round and show it. That is why the drawing is the
 * biggest thing on the page and the numbers sit beside it rather than above it, and why moving any
 * figure redraws immediately — the conversation this is for is "a little longer?", and the answer
 * has to be visible while the customer is still asking.</p>
 *
 * <p>The drawings are flat technical illustrations, not photographs, and that is the point: every
 * line is computed from the measurements, so nothing here can show a fit the numbers do not
 * support. A picture that looked real but ignored the tape would be worse than no picture.</p>
 */
export default function SimulatorPage() {
  const { can, isLoaded } = usePermissions();

  const [garmentId, setGarmentId] = useState(GARMENTS[0].id);
  const [color, setColor] = useState(SWATCHES[3].hex);
  const [viewIndex, setViewIndex] = useState(0);
  const [figureId, setFigureId] = useState(FIGURES[1].id);
  // Off shows the garment laid flat, which is how a tailor reads a cut; on shows it worn, which is
  // how a customer does. Both are the same measurements, so neither is more true than the other.
  const [showFigure, setShowFigure] = useState(true);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadNote, setLoadNote] = useState<string | null>(null);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(false);

  const garment = useMemo(() => garmentById(garmentId), [garmentId]);

  // Held per garment, so switching from Shirt to Trousers and back does not throw away what was
  // just adjusted — a tailor comparing two garments for the same customer switches constantly.
  const [dimsByGarment, setDimsByGarment] = useState<Record<string, Dims>>(() =>
    Object.fromEntries(GARMENTS.map((g) => [g.id, { ...g.defaults }])),
  );

  const dims = dimsByGarment[garment.id] ?? garment.defaults;
  const view = garment.views[Math.min(viewIndex, garment.views.length - 1)];
  const figure = useMemo(() => figureById(figureId), [figureId]);

  // Only the full views are worn. A close-up of a cuff is a picture of cloth, and putting a man
  // behind it would shrink the thing the view exists to show.
  const isWornView = view.id === "front" || view.id === "back" || view.id === "trousers";
  const wornBy = showFigure && isWornView ? figure : undefined;

  const setDim = useCallback(
    (key: keyof Dims, value: number) => {
      setDimsByGarment((current) => ({ ...current, [garment.id]: { ...current[garment.id], [key]: value } }));
    },
    [garment.id],
  );

  /**
   * Pulls a customer's saved measurements in for whichever garment is on screen.
   *
   * Runs again when the garment changes, because a customer measured for a shirt and a trouser has
   * two separate sets and the screen should follow whichever is being looked at. Anything the saved
   * set does not carry keeps the standard figure rather than collapsing — see dimsFromMeasurement.
   */
  useEffect(() => {
    if (!customer) {
      return;
    }

    // Guards a race rather than a lint rule: switching customer twice quickly leaves two requests
    // in flight, and without this the slower one wins and draws the wrong person's garment.
    let cancelled = false;

    const run = async () => {
      setIsLoadingMeasurements(true);
      setLoadNote(null);
      try {
        const measurements = await listMeasurementsForCustomer(customer.id, getAccessToken());
        if (cancelled) {
          return;
        }

        const match = measurements.find((m) =>
          garment.aliases.some((alias) => alias.toLowerCase() === m.garmentType.trim().toLowerCase()),
        );

        if (!match) {
          setLoadNote(
            `${customer.fullName} has no ${garment.label.toLowerCase()} measurements saved. Showing standard sizing.`,
          );
          setDimsByGarment((current) => ({ ...current, [garment.id]: { ...garment.defaults } }));
          return;
        }

        setDimsByGarment((current) => ({ ...current, [garment.id]: dimsFromMeasurement(garment, match.values) }));
      } catch (error) {
        if (!cancelled) {
          setLoadNote(error instanceof ApiError ? error.message : "Could not load measurements.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMeasurements(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [customer, garment]);

  if (!isLoaded) {
    return <p className="text-sm text-foreground/70">Loading…</p>;
  }

  if (!can(PERMISSIONS.measurementsView)) {
    return <p className="text-sm text-foreground/70">You do not have access to the simulator.</p>;
  }

  const step = (delta: number) => {
    setViewIndex((current) => (current + delta + garment.views.length) % garment.views.length);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Simulator</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Show a customer what their garment will look like, drawn to their own measurements.
        </p>
      </div>

      {/* Garment first: it decides which views exist and which figures matter, so everything below
          it changes when this changes. */}
      <div className="flex flex-wrap gap-2">
        {GARMENTS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setGarmentId(option.id);
              setViewIndex(0);
            }}
            aria-pressed={option.id === garment.id}
            className={`min-h-11 rounded-md border px-4 text-sm transition-colors ${
              option.id === garment.id
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-foreground/70 hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ---- The picture ------------------------------------------------------------------ */}
        <div className="flex flex-col gap-3">
          <div className="relative rounded-lg border border-border bg-surface">
            <div className="flex h-[26rem] items-center justify-center p-4 sm:h-[32rem]">
              <GarmentDrawing garment={garment} view={view.id} dims={dims} color={color} figure={wornBy} />
            </div>

            {/* Worn or flat. Only offered on the views that can be worn, so the control never
                appears next to a cuff it would do nothing to. */}
            {isWornView && (
              <div className="absolute right-3 top-3 flex overflow-hidden rounded-md border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setShowFigure(true)}
                  aria-pressed={showFigure}
                  className={`px-2.5 py-1 ${showFigure ? "bg-primary/10 font-medium text-primary" : "bg-background/85 text-foreground/70"}`}
                >
                  Worn
                </button>
                <button
                  type="button"
                  onClick={() => setShowFigure(false)}
                  aria-pressed={!showFigure}
                  className={`px-2.5 py-1 ${!showFigure ? "bg-primary/10 font-medium text-primary" : "bg-background/85 text-foreground/70"}`}
                >
                  Flat
                </button>
              </div>
            )}

            {/* Arrows sit over the drawing rather than under it, so a phone held up to a customer
                still has both within a thumb's reach. */}
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous view"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-lg text-foreground/70 hover:text-foreground"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next view"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-lg text-foreground/70 hover:text-foreground"
            >
              ›
            </button>

            <p className="absolute left-1/2 top-3 -translate-x-1/2 text-sm font-medium">{view.label}</p>

          </div>

          {/* The five views as thumbnails, each drawn at the same measurements — a customer picks
              the one they want to look at rather than being walked through all five. */}
          <div className="grid grid-cols-5 gap-2">
            {garment.views.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setViewIndex(index)}
                aria-pressed={index === viewIndex}
                aria-label={option.label}
                className={`flex flex-col items-center gap-1 rounded-md border p-1.5 transition-colors ${
                  index === viewIndex ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                }`}
              >
                <span className="flex h-16 w-full items-center justify-center">
                  <GarmentDrawing
                    garment={garment}
                    view={option.id}
                    dims={dims}
                    color={color}
                    figure={
                      showFigure && (option.id === "front" || option.id === "back" || option.id === "trousers")
                        ? figure
                        : undefined
                    }
                  />
                </span>
                <span className="truncate text-[0.7rem] text-foreground/70">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ---- The numbers ------------------------------------------------------------------ */}
        <div className="flex flex-col gap-5">
          <div>
            <SearchPicker<Customer>
              id="simulatorCustomer"
              label="Customer (optional)"
              selectedLabel={customer ? `${customer.fullName} — ${customer.phoneNumber}` : null}
              onSelect={setCustomer}
              onClear={() => {
                setCustomer(null);
                setLoadNote(null);
              }}
              search={searchCustomers}
              getId={(c) => c.id}
              getLabel={(c) => `${c.fullName} — ${c.phoneNumber}`}
              placeholder="Search by name or number"
            />
            <p className="mt-1.5 text-xs text-foreground/60">
              {isLoadingMeasurements
                ? "Loading their measurements…"
                : loadNote ?? "Leave empty to show standard sizing, or pick someone to use their saved measurements."}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Show it on</p>
            <p className="mt-0.5 text-xs text-foreground/60">
              Pick whoever stands closest to the customer. He sets the height and build of the drawing only — the
              garment is always cut to the measurements below.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FIGURES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setFigureId(option.id);
                    setShowFigure(true);
                  }}
                  aria-pressed={option.id === figureId && showFigure}
                  title={`${option.label} — ${option.heightCm} cm, ${option.weight}`}
                  className={`min-h-9 rounded-md border px-2 py-1 text-xs transition-colors ${
                    option.id === figureId && showFigure
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border text-foreground/70 hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                    style={{ backgroundColor: option.skin }}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Cloth colour</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => setColor(swatch.hex)}
                  title={swatch.name}
                  aria-label={swatch.name}
                  aria-pressed={swatch.hex === color}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    swatch.hex === color ? "scale-110 border-primary" : "border-border"
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                />
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-foreground/70">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
              />
              Match the cloth exactly
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Measurements (cm)</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDimsByGarment((current) => ({ ...current, [garment.id]: { ...garment.defaults } }))}
              >
                RESET
              </Button>
            </div>

            {/* A slider and a figure together: the slider is for trying "a little longer" in front
                of a customer, the box is for typing what the tape actually said. */}
            <div className="mt-3 flex flex-col gap-3">
              {garment.fields.map((field) => (
                <div key={field.key}>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`dim-${field.key}`} className="text-xs text-foreground/70">
                      {field.label}
                    </label>
                    <input
                      id={`dim-${field.key}`}
                      type="number"
                      inputMode="decimal"
                      min={field.min}
                      max={field.max}
                      value={dims[field.key]}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        if (Number.isFinite(next)) {
                          setDim(field.key, Math.min(field.max, Math.max(field.min, next)));
                        }
                      }}
                      className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                  <input
                    type="range"
                    aria-label={field.label}
                    min={field.min}
                    max={field.max}
                    step={0.5}
                    value={dims[field.key]}
                    onChange={(e) => setDim(field.key, Number(e.target.value))}
                    className="mt-1 w-full accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-foreground/60">
            A drawing to scale, not a photograph. It shows the shape these measurements produce — the cloth&rsquo;s fall
            and finish are still the tailor&rsquo;s judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
