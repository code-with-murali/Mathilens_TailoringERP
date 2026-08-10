"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SearchPicker } from "@/components/ui/SearchPicker";
import { StatusBadge, ORDER_STATUS_BADGE } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { useRouteId } from "@/lib/use-route-id";
import { ApiError } from "@/lib/api-client";
import { searchEmployees, type Employee } from "@/lib/api/employees";
import { getCustomer, searchCustomers, type Customer } from "@/lib/api/customers";
import { GARMENT_TYPES, type GarmentType } from "@/lib/api/measurements";
import { createInvoice } from "@/lib/api/billing";
import {
  getOrder,
  updateOrder,
  transitionOrderStatus,
  assignOrderEmployee,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  setOrderItemFabric,
  FABRIC_SOURCES,
  type Order,
  type OrderItem,
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

/** Today, in the yyyy-MM-dd that <input type="date"> speaks. */
function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function OrderDetailPage() {
  const orderId = useRouteId();
  const router = useRouter();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editDueAt, setEditDueAt] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemGarmentType, setEditItemGarmentType] = useState<GarmentType>(GARMENT_TYPES[0]);
  const [editItemQuantity, setEditItemQuantity] = useState("1");
  const [editItemUnitPrice, setEditItemUnitPrice] = useState("");
  const [editItemError, setEditItemError] = useState<string | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);

  const [pendingRemoveItem, setPendingRemoveItem] = useState<OrderItem | null>(null);
  const [isRemovingItem, setIsRemovingItem] = useState(false);

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
      const token = getAccessToken();
      const data = await getOrder(orderId, token);
      setOrder(data);
      // A missing customer shouldn't blank the whole page — the order is still workable.
      setCustomer(await getCustomer(data.customerId, token).catch(() => null));
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load this order.");
    }
  }, [orderId]);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-mount pattern is intentionally not restructured
    // around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleTransition(target: OrderStatus, deliveredAtUtc: string | null = null) {
    setIsTransitioning(true);
    try {
      await transitionOrderStatus(orderId, target, getAccessToken(), deliveredAtUtc);
      showToast(`Order marked ${target}.`);
      setIsConfirmingDelivery(false);
      await load();
    } catch (error) {
      // The server refuses delivery while an invoice for this order still has a balance —
      // its message names the outstanding amount, so surface it as-is.
      showToast(error instanceof ApiError ? error.message : "Unable to update the order status.", "error");
    } finally {
      setIsTransitioning(false);
    }
  }

  /** Delivery is the one transition that records a date, so it goes through a dialog rather than straight to the API. */
  function startTransition(target: OrderStatus) {
    if (target !== "Delivered") {
      handleTransition(target);
      return;
    }

    setDeliveryDate(todayIsoDate());
    setIsConfirmingDelivery(true);
  }

  function openDetailsForm() {
    if (!order) {
      return;
    }
    setEditCustomer(customer);
    // <input type="date"> only speaks yyyy-MM-dd.
    setEditDueAt(order.dueAtUtc.slice(0, 10));
    setEditNotes(order.notes ?? "");
    setDetailsError(null);
    setIsEditingDetails(true);
  }

  async function handleSaveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) {
      return;
    }
    setDetailsError(null);

    const customerId = editCustomer?.id ?? order.customerId;
    if (!editDueAt) {
      setDetailsError("Choose a due date.");
      return;
    }

    setIsSavingDetails(true);
    try {
      await updateOrder(
        orderId,
        {
          customerId,
          // The employee is managed by its own section below; pass the current value through
          // rather than clearing it.
          employeeId: order.employeeId,
          dueAtUtc: new Date(`${editDueAt}T00:00:00Z`).toISOString(),
          notes: editNotes.trim() === "" ? null : editNotes,
        },
        getAccessToken(),
      );
      showToast("Order updated.");
      setIsEditingDetails(false);
      await load();
    } catch (error) {
      setDetailsError(error instanceof ApiError ? error.message : "Unable to update this order.");
    } finally {
      setIsSavingDetails(false);
    }
  }

  function openItemForm(item: OrderItem) {
    setEditItemId(item.id);
    setEditItemGarmentType(item.garmentType);
    setEditItemQuantity(String(item.quantity));
    setEditItemUnitPrice(String(item.unitPrice));
    setEditItemError(null);
  }

  async function handleSaveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editItemId) {
      return;
    }
    setEditItemError(null);

    const quantity = Number(editItemQuantity);
    const unitPrice = Number(editItemUnitPrice);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      setEditItemError("Enter a positive quantity and unit price.");
      return;
    }

    setIsSavingItem(true);
    try {
      await updateOrderItem(orderId, editItemId, editItemGarmentType, quantity, unitPrice, getAccessToken());
      showToast("Item updated.");
      setEditItemId(null);
      await load();
    } catch (error) {
      setEditItemError(error instanceof ApiError ? error.message : "Unable to update this item.");
    } finally {
      setIsSavingItem(false);
    }
  }

  async function handleConfirmRemoveItem() {
    if (!pendingRemoveItem) {
      return;
    }

    setIsRemovingItem(true);
    try {
      await removeOrderItem(orderId, pendingRemoveItem.id, getAccessToken());
      showToast("Item removed.");
      setPendingRemoveItem(null);
      await load();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Unable to remove this item.", "error");
    } finally {
      setIsRemovingItem(false);
    }
  }

  async function handleAssignEmployee(employee: Employee) {
    try {
      await assignOrderEmployee(orderId, employee.id, getAccessToken());
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
      const invoice = await createInvoice(orderId, tax, discount, getAccessToken());
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
      await addOrderItem(orderId, newItemGarmentType, quantity, unitPrice, getAccessToken());
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
        orderId,
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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Details</h2>
          {canModifyItems && !isEditingDetails && (
            <Button type="button" variant="secondary" onClick={openDetailsForm}>
              Edit Details
            </Button>
          )}
        </div>

        {isEditingDetails ? (
          <form onSubmit={handleSaveDetails} className="flex flex-col gap-3">
            <SearchPicker
              id="editCustomer"
              label="Customer"
              selectedLabel={editCustomer?.fullName ?? null}
              onSelect={setEditCustomer}
              search={searchCustomers}
              getId={(c) => c.id}
              getLabel={(c) => c.fullName}
              placeholder="Search customers…"
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="editDueAt" className="text-sm">
                Due date
              </label>
              <input
                id="editDueAt"
                type="date"
                value={editDueAt}
                onChange={(e) => setEditDueAt(e.target.value)}
                className={fieldClassName}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="editNotes" className="text-sm">
                Notes
              </label>
              <textarea
                id="editNotes"
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className={fieldClassName}
              />
            </div>
            {detailsError && (
              <p role="alert" className="text-sm text-danger">
                {detailsError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditingDetails(false)} className="text-sm text-foreground/70 hover:text-foreground">
                Cancel
              </button>
              <Button type="submit" disabled={isSavingDetails}>
                {isSavingDetails ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        ) : (
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
            {order.deliveredAtUtc && (
              <div>
                <dt className="text-foreground/70">Delivered on</dt>
                <dd className="font-medium">{new Date(order.deliveredAtUtc).toLocaleDateString()}</dd>
              </div>
            )}
            <div>
              <dt className="text-foreground/70">Customer</dt>
              <dd className="font-medium">{customer?.fullName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-foreground/70">Notes</dt>
              <dd className="font-medium whitespace-pre-wrap">{order.notes ?? "—"}</dd>
            </div>
          </dl>
        )}

        {nextStatuses.length > 0 && !isEditingDetails && (
          <div className="mt-4 flex gap-3">
            {nextStatuses.map((target) => (
              <Button
                key={target}
                type="button"
                variant={target === "Cancelled" ? "danger" : "primary"}
                disabled={isTransitioning}
                onClick={() => startTransition(target)}
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
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  {item.garmentType} × {item.quantity} @ {item.unitPrice}
                </span>
                {canModifyItems && (
                  <div className="flex shrink-0 gap-3">
                    {!item.fabric && (
                      <button type="button" onClick={() => openFabricForm(item.id)} className="text-foreground/70 hover:text-foreground">
                        Add fabric
                      </button>
                    )}
                    <button type="button" onClick={() => openItemForm(item)} className="text-foreground/70 hover:text-foreground">
                      Edit
                    </button>
                    {order.items.length > 1 && (
                      <button type="button" onClick={() => setPendingRemoveItem(item)} className="text-danger hover:text-danger-hover">
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>

              {editItemId === item.id && (
                <form onSubmit={handleSaveItem} className="mt-3 flex flex-col gap-2 rounded-md bg-surface p-3">
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={editItemGarmentType}
                      onChange={(e) => setEditItemGarmentType(e.target.value as GarmentType)}
                      className={fieldClassName}
                    >
                      {GARMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={editItemQuantity}
                      onChange={(e) => setEditItemQuantity(e.target.value)}
                      placeholder="Quantity"
                      className={fieldClassName}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editItemUnitPrice}
                      onChange={(e) => setEditItemUnitPrice(e.target.value)}
                      placeholder="Unit price"
                      className={fieldClassName}
                    />
                  </div>
                  {editItemError && (
                    <p role="alert" className="text-sm text-danger">
                      {editItemError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditItemId(null)} className="text-sm text-foreground/70 hover:text-foreground">
                      Cancel
                    </button>
                    <Button type="submit" disabled={isSavingItem}>
                      {isSavingItem ? "Saving…" : "Save item"}
                    </Button>
                  </div>
                </form>
              )}
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

      <ConfirmDialog
        open={isConfirmingDelivery}
        title="Mark as delivered"
        description="Record when this order was handed over to the customer. Delivery is refused while any amount is still outstanding on it."
        confirmLabel="Mark as delivered"
        confirmingLabel="Marking…"
        confirmVariant="primary"
        confirmDisabled={deliveryDate === ""}
        isConfirming={isTransitioning}
        onConfirm={() => handleTransition("Delivered", new Date(`${deliveryDate}T00:00:00Z`).toISOString())}
        onCancel={() => setIsConfirmingDelivery(false)}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="deliveryDate" className="text-sm">
            Delivery date
          </label>
          <input
            id="deliveryDate"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className={fieldClassName}
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={pendingRemoveItem !== null}
        title="Remove item"
        description={
          pendingRemoveItem
            ? `Remove ${pendingRemoveItem.garmentType} × ${pendingRemoveItem.quantity} from this order?`
            : ""
        }
        isConfirming={isRemovingItem}
        onConfirm={handleConfirmRemoveItem}
        onCancel={() => setPendingRemoveItem(null)}
      />
    </div>
  );
}
