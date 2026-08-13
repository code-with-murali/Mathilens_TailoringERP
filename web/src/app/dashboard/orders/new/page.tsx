"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchPicker } from "@/components/ui/SearchPicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OrderItemsEditor, type ItemRow } from "@/components/orders/OrderItemsEditor";
import { InvoicePrintModal } from "@/components/orders/InvoicePrintModal";
import { OrderStatusCounts } from "@/components/dashboard/OrderStatusCounts";
import { useMeasurementFields } from "@/lib/use-measurement-templates";
import { useToast } from "@/components/ui/ToastProvider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { searchCustomers, createCustomer, type Customer } from "@/lib/api/customers";
import { searchEmployees, type Employee } from "@/lib/api/employees";
import { createOrder, type CreateOrderItemInput, type Order } from "@/lib/api/orders";
import { listMeasurementsForCustomer, createMeasurement, updateMeasurementValues, type Measurement } from "@/lib/api/measurements";
import { getSetting, DEFAULT_ORDER_DUE_DATE_DAYS_KEY } from "@/lib/api/settings";
import { createInvoice, recordPayment, PAYMENT_METHODS, type PaymentMethod, type Invoice } from "@/lib/api/billing";
import "./theme.css";

const fieldClassName = "rounded-md border border-border bg-surface px-3 py-1 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export default function NewOrderPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const debouncedMobileNumber = useDebouncedValue(mobileNumber, 300);
  const [mobileMatches, setMobileMatches] = useState<Customer[]>([]);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerError, setNewCustomerError] = useState<string | null>(null);
  const [newCustomerFieldErrors, setNewCustomerFieldErrors] = useState<Record<string, string>>({});
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [dueAtUtc, setDueAtUtc] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [itemRows, setItemRows] = useState<ItemRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [activeMeasurementItemId, setActiveMeasurementItemId] = useState<number | null>(null);
  const [customerMeasurements, setCustomerMeasurements] = useState<Measurement[]>([]);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [measurementFormError, setMeasurementFormError] = useState<string | null>(null);
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false);
  const [isViewingSummary, setIsViewingSummary] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [showInvoiceConfirm, setShowInvoiceConfirm] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [autoPrintInvoice, setAutoPrintInvoice] = useState(false);

  const isOrderCreated = createdOrder !== null;

  const activeMeasurementItemIndex = itemRows.findIndex((row) => row.id === activeMeasurementItemId);
  const activeMeasurementItem = activeMeasurementItemIndex === -1 ? null : itemRows[activeMeasurementItemIndex];
  const activeMeasurement = activeMeasurementItem ? (customerMeasurements.find((m) => m.garmentType === activeMeasurementItem.garmentType) ?? null) : null;

  // Split into two side-by-side halves within one merged block (00_MASTER_SPEC.md § 9.6) rather
  // than one long list. The points themselves come from the shop's configured template
  // (Settings › Measurement Templates), in its configured order.
  const { fields: measurementFields, isLoading: isLoadingTemplate } =
    useMeasurementFields(activeMeasurementItem?.garmentType ?? null);
  const measurementFieldsFirstHalf = measurementFields.slice(0, Math.ceil(measurementFields.length / 2));
  const measurementFieldsSecondHalf = measurementFields.slice(Math.ceil(measurementFields.length / 2));

  const itemsAreaRef = useRef<HTMLDivElement>(null);
  const measurementBlockRef = useRef<HTMLDivElement>(null);
  const mobileFieldRef = useRef<HTMLDivElement>(null);
  const orderSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeMeasurementItem && !isViewingSummary) {
      return;
    }

    // Clicking an item card opens the measurement panel, clicking Order summary opens the invoice
    // preview — clicking anywhere else (Customer field, Due date, blank space, etc.) should close
    // whichever one is open, same as their own Close button — but a click inside the panel/Order
    // summary cell itself must not count as "elsewhere".
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (itemsAreaRef.current?.contains(target) || measurementBlockRef.current?.contains(target) || orderSummaryRef.current?.contains(target)) {
        return;
      }
      setActiveMeasurementItemId(null);
      setIsViewingSummary(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeMeasurementItem, isViewingSummary]);

  useEffect(() => {
    if (!isMobileDropdownOpen) {
      return;
    }

    // Same outside-click-closes pattern as the measurement panel above — a click on the dropdown
    // itself (picking a match) must not count as "elsewhere".
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (mobileFieldRef.current?.contains(target)) {
        return;
      }
      setIsMobileDropdownOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isMobileDropdownOpen]);

  useEffect(() => {
    if (!activeMeasurementItem) {
      return;
    }
    const initial: Record<string, string> = {};
    if (activeMeasurement) {
      for (const [name, value] of Object.entries(activeMeasurement.values)) {
        initial[name] = String(value);
      }
    }
    // Keyed on the item/measurement identity, not the objects themselves — re-runs exactly when
    // switching targets, not on every unrelated re-render. See CustomersPage for why this
    // reset-on-dependency-change pattern is intentionally not restructured around the
    // set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMeasurementValues(initial);
    setMeasurementFormError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMeasurementItem?.id, activeMeasurement?.id]);

  // Live preview only — tolerant of blank/partial rows so the total updates as the shop owner
  // types, unlike handleSubmit's strict per-item validation which runs at actual submit time.
  function itemRowTotal(row: ItemRow): number {
    const quantity = Number(row.quantity);
    const unitPrice = Number(row.unitPrice);
    return (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0);
  }
  const orderTotal = itemRows.reduce((sum, row) => sum + itemRowTotal(row), 0);
  const advanceValue = advanceAmount.trim() === "" ? 0 : Number(advanceAmount);
  const orderBalance = orderTotal - (Number.isFinite(advanceValue) ? advanceValue : 0);

  function selectCustomer(selected: Customer) {
    setCustomer(selected);
    setMobileNumber("");
    setMobileMatches([]);
    setIsMobileDropdownOpen(false);
    setIsAddingNewCustomer(false);
  }

  function clearCustomer() {
    setCustomer(null);
    setMobileNumber("");
    setMobileMatches([]);
    setIsMobileDropdownOpen(false);
    setActiveMeasurementItemId(null);
  }

  function startAddingNewCustomer(query: string, field: "name" | "phone" = "name") {
    setNewCustomerName(field === "name" ? query : "");
    setNewCustomerPhone(field === "phone" ? query : "");
    setNewCustomerEmail("");
    setNewCustomerError(null);
    setNewCustomerFieldErrors({});
    setIsAddingNewCustomer(true);
    setIsMobileDropdownOpen(false);
    setActiveMeasurementItemId(null);
    setIsViewingSummary(false);
  }

  function handleItemClick(row: ItemRow) {
    setActiveMeasurementItemId(row.id);
    setIsAddingNewCustomer(false);
    setIsViewingSummary(false);
  }

  function handleOpenSummary() {
    setIsViewingSummary(true);
    setActiveMeasurementItemId(null);
    setIsAddingNewCustomer(false);
  }

  function handleClearMeasurement() {
    setMeasurementFormError(null);
    setMeasurementValues({});
  }

  async function handleSaveMeasurement() {
    if (!activeMeasurementItem || !customer) {
      return;
    }
    setMeasurementFormError(null);

    const values: Record<string, number> = {};
    for (const field of measurementFields) {
      const raw = (measurementValues[field] ?? "").trim();
      if (raw === "") {
        // Fixed fields are individually optional — skip the ones not measured yet, rather than
        // forcing every point to be filled in before anything can be saved.
        continue;
      }
      const numericValue = Number(raw);
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        setMeasurementFormError(`"${field}" needs a value greater than zero.`);
        return;
      }
      values[field] = numericValue;
    }

    if (Object.keys(values).length === 0) {
      setMeasurementFormError("Add at least one measurement point.");
      return;
    }

    setIsSavingMeasurement(true);
    try {
      const saved = activeMeasurement
        ? await updateMeasurementValues(activeMeasurement.id, values, getAccessToken())
        : await createMeasurement(customer.id, activeMeasurementItem.garmentType, values, getAccessToken());
      setCustomerMeasurements((prev) => [...prev.filter((m) => m.id !== saved.id), saved]);
      showToast("Measurement saved.");
      // Stays open after saving — closing would hide the panel the moment it's saved. Clear
      // resets the fields; Close (in column 2) exits.
    } catch (error) {
      setMeasurementFormError(error instanceof ApiError ? error.message : "Unable to reach the server. Please try again.");
    } finally {
      setIsSavingMeasurement(false);
    }
  }

  useEffect(() => {
    if (!debouncedMobileNumber || customer) {
      // No direct setState here for the empty/already-selected case — mirrors SearchPicker's
      // own reasoning: stale results simply aren't rendered rather than being actively cleared.
      return;
    }

    let cancelled = false;
    searchCustomers(debouncedMobileNumber, 1, 10, getAccessToken())
      .then(({ items }) => {
        if (cancelled) {
          return;
        }
        const normalizedQuery = digitsOnly(debouncedMobileNumber);
        const exactMatches = items.filter((c) => digitsOnly(c.phoneNumber) === normalizedQuery);
        if (exactMatches.length === 1) {
          selectCustomer(exactMatches[0]);
          return;
        }
        setMobileMatches(items);
      })
      .catch(() => {
        if (!cancelled) {
          setMobileMatches([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedMobileNumber, customer]);

  const loadCustomerMeasurements = useCallback(async () => {
    if (!customer) {
      return;
    }
    setIsLoadingMeasurements(true);
    try {
      const data = await listMeasurementsForCustomer(customer.id, getAccessToken());
      setCustomerMeasurements(data);
    } catch {
      setCustomerMeasurements([]);
    } finally {
      setIsLoadingMeasurements(false);
    }
  }, [customer]);

  useEffect(() => {
    // Loads the selected customer's existing measurements so the per-item panel below can tell
    // whether a garment type already has one on file (update) or not (create).
    // See CustomersPage for why this fetch-on-dependency-change pattern is intentionally not
    // restructured around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCustomerMeasurements();
  }, [loadCustomerMeasurements]);

  const applyDefaultDueDate = useCallback(() => {
    // Pre-fills Due date from the shop's configured turnaround (Settings page) — different
    // shops commit to different lead times, so this isn't hardcoded. Silently does nothing if
    // the setting was never configured; the functional update leaves a value the user already
    // typed untouched, in case this resolves after they've started filling the form.
    getSetting(DEFAULT_ORDER_DUE_DATE_DAYS_KEY, getAccessToken())
      .then((setting) => {
        const days = Number(setting.value);
        if (!Number.isFinite(days) || days <= 0) {
          return;
        }
        const due = new Date();
        due.setDate(due.getDate() + days);
        const isoDate = due.toISOString().slice(0, 10);
        setDueAtUtc((current) => current || isoDate);
      })
      .catch(() => {
        // No default configured — Due date stays blank, same as before this feature existed.
      });
  }, []);

  useEffect(() => {
    applyDefaultDueDate();
  }, [applyDefaultDueDate]);

  function handleStartNewOrder() {
    // Resets every field back to a blank form — the Add item/quantity/etc. rows live inside
    // OrderItemsEditor's own state, so bumping formKey remounts it instead of trying to reach in.
    setCustomer(null);
    setMobileNumber("");
    setMobileMatches([]);
    setIsMobileDropdownOpen(false);
    setIsAddingNewCustomer(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerEmail("");
    setNewCustomerError(null);
    setNewCustomerFieldErrors({});
    setEmployee(null);
    setDueAtUtc("");
    setItemRows([]);
    setFormError(null);
    setIsSubmitting(false);
    setCreatedOrder(null);
    setInvoiceError(null);
    setIsGeneratingInvoice(false);
    setCreatedInvoice(null);
    setShowInvoiceModal(false);
    setAutoPrintInvoice(false);
    setActiveMeasurementItemId(null);
    setCustomerMeasurements([]);
    setAdvanceAmount("");
    setAdvanceMethod(PAYMENT_METHODS[0]);
    setMeasurementValues({});
    setMeasurementFormError(null);
    setIsViewingSummary(false);
    setFormKey((key) => key + 1);
    applyDefaultDueDate();
  }

  async function handleCreateNewCustomer() {
    setNewCustomerError(null);
    setNewCustomerFieldErrors({});

    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      setNewCustomerError("Full name and phone number are required.");
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const created = await createCustomer(
        {
          fullName: newCustomerName,
          phoneNumber: newCustomerPhone,
          email: newCustomerEmail.trim() === "" ? null : newCustomerEmail,
          address: null,
          notes: null,
          // The quick-add at the counter captures only what's needed to take the order; the rest
          // of the profile is filled in later on the customer page.
          gender: null,
          religion: null,
          dateOfBirth: null,
          weddingDate: null,
        },
        getAccessToken(),
      );
      showToast("Customer created.");
      selectCustomer(created);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details) {
          setNewCustomerFieldErrors(Object.fromEntries(error.details.map((d) => [d.field.toLowerCase(), d.message])));
        }
        setNewCustomerError(error.message);
      } else {
        setNewCustomerError("Unable to reach the server. Please try again.");
      }
    } finally {
      setIsCreatingCustomer(false);
    }
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!customer) {
      setFormError("Select a customer.");
      return;
    }
    if (!dueAtUtc) {
      setFormError("Set a due date.");
      return;
    }

    const items: CreateOrderItemInput[] = [];
    for (const row of itemRows) {
      // The form starts with a few blank placeholder rows so staff don't have to click "+ Add
      // item" for a typical order — untouched ones (no cloth code, no unit price typed in) are
      // silently skipped rather than blocking submission with a validation error.
      if (row.clothCode.trim() === "" && row.unitPrice.trim() === "") {
        continue;
      }

      const quantity = Number(row.quantity);
      const unitPrice = Number(row.unitPrice);
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
        setFormError("Every item needs a positive quantity and unit price.");
        return;
      }

      let fabric = null;
      if (row.includeFabric) {
        const fabricQuantity = Number(row.fabricQuantity);
        if (!row.fabricType.trim() || !Number.isFinite(fabricQuantity) || fabricQuantity <= 0) {
          setFormError("Fabric details need a type and a positive quantity.");
          return;
        }
        fabric = {
          fabricType: row.fabricType,
          source: row.fabricSource,
          color: row.fabricColor.trim() === "" ? null : row.fabricColor,
          quantity: fabricQuantity,
          // Sent so shop-supplied cloth comes off stock. The server resolves it against the price
          // list; an unmatched code is kept as typed and simply never reaches inventory.
          clothCode: row.clothCode.trim() === "" ? null : row.clothCode.trim(),
          unit: "Metres" as const,
        };
      }

      items.push({ garmentType: row.garmentType, quantity, unitPrice, fabric });
    }

    if (items.length === 0) {
      setFormError("Add at least one garment item.");
      return;
    }

    if (!Number.isFinite(advanceValue) || advanceValue < 0) {
      setFormError("Advance amount must be zero or greater.");
      return;
    }
    if (advanceValue > orderTotal) {
      setFormError("Advance can't be more than the order total.");
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOrder(
        {
          customerId: customer.id,
          employeeId: employee?.id ?? null,
          dueAtUtc: new Date(dueAtUtc).toISOString(),
          notes: orderNotes.trim() === "" ? null : orderNotes,
          items,
        },
        getAccessToken(),
      );
      // Invoice generation is now a separate, explicit step (the Generate Invoice button below)
      // rather than automatic — staff review Total/Advance/Balance before committing to it.
      setCreatedOrder(order);
      showToast("Order created.");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenerateInvoice() {
    if (!createdOrder) {
      return;
    }
    setInvoiceError(null);
    setIsGeneratingInvoice(true);
    try {
      // Tax/discount default to 0 since this form has no fields for them; staff can still adjust
      // an invoice's status via payments afterward.
      const invoice = await createInvoice(createdOrder.id, 0, 0, getAccessToken());
      // recordPayment returns the invoice with amountPaid/remainingBalance updated — that's the
      // copy the printable invoice needs, not the pre-payment one from createInvoice.
      const finalInvoice = advanceValue > 0 ? await recordPayment(invoice.id, advanceValue, advanceMethod, getAccessToken()) : invoice;
      showToast("Invoice generated.");
      // Stay on this page instead of navigating away — Generate invoice turns into View Invoice,
      // which opens the printable modal, so staff decide when to leave.
      setCreatedInvoice(finalInvoice);
    } catch (error) {
      // The order itself already exists — don't strand it. Staff can retry Generate Invoice here,
      // or fall back to the order page's own manual "Create Invoice" action.
      setInvoiceError(error instanceof ApiError ? error.message : "Unable to reach the server. Please try again.");
    } finally {
      setIsGeneratingInvoice(false);
    }
  }

  return (
    <>
    <div className="orderNewSkin flex flex-col gap-3 print:hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{createdOrder ? `Order - #${createdOrder.id.slice(0, 8).toUpperCase()}` : "New Order"}</h1>
        <Link href="/dashboard/orders" className="text-sm text-foreground/70 hover:text-foreground">
          Back to orders
        </Link>
      </div>

      <form onSubmit={handleCreateOrder} className="flex flex-col gap-3">
        <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-stretch">
          {/* Column 1: who the order is for, and what's being made. */}
          <div className="flex w-full flex-1 flex-col gap-2 rounded-lg border border-border bg-surface p-3 lg:flex-[2]">
          <div className="orderSection-customer flex flex-col gap-2">
            {/* The Customer field (a second, name/phone search picker) was removed as redundant
                with Mobile Number below — this block now doubles as both the search UI and, once
                a customer is picked, their name/phone display with a Change link back to search. */}
            {!customer ? (
              <div ref={mobileFieldRef} className="relative flex flex-col gap-1">
                <label htmlFor="mobileNumber" className="text-sm font-medium">
                  Customer Detail
                </label>
                <input
                  id="mobileNumber"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    setIsMobileDropdownOpen(true);
                  }}
                  onFocus={() => setIsMobileDropdownOpen(true)}
                  placeholder="Search by mobile number…"
                  className={fieldClassName}
                />
                {isMobileDropdownOpen && debouncedMobileNumber && mobileMatches.length > 0 && (
                  <ul className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
                    {mobileMatches.map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => selectCustomer(c)} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-hover">
                          {c.fullName} ({c.phoneNumber})
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {isMobileDropdownOpen && debouncedMobileNumber && mobileMatches.length === 0 && digitsOnly(debouncedMobileNumber).length >= 7 && (
                  <div className="absolute top-full z-10 mt-1 w-full rounded-md border border-border bg-surface shadow-lg">
                    <button
                      type="button"
                      onClick={() => startAddingNewCustomer(debouncedMobileNumber, "phone")}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-hover"
                    >
                      {`+ Add new customer with mobile ${debouncedMobileNumber}`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Customer</label>
                <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm">
                  <span>
                    {customer.fullName} ({customer.phoneNumber})
                  </span>
                  {!isOrderCreated && (
                    <button type="button" onClick={clearCustomer} className="text-foreground/70 hover:text-foreground">
                      Change
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

            <div ref={itemsAreaRef} className="orderSection-items">
              <OrderItemsEditor
                key={formKey}
                onChange={setItemRows}
                activeItemId={activeMeasurementItemId}
                onItemClick={handleItemClick}
                disabled={isOrderCreated}
              />
            </div>
          </div>

          {/* Right side: the measurement panel merges columns 2 and 3's top into one block when
              an item is active; Due date/Assigned employee and Order summary sit below it, back
              as two separate columns. */}
          <div className="flex w-full flex-1 flex-col gap-3 lg:flex-[2]">
            {/* Always present (blank when no item is active) so Due date/Assigned employee and
                Order summary below stay pinned to the bottom, matching column 1's height, instead
                of jumping up to fill the gap. */}
            <div ref={measurementBlockRef} className="flex flex-1 flex-col gap-3 rounded-lg border-2 border-foreground bg-surface p-3">
              {activeMeasurementItem && (
                <div className="orderSection-measure flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 border-b-2 border-foreground/15 pb-3">
                    <span className="order-heading min-w-0 flex-1 truncate text-sm font-medium">
                      Measurement Detail - Item {activeMeasurementItemIndex + 1} - {activeMeasurementItem.garmentType}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveMeasurementItemId(null)}
                      className="shrink-0 text-sm text-foreground/70 hover:text-foreground"
                    >
                      Close
                    </button>
                  </div>
                  {!customer ? (
                    <p className="text-sm text-foreground/70">Select a customer to view or add their measurements.</p>
                  ) : isLoadingMeasurements || isLoadingTemplate ? (
                    <p className="text-sm text-foreground/70">Loading measurements…</p>
                  ) : measurementFields.length === 0 ? (
                    <p className="text-sm text-foreground/70">No measurement points configured for {activeMeasurementItem.garmentType} yet.</p>
                  ) : (
                    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                      <div className="flex flex-1 flex-col gap-2">
                        {measurementFieldsFirstHalf.map((field) => (
                          <div key={field} className="flex items-center gap-3">
                            <label className="w-32 shrink-0 text-sm text-foreground/80">{field}</label>
                            <input
                              aria-label={`${field} measurement value`}
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="cm"
                              value={measurementValues[field] ?? ""}
                              disabled={isOrderCreated}
                              onChange={(e) => setMeasurementValues((prev) => ({ ...prev, [field]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.preventDefault();
                              }}
                              className="w-24 rounded-md border-2 border-foreground bg-surface px-3 py-1 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        {measurementFieldsSecondHalf.map((field) => (
                          <div key={field} className="flex items-center gap-3">
                            <label className="w-32 shrink-0 text-sm text-foreground/80">{field}</label>
                            <input
                              aria-label={`${field} measurement value`}
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="cm"
                              value={measurementValues[field] ?? ""}
                              disabled={isOrderCreated}
                              onChange={(e) => setMeasurementValues((prev) => ({ ...prev, [field]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.preventDefault();
                              }}
                              className="w-24 rounded-md border-2 border-foreground bg-surface px-3 py-1 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {measurementFormError && (
                    <p role="alert" className="text-sm text-danger">
                      {measurementFormError}
                    </p>
                  )}

                  {customer && !isLoadingMeasurements && measurementFields.length > 0 && (
                    <div className="flex justify-center gap-3 border-y-2 border-foreground/15 py-3">
                      <Button type="button" variant="secondary" onClick={handleClearMeasurement} disabled={isSavingMeasurement || isOrderCreated}>
                        Clear
                      </Button>
                      <Button type="button" onClick={handleSaveMeasurement} disabled={isSavingMeasurement || isOrderCreated}>
                        {isSavingMeasurement ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {/* "+ Add new customer" (from the Mobile Number or Customer field) opens the New
                  customer form here, in the same top block, instead of inline in column 1 —
                  mutually exclusive with the measurement panel above since starting either one
                  clears the other's active state. */}
              {!activeMeasurementItem && isAddingNewCustomer && (
                <div className="orderSection-customer flex flex-col gap-2">
                  <span className="order-heading text-sm font-medium">New customer</span>
                  <Input id="newCustomerName" label="Full name" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} error={newCustomerFieldErrors.fullname} />
                  <Input id="newCustomerPhone" label="Phone number" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} error={newCustomerFieldErrors.phonenumber} />
                  <Input id="newCustomerEmail" label="Email (optional)" type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} error={newCustomerFieldErrors.email} />
                  {newCustomerError && (
                    <p role="alert" className="text-sm text-danger">
                      {newCustomerError}
                    </p>
                  )}
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAddingNewCustomer(false)} className="text-sm text-foreground/70 hover:text-foreground">
                      Cancel
                    </button>
                    <Button type="button" variant="secondary" disabled={isCreatingCustomer} onClick={handleCreateNewCustomer}>
                      {isCreatingCustomer ? "Adding…" : "Add customer"}
                    </Button>
                  </div>
                </div>
              )}
              {/* Clicking the Order summary cell opens an invoice-style preview here instead of
                  just closing whatever was open — a read-only recap of items/total/advance/balance
                  before committing to Create order. */}
              {!activeMeasurementItem && !isAddingNewCustomer && isViewingSummary && (
                <div className="orderSection-summary flex flex-1 flex-col gap-3">
                  <div className="flex items-center justify-between border-b-2 border-foreground/15 pb-3">
                    <span className="order-heading text-sm font-medium">Order Summary Preview</span>
                    <button type="button" onClick={() => setIsViewingSummary(false)} className="text-sm text-foreground/70 hover:text-foreground">
                      Close
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-foreground/70">
                        <th className="py-1 font-medium">#</th>
                        <th className="py-1 font-medium">Garment</th>
                        <th className="py-1 text-right font-medium">Qty</th>
                        <th className="py-1 text-right font-medium">Unit price</th>
                        <th className="py-1 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemRows.map((row, index) => (
                        <tr key={row.id} className="border-b border-border/50">
                          <td className="py-1">{index + 1}</td>
                          <td className="py-1">{row.garmentType}</td>
                          <td className="py-1 text-right">{row.quantity || "0"}</td>
                          <td className="py-1 text-right">{(Number(row.unitPrice) || 0).toFixed(2)}</td>
                          <td className="py-1 text-right">{itemRowTotal(row).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex flex-col gap-1 border-t-2 border-foreground/15 pt-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/70">Total</span>
                      <span className="font-medium">{orderTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/70">Advance</span>
                      <span className="font-medium">{advanceValue.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/70">Balance</span>
                      <span className="font-medium">{orderBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Widget helps staff before they've picked a customer to work on; once a customer is
                  selected this box is reserved for that customer's item measurements, so the
                  widget is disabled (hidden) rather than shown alongside them. */}
              {!activeMeasurementItem && !isAddingNewCustomer && !isViewingSummary && !customer && <OrderStatusCounts />}
            </div>

            <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-stretch">
              {/* Column 2: money. Clicking the cell (outside the interactive advance fields) opens
                  the invoice preview above. */}
              <div
                ref={orderSummaryRef}
                onClick={handleOpenSummary}
                className={`orderSection-summary flex w-full flex-1 cursor-pointer flex-col gap-2 rounded-lg border p-3 ${
                  isViewingSummary ? "border-foreground bg-surface ring-1 ring-foreground" : "border-border bg-surface"
                }`}
              >
                <span className="order-heading text-sm font-medium">Order summary</span>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/70">Total</span>
                  <span className="font-medium">{orderTotal.toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="advanceAmount" className="text-sm font-medium">
                    Advance received (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      id="advanceAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={advanceAmount}
                      disabled={isOrderCreated}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      placeholder="0.00"
                      className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                    />
                    <select
                      value={advanceMethod}
                      disabled={isOrderCreated}
                      onChange={(e) => setAdvanceMethod(e.target.value as PaymentMethod)}
                      className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                  <span className="text-foreground/70">Balance</span>
                  <span className="font-medium">{orderBalance.toFixed(2)}</span>
                </div>
              </div>

              {/* Column 3: scheduling. */}
              <div className="orderSection-schedule flex w-full flex-1 flex-col gap-3 rounded-lg border border-border bg-surface p-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="dueAtUtc" className="text-sm font-medium">
                    Due date
                  </label>
                  <input
                    id="dueAtUtc"
                    type="date"
                    value={dueAtUtc}
                    disabled={isOrderCreated}
                    onChange={(e) => setDueAtUtc(e.target.value)}
                    className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                  />
                </div>

                <SearchPicker
                  id="employee"
                  label="Assigned employee (optional)"
                  selectedLabel={employee ? employee.fullName : null}
                  onSelect={setEmployee}
                  onClear={() => setEmployee(null)}
                  search={searchEmployees}
                  getId={(e) => e.id}
                  getLabel={(e) => e.fullName}
                  placeholder="Search employees…"
                  disabled={isOrderCreated}
                />

                <div className="flex flex-col gap-1">
                  <label htmlFor="orderNotes" className="text-sm font-medium">
                    Notes (optional)
                  </label>
                  <textarea
                    id="orderNotes"
                    rows={3}
                    value={orderNotes}
                    disabled={isOrderCreated}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Anything the tailor should know…"
                    className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: order creation and (once created) invoice generation, as two explicit steps. */}
            <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-3">
              {(formError || invoiceError) && (
                <p role="alert" className="text-sm text-danger">
                  {formError ?? invoiceError}
                </p>
              )}
              <div className="flex items-center justify-center gap-3">
                <Button type="submit" disabled={isSubmitting || isOrderCreated}>
                  {isSubmitting ? "Creating…" : isOrderCreated ? "Order created" : "Create order"}
                </Button>
                {createdInvoice ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setAutoPrintInvoice(false);
                        setShowInvoiceModal(true);
                      }}
                    >
                      View Invoice
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setAutoPrintInvoice(true);
                        setShowInvoiceModal(true);
                      }}
                    >
                      Print Invoice
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setShowInvoiceConfirm(true)} disabled={!isOrderCreated || isGeneratingInvoice}>
                    {isGeneratingInvoice ? "Generating…" : "Generate invoice"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!isOrderCreated}
                  onClick={() => createdOrder && router.push(`/dashboard/orders/${createdOrder.id}`)}
                >
                  View order
                </Button>
                <Button type="button" variant="secondary" disabled={!isOrderCreated} onClick={handleStartNewOrder}>
                  New order
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={showInvoiceConfirm}
        title="Generate invoice"
        description={`Generate an invoice for this order now? Total ${orderTotal.toFixed(2)}, advance ${advanceValue.toFixed(2)}, balance ${orderBalance.toFixed(2)}.`}
        confirmLabel="Generate"
        confirmingLabel="Generating…"
        confirmVariant="primary"
        isConfirming={isGeneratingInvoice}
        onConfirm={() => {
          setShowInvoiceConfirm(false);
          handleGenerateInvoice();
        }}
        onCancel={() => setShowInvoiceConfirm(false)}
      />
    </div>

    {/* Rendered outside the print:hidden wrapper above so printing the modal doesn't also try
        to print (and hide) the rest of the New Order form behind it. */}
    {showInvoiceModal && createdInvoice && createdOrder && customer && (
      <InvoicePrintModal
        invoice={createdInvoice}
        order={createdOrder}
        customer={customer}
        autoPrint={autoPrintInvoice}
        onClose={() => setShowInvoiceModal(false)}
      />
    )}
    </>
  );
}
