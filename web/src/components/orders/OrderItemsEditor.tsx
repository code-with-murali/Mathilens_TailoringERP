"use client";

import { useState } from "react";
import { GARMENT_TYPES, type GarmentType } from "@/lib/api/measurements";
import { FABRIC_SOURCES, type FabricSource } from "@/lib/api/orders";

export type ItemRow = {
  id: number;
  garmentType: GarmentType;
  quantity: string;
  unitPrice: string;
  includeFabric: boolean;
  fabricType: string;
  fabricSource: FabricSource;
  fabricColor: string;
  fabricQuantity: string;
};

let nextItemRowId = 0;

function emptyRow(): ItemRow {
  return {
    id: nextItemRowId++,
    garmentType: GARMENT_TYPES[0],
    quantity: "1",
    unitPrice: "",
    includeFabric: false,
    fabricType: "",
    fabricSource: FABRIC_SOURCES[0],
    fabricColor: "",
    fabricQuantity: "",
  };
}

const fieldClassName =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20";

type OrderItemsEditorProps = {
  onChange: (rows: ItemRow[]) => void;
};

/** Dynamic garment-line editor for the create-order form — each item optionally carries its own fabric details. */
export function OrderItemsEditor({ onChange }: OrderItemsEditorProps) {
  const [rows, setRows] = useState<ItemRow[]>(() => [emptyRow()]);

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
    <div className="flex flex-col gap-4">
      <span className="text-sm font-medium">Garment items</span>
      {rows.map((row, index) => (
        <div key={row.id} className="flex flex-col gap-3 rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Item {index + 1}</span>
            {rows.length > 1 && (
              <button type="button" onClick={() => removeRow(row.id)} className="text-sm text-red-600 hover:text-red-700">
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm">Garment</label>
              <select
                value={row.garmentType}
                onChange={(e) => updateRow(row.id, { garmentType: e.target.value as GarmentType })}
                className={fieldClassName}
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
                onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                className={fieldClassName}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm">Unit price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.unitPrice}
                onChange={(e) => updateRow(row.id, { unitPrice: e.target.value })}
                className={fieldClassName}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={row.includeFabric} onChange={(e) => updateRow(row.id, { includeFabric: e.target.checked })} />
            Add fabric details
          </label>

          {row.includeFabric && (
            <div className="grid grid-cols-2 gap-3 rounded-md bg-surface p-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm">Fabric type</label>
                <input value={row.fabricType} onChange={(e) => updateRow(row.id, { fabricType: e.target.value })} className={fieldClassName} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm">Source</label>
                <select
                  value={row.fabricSource}
                  onChange={(e) => updateRow(row.id, { fabricSource: e.target.value as FabricSource })}
                  className={fieldClassName}
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
                <input value={row.fabricColor} onChange={(e) => updateRow(row.id, { fabricColor: e.target.value })} className={fieldClassName} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm">Quantity (m)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={row.fabricQuantity}
                  onChange={(e) => updateRow(row.id, { fabricQuantity: e.target.value })}
                  className={fieldClassName}
                />
              </div>
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={addRow} className="self-start text-sm text-foreground/70 hover:text-foreground">
        + Add item
      </button>
    </div>
  );
}
