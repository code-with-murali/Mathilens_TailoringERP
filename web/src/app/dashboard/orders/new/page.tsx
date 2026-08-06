"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchPicker } from "@/components/ui/SearchPicker";
import { OrderItemsEditor, type ItemRow } from "@/components/orders/OrderItemsEditor";
import { MeasurementForm } from "@/components/measurements/MeasurementForm";
import { useToast } from "@/components/ui/ToastProvider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { searchCustomers, createCustomer, type Customer } from "@/lib/api/customers";
import { searchEmployees, type Employee } from "@/lib/api/employees";
import { createOrder, type CreateOrderItemInput } from "@/lib/api/orders";
import { listMeasurementsForCustomer, createMeasurement, updateMeasurementValues, type Measurement } from "@/lib/api/measurements";
import { getSetting, DEFAULT_ORDER_DUE_DATE_DAYS_KEY } from "@/lib/api/settings";
import { createInvoice, recordPayment, PAYMENT_METHODS, type PaymentMethod } from "@/lib/api/billing";

const fieldClassName = "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20";

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
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerError, setNewCustomerError] = useState<string | null>(null);
  const [newCustomerFieldErrors, setNewCustomerFieldErrors] = useState<Record<string, string>>({});
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [dueAtUtc, setDueAtUtc] = useState("");
  const [itemRows, setItemRows] = useState<ItemRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMeasurementItemId, setActiveMeasurementItemId] = useState<number | null>(null);
  const [customerMeasurements, setCustomerMeasurements] = useState<Measurement[]>([]);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);

  const activeMeasurementItem = itemRows.find((row) => row.id === activeMeasurementItemId) ?? null;
  const activeMeasurement = activeMeasurementItem ? (customerMeasurements.find((m) => m.garmentType === activeMeasurementItem.garmentType) ?? null) : null;

  // Live preview only — tolerant of blank/partial rows so the total updates as the shop owner
  // types, unlike handleSubmit's strict per-item validation which runs at actual submit time.
  const orderTotal = itemRows.reduce((sum, row) => {
    const quantity = Number(row.quantity);
    const unitPrice = Number(row.unitPrice);
    return sum + (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0);
  }, 0);
  const advanceValue = advanceAmount.trim() === "" ? 0 : Number(advanceAmount);
  const orderBalance = orderTotal - (Number.isFinite(advanceValue) ? advanceValue : 0);

  function selectCustomer(selected: Customer) {
    setCustomer(selected);
    setMobileNumber("");
    setMobileMatches([]);
    setIsAddingNewCustomer(false);
  }

  function clearCustomer() {
    setCustomer(null);
    setMobileNumber("");
    setMobileMatches([]);
    setActiveMeasurementItemId(null);
  }

  function startAddingNewCustomer(query: string, field: "name" | "phone" = "name") {
    setNewCustomerName(field === "name" ? query : "");
    setNewCustomerPhone(field === "phone" ? query : "");
    setNewCustomerEmail("");
    setNewCustomerError(null);
    setNewCustomerFieldErrors({});
    setIsAddingNewCustomer(true);
    setActiveMeasurementItemId(null);
  }

  function handleItemClick(row: ItemRow) {
    setActiveMeasurementItemId(row.id);
    setIsAddingNewCustomer(false);
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

  useEffect(() => {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
          items,
        },
        getAccessToken(),
      );

      try {
        // Deliberately generated right away rather than left as the separate manual step the
        // order-detail page still offers — the shop owner asked to see Total/Advance/Balance the
        // moment the order exists, not as a later action. Tax/discount default to 0 since this
        // form has no fields for them; staff can still adjust an invoice's status via payments
        // afterward.
        const invoice = await createInvoice(order.id, 0, 0, getAccessToken());
        if (advanceValue > 0) {
          await recordPayment(invoice.id, advanceValue, advanceMethod, getAccessToken());
        }
        showToast("Order created and invoice generated.");
        router.push(`/dashboard/invoices/${invoice.id}`);
      } catch (invoiceError) {
        // The order itself was created successfully — don't strand it. Send staff to the order
        // page, where the existing manual "Create Invoice" action still works as a fallback.
        showToast(
          invoiceError instanceof ApiError
            ? `Order created, but invoice generation failed: ${invoiceError.message}`
            : "Order created, but the invoice couldn't be generated. Create it from the order page.",
          "error",
        );
        router.push(`/dashboard/orders/${order.id}`);
      }
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Order</h1>
        <Link href="/dashboard/orders" className="text-sm text-foreground/70 hover:text-foreground">
          Back to orders
        </Link>
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <form onSubmit={handleSubmit} className="flex w-full max-w-2xl flex-col gap-6 rounded-lg border border-border bg-surface p-6">
          {/* Once a customer is selected, the Customer field below is the single source of truth
              for who the order is for — Mobile Number's only job was helping to find them, so it
              hides rather than repeating the same name/phone a second time right next to it. */}
          {!customer && (
            <div className="relative flex flex-col gap-1">
              <label htmlFor="mobileNumber" className="text-sm font-medium">
                Mobile Number
              </label>
              <input
                id="mobileNumber"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Search by mobile number…"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              />
              {debouncedMobileNumber && mobileMatches.length > 0 && (
                <ul className="max-h-48 overflow-y-auto rounded-md border border-border bg-background shadow-sm">
                  {mobileMatches.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => selectCustomer(c)} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface">
                        {c.fullName} ({c.phoneNumber})
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {debouncedMobileNumber && mobileMatches.length === 0 && digitsOnly(debouncedMobileNumber).length >= 7 && (
                <button type="button" onClick={() => startAddingNewCustomer(debouncedMobileNumber, "phone")} className="self-start text-sm text-foreground/70 hover:text-foreground">
                  {`+ Add new customer with mobile ${debouncedMobileNumber}`}
                </button>
              )}
            </div>
          )}

          <SearchPicker
            id="customer"
            label="Customer"
            selectedLabel={customer ? `${customer.fullName} (${customer.phoneNumber})` : null}
            onSelect={selectCustomer}
            onClear={clearCustomer}
            search={searchCustomers}
            getId={(c) => c.id}
            getLabel={(c) => `${c.fullName} (${c.phoneNumber})`}
            placeholder="Search customers…"
            onCreateNew={(query) => startAddingNewCustomer(query, "name")}
            createNewLabel={(query) => `+ Add "${query}" as a new customer`}
          />

          <OrderItemsEditor onChange={setItemRows} activeItemId={activeMeasurementItemId} onItemClick={handleItemClick} />

          <div className="flex flex-col gap-1">
            <label htmlFor="dueAtUtc" className="text-sm font-medium">
              Due date
            </label>
            <input
              id="dueAtUtc"
              type="date"
              value={dueAtUtc}
              onChange={(e) => setDueAtUtc(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
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
          />

          {formError && (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create order"}
            </Button>
          </div>
        </form>

        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
            <span className="text-sm font-medium">Order summary</span>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">Total</span>
              <span className="font-medium">{orderTotal.toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="advanceAmount" className="text-sm font-medium">
                Advance received (optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input id="advanceAmount" type="number" min="0" step="0.01" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="0.00" className={fieldClassName} />
                <select value={advanceMethod} onChange={(e) => setAdvanceMethod(e.target.value as PaymentMethod)} className={fieldClassName}>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-foreground/70">Balance</span>
              <span className="font-medium">{orderBalance.toFixed(2)}</span>
            </div>
          </div>

          {isAddingNewCustomer && (
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
              <span className="text-sm font-medium">New customer</span>
              <Input id="newCustomerName" label="Full name" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} error={newCustomerFieldErrors.fullname} />
              <Input id="newCustomerPhone" label="Phone number" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} error={newCustomerFieldErrors.phonenumber} />
              <Input id="newCustomerEmail" label="Email (optional)" type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} error={newCustomerFieldErrors.email} />
              {newCustomerError && (
                <p role="alert" className="text-sm text-red-600">
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

          {activeMeasurementItem && (
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Measurement — {activeMeasurementItem.garmentType}</span>
                <button type="button" onClick={() => setActiveMeasurementItemId(null)} className="text-sm text-foreground/70 hover:text-foreground">
                  Close
                </button>
              </div>
              {!customer ? (
                <p className="text-sm text-foreground/70">Select a customer to view or add their measurements.</p>
              ) : isLoadingMeasurements ? (
                <p className="text-sm text-foreground/70">Loading measurements…</p>
              ) : (
                <MeasurementForm
                  key={`${activeMeasurementItem.id}-${activeMeasurementItem.garmentType}-${activeMeasurement?.id ?? "new"}`}
                  garmentType={activeMeasurementItem.garmentType}
                  initialValues={activeMeasurement?.values}
                  submitLabel="Save measurement"
                  onSubmit={async (garmentType, values) => {
                    const saved = activeMeasurement
                      ? await updateMeasurementValues(activeMeasurement.id, values, getAccessToken())
                      : await createMeasurement(customer.id, garmentType, values, getAccessToken());
                    setCustomerMeasurements((prev) => [...prev.filter((m) => m.id !== saved.id), saved]);
                    showToast("Measurement saved.");
                    // Deliberately stays open after saving — closing would hide the grid the
                    // moment it's saved, when staying open lets staff keep reviewing/adjusting it.
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
