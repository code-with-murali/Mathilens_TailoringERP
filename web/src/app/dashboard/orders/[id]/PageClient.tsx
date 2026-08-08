"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SearchPicker } from "@/components/ui/SearchPicker";
import { StatusBadge, ORDER_STATUS_BADGE } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { searchEmployees, type Employee } from "@/lib/api/employees";
import { GARMENT_TYPES, type GarmentType } from "@/lib/api/measurements";
import { createInvoice } from "@/lib/api/billing";
import {
  getOrder,
  transitionOrderStatus,
  assignOrderEmployee,
  addOrderItem,
  setOrderItemFabric,
  FABRIC_SOURCES,
  type Order,
  type OrderStatus,
  type FabricSource,
} from "@/lib/api/orders";

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  Received: ["InProgress", "Cancelled"],
  InProgress: ["ReadyForDelivery", "Cancelled"],
  ReadyForDelivery: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [invoiceTax, setInvoiceTax] = useState("0");
  const [invoiceDiscount, setInvoiceDiscount] = useState("0");
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemGarmentType, setNewItemGarmentType] = useState<GarmentType>(GARMENT_TYPES[0]);
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemUnitPrice, setNewItemUnitPrice] = useState("");
  const [addItemError, setAddItemError] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const [fabricItemId, setFabricItemId] = useState<string | null>(null);
  const [fabricType, setFabricType] = useState("");
  const [fabricSource, setFabricSource] = useState<FabricSource>(FABRIC_SOURCES[0]);
  const [fabricColor, setFabricColor] = useState("");
  const [fabricQuantity, setFabricQuantity] = useState("");
  const [fabricError, setFabricError] = useState<string | null>(null);
  const [isSavingFabric, setIsSavingFabric] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getOrder(params.id, getAccessToken());
      setOrder(data);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load this order.");
    }
  }, [params.id]);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-mount pattern is intentionally not restructured
    // around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleTransition(target: OrderStatus) {
    setIsTransitioning(true);
    try {
      await transitionOrderStatus(params.id, target, getAccessToken());
      showToast(`Order marked ${target}.`);
      await load();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Unable to update the order status.", "error");
    } finally {
      setIsTransitioning(false);
    }
  }

  async function handleAssignEmployee(employee: Employee) {
    try {
      await assignOrderEmployee(params.id, employee.id, getAccessToken());
      showToast("Employee assigned.");
      await load();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Unable to assign employee.", "error");
    }
  }

  async function handleCreateInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInvoiceError(null);

    const tax = Number(invoiceTax);
    const discount = Number(invoiceDiscount);
    if (!Number.isFinite(tax) || tax < 0 || !Number.isFinite(discount) || discount < 0) {
      setInvoiceError("Tax and discount must be zero or greater.");
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const invoice = await createInvoice(params.id, tax, discount, getAccessToken());
      showToast("Invoice created.");
      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (error) {
      setInvoiceError(error instanceof ApiError ? error.message : "Unable to create an invoice for this order.");
    } finally {
      setIsCreatingInvoice(false);
    }
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddItemError(null);

    const quantity = Number(newItemQuantity);
    const unitPrice = Number(newItemUnitPrice);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      setAddItemError("Enter a positive quantity and unit price.");
      return;
    }

    setIsAddingItem(true);
    try {
      await addOrderItem(params.id, newItemGarmentType, quantity, unitPrice, getAccessToken());
      showToast("Item added.");
      setShowAddItem(false);
      setNewItemQuantity("1");
      setNewItemUnitPrice("");
      await load();
    } catch (error) {
      setAddItemError(error instanceof ApiError ? error.message : "Unable to add this item.");
    } finally {
      setIsAddingItem(false);
    }
  }

  function openFabricForm(itemId: string) {
    setFabricItemId(itemId);
    setFabricType("");
    setFabricSource(FABRIC_SOURCES[0]);
    setFabricColor("");
    setFabricQuantity("");
    setFabricError(null);
  }

  async function handleSaveFabric(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fabricItemId) {
      return;
    }
    setFabricError(null);

    const quantity = Number(fabricQuantity);
    if (!fabricType.trim() || !Number.isFinite(quantity) || quantity <= 0) {
      setFabricError("Enter a fabric type and a positive quantity.");
      return;
    }

    setIsSavingFabric(true);
    try {
      await setOrderItemFabric(
        params.id,
        fabricItemId,
        fabricType,
        fabricSource,
        fabricColor.trim() === "" ? null : fabricColor,
        quantity,
        getAccessToken(),
      );
      showToast("Fabric details saved.");
      setFabricItemId(null);
      await load();
    } catch (error) {
      setFabricError(error instanceof ApiError ? error.message : "Unable to save fabric details.");
    } finally {
      setIsSavingFabric(false);
    }
  }

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-danger">
        {loadError}
      </p>
    );
  }

  if (!order) {
    return <p className="text-sm text-foreground/70">Loading…</p>;
  }

  const nextStatuses = NEXT_STATUSES[order.status];
  const canModifyItems = order.status !== "Delivered" && order.status !== "Cancelled";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Order</h1>
        <Link href="/dashboard/orders" className="text-sm text-foreground/70 hover:text-foreground">
          Back to orders
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-foreground/70">Status</dt>
            <dd className="mt-0.5">
              <StatusBadge {...ORDER_STATUS_BADGE[order.status]} />
            </dd>
          </div>
          <div>
            <dt className="text-foreground/70">Due date</dt>
            <dd className="font-medium">{new Date(order.dueAtUtc).toLocaleDateString()}</dd>
          </div>
        </dl>

        {nextStatuses.length > 0 && (
          <div className="mt-4 flex gap-3">
            {nextStatuses.map((target) => (
              <Button
                key={target}
                type="button"
                variant={target === "Cancelled" ? "danger" : "primary"}
                disabled={isTransitioning}
                onClick={() => handleTransition(target)}
              >
                Mark as {target}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-3 text-lg font-semibold">Assigned Employee</h2>
        <SearchPicker
          id="assignEmployee"
          label=""
          selectedLabel={null}
          onSelect={handleAssignEmployee}
          search={searchEmployees}
          getId={(e) => e.id}
          getLabel={(e) => e.fullName}
          placeholder="Search employees to assign…"
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Invoice</h2>
          {!showCreateInvoice && (
            <Button type="button" variant="secondary" onClick={() => setShowCreateInvoice(true)}>
              Create Invoice
            </Button>
          )}
        </div>
        {!showCreateInvoice && <p className="text-sm text-foreground/70">No invoice created from this page yet.</p>}
        {showCreateInvoice && (
          <form onSubmit={handleCreateInvoice} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm">Tax amount</label>
                <input type="number" min="0" step="0.01" value={invoiceTax} onChange={(e) => setInvoiceTax(e.target.value)} className={fieldClassName} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm">Discount amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceDiscount}
                  onChange={(e) => setInvoiceDiscount(e.target.value)}
                  className={fieldClassName}
                />
              </div>
            </div>
            {invoiceError && (
              <p role="alert" className="text-sm text-danger">
                {invoiceError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreateInvoice(false)} className="text-sm text-foreground/70 hover:text-foreground">
                Cancel
              </button>
              <Button type="submit" disabled={isCreatingInvoice}>
                {isCreatingInvoice ? "Creating…" : "Create invoice"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Items</h2>
          {canModifyItems && !showAddItem && (
            <Button type="button" variant="secondary" onClick={() => setShowAddItem(true)}>
              Add Item
            </Button>
          )}
        </div>

        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {item.garmentType} × {item.quantity} @ {item.unitPrice}
                </span>
                {!item.fabric && canModifyItems && (
                  <button type="button" onClick={() => openFabricForm(item.id)} className="text-foreground/70 hover:text-foreground">
                    Add fabric
                  </button>
                )}
              </div>
              {item.fabric && (
                <p className="mt-1 text-foreground/70">
                  Fabric: {item.fabric.fabricType} (
                  {item.fabric.source === "CustomerSupplied" ? "customer supplied" : "shop supplied"}
                  {item.fabric.color ? `, ${item.fabric.color}` : ""}, {item.fabric.quantity}m)
                </p>
              )}

              {fabricItemId === item.id && (
                <form onSubmit={handleSaveFabric} className="mt-3 flex flex-col gap-2 rounded-md bg-surface p-3">
                  <input value={fabricType} onChange={(e) => setFabricType(e.target.value)} placeholder="Fabric type" className={fieldClassName} />
                  <select value={fabricSource} onChange={(e) => setFabricSource(e.target.value as FabricSource)} className={fieldClassName}>
                    {FABRIC_SOURCES.map((source) => (
                      <option key={source} value={source}>
                        {source === "CustomerSupplied" ? "Customer supplied" : "Shop supplied"}
                      </option>
                    ))}
                  </select>
                  <input
                    value={fabricColor}
                    onChange={(e) => setFabricColor(e.target.value)}
                    placeholder="Color (optional)"
                    className={fieldClassName}
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={fabricQuantity}
                    onChange={(e) => setFabricQuantity(e.target.value)}
                    placeholder="Quantity (m)"
                    className={fieldClassName}
                  />
                  {fabricError && (
                    <p role="alert" className="text-sm text-danger">
                      {fabricError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setFabricItemId(null)} className="text-sm text-foreground/70 hover:text-foreground">
                      Cancel
                    </button>
                    <Button type="submit" disabled={isSavingFabric}>
                      {isSavingFabric ? "Saving…" : "Save fabric"}
                    </Button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>

        {showAddItem && (
          <form onSubmit={handleAddItem} className="mt-4 flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
            <div className="grid grid-cols-3 gap-3">
              <select value={newItemGarmentType} onChange={(e) => setNewItemGarmentType(e.target.value as GarmentType)} className={fieldClassName}>
                {GARMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="Quantity"
                className={fieldClassName}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={newItemUnitPrice}
                onChange={(e) => setNewItemUnitPrice(e.target.value)}
                placeholder="Unit price"
                className={fieldClassName}
              />
            </div>
            {addItemError && (
              <p role="alert" className="text-sm text-danger">
                {addItemError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddItem(false)} className="text-sm text-foreground/70 hover:text-foreground">
                Cancel
              </button>
              <Button type="submit" disabled={isAddingItem}>
                {isAddingItem ? "Adding…" : "Add item"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
