"use client";

import { useEffect, useRef, useState } from "react";
import { GARMENT_TYPES, type GarmentType } from "@/lib/api/measurements";
import { searchClothPrices, type ClothPrice } from "@/lib/api/clothPrices";
import { getAccessToken } from "@/lib/auth";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { TailoringRates } from "@/lib/api/tailoring-rates";
import type { Garment } from "@/lib/api/garments";

/**
 * What the shop is selling on this order.
 *
 * "tailoring" is a shop that only stitches — the customer brings the cloth and pays for the work.
 * "tailoringFabric" is a shop that also sells cloth, so each garment says whose fabric it is made
 * from and, when it is the shop's own, what that cloth costs.
 */
export type BusinessMode = "tailoring" | "tailoringFabric";

/** Whose cloth the garment is cut from — the shop's own roll, or one the customer walked in with. */
export type FabricSourceMode = "internal" | "external";

export type ItemRow = {
  id: number;
  garmentType: GarmentType;
  quantity: string;
  /** What the shop charges to stitch one of these. */
  tailoringRate: string;
  fabricSource: FabricSourceMode;
  /** From the Price Detail catalog; free text is still allowed for cloth not yet in it. */
  clothCode: string;
  /** Carried so the order can name the cloth, not just its code. */
  clothName: string;
  metres: string;
  /** The catalog's selling price per metre, filled in when a cloth code is picked. */
  ratePerMetre: string;
};

let nextItemRowId = 0;

function emptyRow(garmentType: GarmentType = GARMENT_TYPES[0]): ItemRow {
  return {
    id: nextItemRowId++,
    garmentType,
    quantity: "1",
    tailoringRate: "",
    // Most orders at a tailoring-and-fabric shop are cut from the shop's own roll — that is the
    // business it is in. A customer walking in with cloth is the exception, so it is the one that
    // has to be chosen.
    fabricSource: "internal",
    clothCode: "",
    clothName: "",
    metres: "",
    ratePerMetre: "",
  };
}

const fieldClassName =
  "w-full rounded-md border border-border bg-surface px-3 py-1 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

const readOnlyFieldClassName = `${fieldClassName} cursor-default bg-surface`;

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * What the shop's own cloth on this row comes to.
 *
 * Zero for a customer's own fabric, and zero in a tailoring-only order — a shop that does not sell
 * cloth has no cloth to charge for.
 */
export function clothAmount(row: ItemRow, mode: BusinessMode): number {
  if (mode !== "tailoringFabric" || row.fabricSource !== "internal") {
    return 0;
  }
  return toNumber(row.metres) * toNumber(row.ratePerMetre);
}

/**
 * Cloth plus stitching.
 *
 * Live preview only — tolerant of blank and partial input so the total moves as the owner types,
 * unlike the New Order page's strict per-item validation, which runs at submit time.
 */
export function rowTotal(row: ItemRow, mode: BusinessMode): number {
  return clothAmount(row, mode) + toNumber(row.quantity) * toNumber(row.tailoringRate);
}

type ClothCodeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectMatch: (match: ClothPrice) => void;
  disabled?: boolean;
};

/** Cloth code picker with search — sourced from the Price Detail catalog. Opening it (focus/click)
 * lists the catalog even with an empty query; typing filters it live. Picking an entry fills in its
 * code and its Selling price per metre (never Cost price, which is for the shop's own margin
 * tracking, not a customer-facing order). Free text is still allowed for cloth not yet in the
 * catalog — but then nobody has said what a metre of it costs, so the rate stays for the operator
 * to fill in. */
function ClothCodeField({ value, onChange, onSelectMatch, disabled = false }: ClothCodeFieldProps) {
  const debouncedValue = useDebouncedValue(value, 300);
  const [matches, setMatches] = useState<ClothPrice[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    searchClothPrices(debouncedValue, 1, 8, getAccessToken())
      .then(({ items }) => {
        if (!cancelled) {
          setMatches(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMatches([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Same outside-click-closes pattern used by the Mobile Number dropdown on the New Order page.
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (fieldRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  function selectMatch(match: ClothPrice) {
    onSelectMatch(match);
    setIsOpen(false);
  }

  return (
    <div ref={fieldRef} className="relative flex flex-col gap-1">
      <label className="text-sm">Cloth code</label>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
      />
      {!disabled && isOpen && matches.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 max-h-40 w-full min-w-[10rem] overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
          {matches.map((match) => (
            <li key={match.id}>
              <button
                type="button"
                onClick={() => selectMatch(match)}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-surface-hover"
              >
                {match.clothCode} — {match.clothName} <span className="text-foreground/60">({match.sellingPrice.toFixed(2)})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type OrderItemsEditorProps = {
  onChange: (rows: ItemRow[]) => void;
  mode: BusinessMode;
  /** The shop's price list (Settings › Tailoring Cost). Fills a row's Tailoring amount in. */
  tailoringRates: TailoringRates;
  /**
   * The garments this order may be for: on the shop's list (Settings › Garments) and priced.
   *
   * Empty until both have loaded, so the dropdown is never briefly offering garments that are about
   * to disappear from it.
   */
  garments: Garment[];
  activeItemId?: number | null;
  onItemClick?: (row: ItemRow) => void;
  /** Freezes every field and the Add item/Remove buttons — used once an order has been created from this form. */
  disabled?: boolean;
};

/** Dynamic garment-line editor for the create-order form. In a tailoring-and-fabric order each
 * line also says whose cloth the garment is cut from, and prices the shop's own. */
export function OrderItemsEditor({ onChange, mode, tailoringRates, garments, activeItemId, onItemClick, disabled = false }: OrderItemsEditorProps) {
  // Two rows to start — a shirt and a trousers is the order a counter takes most often, and a
  // third empty row was one more thing to look past. "+ Add item" covers the rest.
  const [rows, setRows] = useState<ItemRow[]>(() => [emptyRow("Shirt"), emptyRow("Trousers")]);

  useEffect(() => {
    // The default rows only live in this component's own state until the parent is told about
    // them — without this, clicking an item before editing any field finds nothing in the
    // parent's copy, since onChange is otherwise only called from update() below. Deliberately
    // mount-only: update() below owns every subsequent change, so onChange/rows aren't deps here.
    onChange(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // The price list and the garment list both arrive a moment after the form does, so the rows
    // already on screen are settled when they land: any row standing on a garment the shop does
    // not offer moves to one it does, and a blank amount is filled from the price list. A typed
    // amount is left alone — it is the operator's decision and outranks the list.
    if (garments.length === 0) {
      return;
    }
    const fallback = garments[0].name;
    const settled = rows.map((row) => {
      const garmentType = garments.some((g) => g.name === row.garmentType) ? row.garmentType : fallback;
      const movedGarment = garmentType !== row.garmentType;
      if (!movedGarment && row.tailoringRate.trim() !== "") {
        return row;
      }
      // A row pushed onto a different garment takes that garment's price, not the old one's.
      return { ...row, garmentType, tailoringRate: movedGarment ? rateFor(garmentType) : rateFor(row.garmentType) };
    });
    if (settled.some((row, index) => row !== rows[index])) {
      update(settled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tailoringRates, garments]);

  function update(next: ItemRow[]) {
    setRows(next);
    onChange(next);
  }

  function updateRow(id: number, patch: Partial<ItemRow>) {
    update(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  /** The shop's price for a garment, as the field holds it — blank when nobody has set one. */
  function rateFor(garmentType: GarmentType): string {
    const rate = tailoringRates[garmentType];
    return rate === undefined ? "" : String(rate);
  }

  function addRow() {
    const row = emptyRow(garments[0]?.name);
    update([...rows, { ...row, tailoringRate: rateFor(row.garmentType) }]);
  }

  function removeRow(id: number) {
    update(rows.filter((row) => row.id !== id));
  }

  const sellsFabric = mode === "tailoringFabric";

  // Nothing can be ordered until a garment is both listed and priced, so say which of the two is
  // missing rather than showing rows whose Garment dropdown is empty.
  if (garments.length === 0) {
    return (
      <div className="flex h-full flex-col gap-3">
        <span className="order-heading shrink-0 text-sm font-medium">Garment items</span>
        <p className="rounded-md border border-border p-3 text-sm text-foreground/70">
          No garment has a stitching price yet. Add one under Settings &rsaquo; Garments and price it under Settings
          &rsaquo; Tailoring Cost, and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <span className="order-heading shrink-0 text-sm font-medium">Garment items</span>
      {rows.map((row, index) => (
        <div
          key={row.id}
          onClick={() => onItemClick?.(row)}
          className={`flex shrink-0 flex-col gap-2 rounded-md border p-3 ${
            onItemClick ? "cursor-pointer hover:border-foreground/40" : ""
          } ${activeItemId === row.id ? "border-foreground ring-1 ring-foreground" : "border-border"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Item {index + 1}</span>
            <div className="flex items-center gap-3">
              {/* Whose cloth, right in the item's header — it decides whether the row carries a
                  cloth charge at all, so it belongs above the fields it governs, not among them. */}
              {sellsFabric && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {(
                    [
                      { value: "internal", label: "Shop fabric" },
                      { value: "external", label: "Customer fabric" },
                    ] as const
                  ).map((choice) => (
                    <button
                      key={choice.value}
                      type="button"
                      disabled={disabled}
                      aria-pressed={row.fabricSource === choice.value}
                      onClick={() => updateRow(row.id, { fabricSource: choice.value })}
                      className={`rounded-full border px-3 py-0.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        row.fabricSource === choice.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground/70 hover:bg-surface-hover"
                      }`}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              )}
              {rows.length > 1 && !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRow(row.id);
                  }}
                  className="text-sm text-danger hover:text-danger-hover"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* No stopPropagation here — a click anywhere in the fields (including a blank input)
              should still bubble up and open the measurement panel for this item, same as
              clicking the card itself. Only Remove and the fabric choice opt out. */}
          <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm">Garment</label>
              <select
                value={row.garmentType}
                disabled={disabled}
                // Changing the garment re-prices the row from the shop's list — that is what the
                // list is for. A garment with no set price clears the amount rather than leaving
                // the previous garment's, which would be quietly wrong.
                onChange={(e) => {
                  const garmentType = e.target.value as GarmentType;
                  updateRow(row.id, { garmentType, tailoringRate: rateFor(garmentType) });
                }}
                className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {/* Only garments the shop lists and has priced. A garment with no price would put
                    a zero on the bill, so it is not offered at all rather than offered and blank. */}
                {garments.map(({ name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm">Quantity</label>
              <input
                type="number"
                min="1"
                value={row.quantity}
                disabled={disabled}
                onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
              />
            </div>
            <div className="flex flex-col gap-1">
              {/* Named for what it is. "Unit price" said nothing about which of the two amounts on
                  a fabric order it was. */}
              <label className="text-sm">Tailoring</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.tailoringRate}
                disabled={disabled}
                onChange={(e) => updateRow(row.id, { tailoringRate: e.target.value })}
                className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm">Total</label>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={rowTotal(row, mode).toFixed(2)}
                className={readOnlyFieldClassName}
              />
            </div>
          </div>

          {/* Only the shop's own cloth is priced. A customer's fabric needs no code, no metres and
              no rate — the shop is being paid to stitch it, nothing more. */}
          {sellsFabric && row.fabricSource === "internal" && (
            <div className="grid max-w-2xl grid-cols-2 gap-3 rounded-md bg-surface p-2 sm:grid-cols-4">
              <ClothCodeField
                value={row.clothCode}
                onChange={(clothCode) => updateRow(row.id, { clothCode })}
                onSelectMatch={(match) =>
                  updateRow(row.id, {
                    clothCode: match.clothCode,
                    clothName: match.clothName,
                    ratePerMetre: String(match.sellingPrice),
                  })
                }
                disabled={disabled}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm">Metres</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={row.metres}
                  disabled={disabled}
                  onChange={(e) => updateRow(row.id, { metres: e.target.value })}
                  className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm">Rate / m</label>
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={row.ratePerMetre === "" ? "" : toNumber(row.ratePerMetre).toFixed(2)}
                  placeholder="Pick a cloth code"
                  className={readOnlyFieldClassName}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm">Cloth</label>
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={clothAmount(row, mode).toFixed(2)}
                  className={readOnlyFieldClassName}
                />
              </div>
            </div>
          )}
        </div>
      ))}
      {!disabled && (
        <button type="button" onClick={addRow} className="order-add-item self-start text-sm font-medium text-foreground/70 hover:text-foreground">
          + Add item
        </button>
      )}
    </div>
  );
}
