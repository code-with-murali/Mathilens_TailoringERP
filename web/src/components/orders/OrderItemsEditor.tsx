"use client";

import { useEffect, useRef, useState } from "react";
import { GARMENT_TYPES, type GarmentType } from "@/lib/api/measurements";
import { FABRIC_SOURCES, type FabricSource } from "@/lib/api/orders";
import { searchClothPrices, type ClothPrice } from "@/lib/api/clothPrices";
import { getAccessToken } from "@/lib/auth";
import { useDebouncedValue } from "@/lib/use-debounced-value";

export type ItemRow = {
  id: number;
  garmentType: GarmentType;
  quantity: string;
  /** Staff's own reference for which fabric roll/style this item uses — not sent to the API, no order-item field for it exists on the backend today. Suggestions come from the Price Detail catalog, but any text can still be typed. */
  clothCode: string;
  unitPrice: string;
  includeFabric: boolean;
  fabricType: string;
  fabricSource: FabricSource;
  fabricColor: string;
  fabricQuantity: string;
};

let nextItemRowId = 0;

function emptyRow(garmentType: GarmentType = GARMENT_TYPES[0]): ItemRow {
  return {
    id: nextItemRowId++,
    garmentType,
    quantity: "1",
    clothCode: "",
    unitPrice: "",
    includeFabric: false,
    fabricType: "",
    fabricSource: FABRIC_SOURCES[0],
    fabricColor: "",
    fabricQuantity: "",
  };
}

const fieldClassName =
  "w-full rounded-md border border-border bg-surface px-3 py-1 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

// Live preview only — tolerant of blank/partial input so Total price updates as the shop owner
// types, same reasoning as the order-level total on the New Order page.
function rowTotal(row: ItemRow): number {
  const quantity = Number(row.quantity);
  const unitPrice = Number(row.unitPrice);
  return (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0);
}

type ClothCodeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectMatch: (match: ClothPrice) => void;
  disabled?: boolean;
};

/** Dropdown cloth code picker with search — sourced from the Price Detail catalog. Opening it
 * (focus/click) lists the catalog even with an empty query; typing filters it live. Picking an
 * entry fills in its code and its Selling price (never Cost price, which is for the shop's own
 * margin tracking, not a customer-facing order). Free text is still allowed for codes not yet in
 * the catalog. */
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
  activeItemId?: number | null;
  onItemClick?: (row: ItemRow) => void;
  /** Freezes every field and the Add item/Remove buttons — used once an order has been created from this form. */
  disabled?: boolean;
};

/** Dynamic garment-line editor for the create-order form — each item optionally carries its own fabric details. */
export function OrderItemsEditor({ onChange, activeItemId, onItemClick, disabled = false }: OrderItemsEditorProps) {
  const [rows, setRows] = useState<ItemRow[]>(() => [emptyRow("Shirt"), emptyRow("Trousers"), emptyRow()]);

  useEffect(() => {
    // The default rows only live in this component's own state until the parent is told about
    // them — without this, clicking an item before editing any field finds nothing in the
    // parent's copy, since onChange is otherwise only called from update() below. Deliberately
    // mount-only: update() below owns every subsequent change, so onChange/rows aren't deps here.
    onChange(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(next: ItemRow[]) {
    setRows(next);
    onChange(next);
  }

  function updateRow(id: number, patch: Partial<ItemRow>) {
    update(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    update([...rows, emptyRow()]);
  }

  function removeRow(id: number) {
    update(rows.filter((row) => row.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Garment items</span>
      {rows.map((row, index) => (
        <div
          key={row.id}
          onClick={() => onItemClick?.(row)}
          className={`flex flex-col gap-2 rounded-md border p-2 ${
            onItemClick ? "cursor-pointer hover:border-foreground/40" : ""
          } ${activeItemId === row.id ? "border-foreground ring-1 ring-foreground" : "border-border"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Item {index + 1}</span>
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

          {/* No stopPropagation here — a click anywhere in the fields (including a blank input)
              should still bubble up and open the measurement panel for this item, same as
              clicking the card itself. Only Remove needs to opt out, since removing shouldn't
              also select the (about to disappear) row. */}
          <div className="grid max-w-2xl grid-cols-5 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm">Garment</label>
              <select
                value={row.garmentType}
                disabled={disabled}
                onChange={(e) => updateRow(row.id, { garmentType: e.target.value as GarmentType })}
                className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {GARMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
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
            <ClothCodeField
              value={row.clothCode}
              onChange={(clothCode) => updateRow(row.id, { clothCode })}
              onSelectMatch={(match) => updateRow(row.id, { clothCode: match.clothCode, unitPrice: String(match.sellingPrice) })}
              disabled={disabled}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm">Unit price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.unitPrice}
                disabled={disabled}
                onChange={(e) => updateRow(row.id, { unitPrice: e.target.value })}
                className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm">Total price</label>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={rowTotal(row).toFixed(2)}
                className={`${fieldClassName} cursor-default bg-surface`}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" checked={row.includeFabric} disabled={disabled} onChange={(e) => updateRow(row.id, { includeFabric: e.target.checked })} />
            Add fabric details
          </label>

          {row.includeFabric && (
            <div className="grid grid-cols-2 gap-2 rounded-md bg-surface p-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-1">
                <label className="text-sm">Fabric type</label>
                <input
                  value={row.fabricType}
                  disabled={disabled}
                  onChange={(e) => updateRow(row.id, { fabricType: e.target.value })}
                  className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm">Source</label>
                <select
                  value={row.fabricSource}
                  disabled={disabled}
                  onChange={(e) => updateRow(row.id, { fabricSource: e.target.value as FabricSource })}
                  className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {FABRIC_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source === "CustomerSupplied" ? "Customer supplied" : "Shop supplied"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm">Color</label>
                <input
                  value={row.fabricColor}
                  disabled={disabled}
                  onChange={(e) => updateRow(row.id, { fabricColor: e.target.value })}
                  className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm">Quantity (m)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={row.fabricQuantity}
                  disabled={disabled}
                  onChange={(e) => updateRow(row.id, { fabricQuantity: e.target.value })}
                  className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                />
              </div>
            </div>
          )}
        </div>
      ))}
      {!disabled && (
        <button type="button" onClick={addRow} className="self-start text-sm text-foreground/70 hover:text-foreground">
          + Add item
        </button>
      )}
    </div>
  );
}
