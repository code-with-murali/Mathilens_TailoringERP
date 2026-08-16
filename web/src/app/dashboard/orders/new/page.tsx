"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneNumberInput, cleanPhoneNumberInput } from "@/components/ui/PhoneNumberInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  OrderItemsEditor,
  clothAmount,
  rowTotal,
  type BusinessMode,
  type ItemRow,
} from "@/components/orders/OrderItemsEditor";
import { InvoicePrintModal } from "@/components/orders/InvoicePrintModal";
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
import { getShopCalendar, nextOpenDay, toIsoDate, WEEKDAYS } from "@/lib/api/shop-calendar";
import { getTailoringRates, type TailoringRates } from "@/lib/api/tailoring-rates";
import { getGarments, type Garment } from "@/lib/api/garments";
import { createInvoice, recordPayment, PAYMENT_METHODS, type PaymentMethod, type Invoice } from "@/lib/api/billing";
import { getInvoiceSettings, taxAmountFor, DEFAULT_INVOICE_SETTINGS } from "@/lib/api/invoice-settings";
import "./theme.css";

const fieldClassName = "rounded-md border border-border bg-surface px-3 py-1 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** The server rejects anything above 100 (Shared/Constants/PaginationDefaults.cs). */
const EMPLOYEE_PAGE_SIZE = 100;
/** 500 staff is far past any tailoring shop; the cap only exists so a bad meta can't loop forever. */
const EMPLOYEE_PAGE_LIMIT = 5;

/** "26-08-2026" from "2026-08-26". */
function toDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return year && month && day ? `${day}-${month}-${year}` : "";
}

/** "2026-08-26" from a displayed "26-08-2026", or "" if it is not a real date. */
function fromDisplayDate(text: string): string {
  const digits = text.replace(/\D/g, "");
  if (digits.length !== 8) {
    return "";
  }
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  // Round-tripped through Date because the constructor rolls 31-02 forward into March rather than
  // refusing it — comparing the parts back is what catches a day that does not exist.
  const candidate = new Date(year, month - 1, day);
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) {
    return "";
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** The weekday of the yyyy-MM-dd a date input holds, or null while the field is empty or half-typed. */
function weekdayOf(isoDate: string): (typeof WEEKDAYS)[number] | null {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return WEEKDAYS[new Date(year, month - 1, day).getDay()];
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [dueAtUtc, setDueAtUtc] = useState("");
  /** What the DD-MM-YYYY field shows — its own state so a half-typed date survives keystrokes. */
  const [dueDateText, setDueDateText] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [itemRows, setItemRows] = useState<ItemRow[]>([]);
  // Chosen per order: the same owner may stitch a customer's own cloth one minute and sell a
  // shirt length the next. Tailoring-only is the default because it is the simpler form, and a
  // shop that never sells cloth should never see a fabric field.
  const [businessMode, setBusinessMode] = useState<BusinessMode>("tailoring");
  const [tailoringRates, setTailoringRates] = useState<TailoringRates>({});
  const [garments, setGarments] = useState<Garment[]>([]);
  // What an item row may be for: on the shop's garment list and carrying a stitching price. A
  // garment nobody has priced would put a zero on the bill, so it is not offered at all.
  //
  // Memoised because the item editor watches this list in an effect — a fresh array on every render
  // would re-run that effect on every keystroke in the form.
  const offerableGarments = useMemo(
    () => garments.filter((garment) => tailoringRates[garment.name] !== undefined),
    [garments, tailoringRates],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [activeMeasurementItemId, setActiveMeasurementItemId] = useState<number | null>(null);
  const [customerMeasurements, setCustomerMeasurements] = useState<Measurement[]>([]);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [measurementFormError, setMeasurementFormError] = useState<string | null>(null);
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false);
  // Which cell opened the Order Summary Preview — both the Order summary cell and the Schedule
  // cell open the same panel, and the one that was clicked is the one that gets highlighted.
  const [summarySource, setSummarySource] = useState<"summary" | "schedule" | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [showInvoiceConfirm, setShowInvoiceConfirm] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [autoPrintInvoice, setAutoPrintInvoice] = useState(false);

  const isOrderCreated = createdOrder !== null;
  const isViewingSummary = summarySource !== null;
  const collectionWeekday = weekdayOf(dueAtUtc);

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
  const scheduleRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Keeps the DD-MM-YYYY field in step with dates that arrive from somewhere other than typing
    // — the pre-fill, the picker, New order's reset. Left alone when it already spells the same
    // date, so a cursor mid-entry is never yanked.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDueDateText((current) => (fromDisplayDate(current) === dueAtUtc ? current : toDisplayDate(dueAtUtc)));
  }, [dueAtUtc]);

  useEffect(() => {
    if (!activeMeasurementItem && !isViewingSummary) {
      return;
    }

    // Clicking an item card opens the measurement panel, clicking Order summary opens the invoice
    // preview, and so does the Schedule cell next to it — clicking anywhere else (Customer field,
    // blank space, etc.) should close whichever one is open, same as their own Close button — but
    // a click inside the panel, or inside either cell that opens it, must not count as "elsewhere".
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        itemsAreaRef.current?.contains(target) ||
        measurementBlockRef.current?.contains(target) ||
        orderSummaryRef.current?.contains(target) ||
        scheduleRef.current?.contains(target)
      ) {
        return;
      }
      setActiveMeasurementItemId(null);
      setSummarySource(null);
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

  // Cloth plus stitching, row by row. Tolerant of blank input so the total moves as the owner
  // types, unlike handleCreateOrder's strict per-item validation at submit time.
  const itemRowTotal = (row: ItemRow) => rowTotal(row, businessMode);
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
    // Carried over from the search box, which accepts a name too — so it is cleaned to the same
    // rule the field enforces rather than dropped in raw.
    setNewCustomerPhone(field === "phone" ? cleanPhoneNumberInput(query) ?? "" : "");
    setNewCustomerEmail("");
    setNewCustomerError(null);
    setNewCustomerFieldErrors({});
    setIsAddingNewCustomer(true);
    setIsMobileDropdownOpen(false);
    setActiveMeasurementItemId(null);
    setSummarySource(null);
  }

  function handleItemClick(row: ItemRow) {
    setActiveMeasurementItemId(row.id);
    setIsAddingNewCustomer(false);
    setSummarySource(null);
  }

  function handleOpenSummary(source: "summary" | "schedule") {
    setSummarySource(source);
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
    // Pre-fills Collection date from the shop's configured turnaround (Settings › Order Duration)
    // — different shops commit to different lead times, so this isn't hardcoded — then rolls it
    // forward off any day the shop is shut (Settings › Working Days). Add five days on a Tuesday
    // and the answer used to be Sunday; now it is the Monday after.
    //
    // Silently does nothing if the turnaround was never configured; the functional update leaves a
    // value the user already typed untouched, in case this resolves after they started the form.
    Promise.all([
      getSetting(DEFAULT_ORDER_DUE_DATE_DAYS_KEY, getAccessToken()),
      // Never rejects — an unconfigured shop calendar falls back to "closed Sundays".
      getShopCalendar(getAccessToken()),
    ])
      .then(([setting, calendar]) => {
        const days = Number(setting.value);
        if (!Number.isFinite(days) || days <= 0) {
          return;
        }
        const due = new Date();
        due.setDate(due.getDate() + days);
        // toIsoDate off the local calendar, not toISOString: a due date computed late in the
        // evening east of UTC would otherwise be written down as the day before.
        const isoDate = nextOpenDay(toIsoDate(due), calendar);
        setDueAtUtc((current) => current || isoDate);
      })
      .catch(() => {
        // No turnaround configured — Collection date stays blank, same as before this existed.
      });
  }, []);

  useEffect(() => {
    applyDefaultDueDate();
  }, [applyDefaultDueDate]);

  useEffect(() => {
    // The two lists that decide what an item row can be: the garments the shop stitches
    // (Settings › Garments) and what it charges for them (Settings › Tailoring Cost). Read once
    // here so no row has to ask for either. Neither rejects — a shop that has set no prices gets
    // no garments to pick, which is the message below rather than an error.
    let cancelled = false;
    Promise.all([getTailoringRates(getAccessToken()), getGarments(getAccessToken())]).then(([rates, list]) => {
      if (!cancelled) {
        setTailoringRates(rates);
        setGarments(list);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // The whole roster, once, for the Assigned employee list. 200 is far above any real shop's
    // headcount and still one request; a shop that outgrows it would need paging here anyway.
    let cancelled = false;

    // Paged rather than asked for in one go: the server caps pageSize at 100
    // (Shared/Constants/PaginationDefaults.cs) and rejects anything larger, so a single request
    // for the whole roster came back a validation error and left this list empty.
    async function loadEveryEmployee() {
      const all: Employee[] = [];
      for (let page = 1; page <= EMPLOYEE_PAGE_LIMIT; page++) {
        const { items, meta } = await searchEmployees("", page, EMPLOYEE_PAGE_SIZE, getAccessToken());
        all.push(...items);
        if (page >= meta.totalPages) {
          break;
        }
      }
      return all;
    }

    loadEveryEmployee()
      .then((items) => {
        if (!cancelled) {
          // Retired staff are dropped — assigning new work to someone who has left is never right.
          setEmployees(items.filter((candidate) => candidate.isActive));
        }
      })
      .catch(() => {
        // Leaves the list with only "Not assigned", which is a working order rather than a dead form.
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingEmployees(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
    setIsSubmitting(false);
    setCreatedOrder(null);
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
    setSummarySource(null);
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

    if (!customer) {
      showToast("Select a customer.", "error");
      return;
    }
    if (!dueAtUtc) {
      showToast("Set a collection date.", "error");
      return;
    }

    const sellsFabric = businessMode === "tailoringFabric";
    const items: CreateOrderItemInput[] = [];
    for (const row of itemRows) {
      // The form starts with blank placeholder rows so staff don't have to click "+ Add item" for
      // a typical order — untouched ones are silently skipped rather than blocking submission.
      const isUntouched =
        row.tailoringRate.trim() === "" && row.clothCode.trim() === "" && row.metres.trim() === "";
      if (isUntouched) {
        continue;
      }

      const quantity = Number(row.quantity);
      const tailoring = Number(row.tailoringRate);
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(tailoring) || tailoring <= 0) {
        showToast("Every item needs a quantity and a tailoring amount.", "error");
        return;
      }

      const usesShopFabric = sellsFabric && row.fabricSource === "internal";
      const metres = Number(row.metres);
      const ratePerMetre = Number(row.ratePerMetre);
      if (usesShopFabric && (!row.clothCode.trim() || !Number.isFinite(metres) || metres <= 0 || ratePerMetre <= 0)) {
        showToast("Shop fabric needs a cloth code, metres and a rate.", "error");
        return;
      }

      const fabric = usesShopFabric
        ? {
            fabricType: row.clothName.trim() === "" ? row.clothCode.trim() : row.clothName,
            source: "ShopSupplied" as const,
            color: null,
            quantity: metres,
            // Sent so the cloth comes off stock. The server resolves it against the price list; an
            // unmatched code is kept as typed and simply never reaches inventory.
            clothCode: row.clothCode.trim(),
            unit: "Metres" as const,
          }
        : null;

      // The order API prices an item as quantity x unitPrice and has nowhere to put a separate
      // cloth charge, so the cloth is folded into the unit price rather than being dropped. That
      // keeps the saved total equal to the total on screen and on the invoice — but it does mean
      // the split between cloth and stitching is not stored yet. Recording the two amounts
      // separately is the backend half of this feature.
      const unitPrice = tailoring + clothAmount(row, businessMode) / quantity;

      items.push({ garmentType: row.garmentType, quantity, unitPrice, fabric });
    }

    if (items.length === 0) {
      showToast("Add at least one garment item.", "error");
      return;
    }

    if (!Number.isFinite(advanceValue) || advanceValue < 0) {
      showToast("Advance amount must be zero or greater.", "error");
      return;
    }
    if (advanceValue > orderTotal) {
      showToast("Advance can't be more than the order total.", "error");
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
      showToast(error instanceof ApiError ? error.message : "Unable to reach the server. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenerateInvoice() {
    if (!createdOrder) {
      return;
    }
    setIsGeneratingInvoice(true);
    try {
      // Tax comes from the shop's rate in Invoice Settings, read at click time so this form and the
      // order screen's Generate Invoice always charge the same thing. Discount stays 0 — there is
      // no field for it, and a shop-wide default discount is not a thing a shop wants.
      const { taxRatePercent } = await getInvoiceSettings(getAccessToken()).catch(() => DEFAULT_INVOICE_SETTINGS);
      const invoice = await createInvoice(createdOrder.id, taxAmountFor(orderTotal, taxRatePercent), 0, getAccessToken());
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
      showToast(error instanceof ApiError ? error.message : "Unable to reach the server. Please try again.", "error");
    } finally {
      setIsGeneratingInvoice(false);
    }
  }

  return (
    <>
    <div className="orderNewSkin flex flex-col gap-3 print:hidden">
      <div className="flex items-center justify-between">
        {/* Shows the number the order was just given, which is what gets written on the job card.
            One step down from the 2xl the other pages use: this screen is a working form, not a
            page to be read, and the title only has to be found — every pixel it gives up is one
            the item list and measurement panel get back. */}
        <h1 className="text-xl font-semibold">
          {createdOrder
            ? `Order - ${createdOrder.orderNumber?.trim() || `#${createdOrder.id.slice(0, 8).toUpperCase()}`}`
            : "New Order"}
        </h1>
        <div className="flex items-center gap-4">
          {/* What this order is: stitching alone, or stitching plus the shop's own cloth. It sits
              in the title row because it changes what every item below asks for, and it is frozen
              once the order exists — the items are already priced by then. */}
          <div className="flex items-center gap-1">
            {(
              [
                { value: "tailoring", label: "Tailoring" },
                { value: "tailoringFabric", label: "Tailoring + fabric" },
              ] as const
            ).map((choice) => (
              <button
                key={choice.value}
                type="button"
                disabled={isOrderCreated}
                aria-pressed={businessMode === choice.value}
                onClick={() => setBusinessMode(choice.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  businessMode === choice.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground/70 hover:bg-surface-hover"
                }`}
              >
                {choice.label}
              </button>
            ))}
          </div>
          <Link href="/dashboard/orders" className="text-sm text-foreground/70 hover:text-foreground">
            Back to orders
          </Link>
        </div>
      </div>

      <form onSubmit={handleCreateOrder} className="flex flex-col gap-3">
        <div className="flex flex-col items-start gap-4 lg:h-[min(calc(100dvh-6rem),44rem)] lg:flex-row lg:items-stretch">
          {/* Column 1: who the order is for, and what's being made. */}
          <div className="flex w-full flex-1 flex-col gap-3 rounded-lg border border-border bg-surface p-4 lg:flex-[2]">
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
                <label className="text-sm font-medium">Customer Detail</label>
                {/* Same padding as the search input it replaces, so picking a customer swaps one
                    control for another of exactly the same height — otherwise the whole item list
                    below shifted down 8px the moment a customer was chosen. */}
                <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-1 text-sm">
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

            <div ref={itemsAreaRef} className="orderSection-items min-h-0 lg:flex-1 lg:overflow-y-auto">
              <OrderItemsEditor
                key={formKey}
                mode={businessMode}
                tailoringRates={tailoringRates}
                garments={offerableGarments}
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
          <div className="flex w-full flex-1 flex-col gap-4 lg:flex-[2]">
            {/* Always present (blank when no item is active) so Due date/Assigned employee and
                Order summary below stay pinned to the bottom, matching column 1's height, instead
                of jumping up to fill the gap. */}
            {/* Frozen height from the large breakpoint up: this box's three modes (measurement,
                new customer, summary preview) are all different heights, and letting it size to
                its content moved Order summary and Schedule below it every time one opened or
                closed. A fixed height keeps them still; anything taller scrolls inside the box.
                Left to size naturally on phones, where the whole column is stacked and a fixed
                empty box would just be dead space to scroll past.

                18rem starts from the measured fit — with the three garment items the form opens
                with, column 1 is 618px, which leaves 240px here once Order summary/Schedule, the
                action row and the two 12px gaps are taken out — and adds a row's worth on top, so
                two more measurement points are readable before scrolling. The item list stretches
                to meet it. */}
            <div
              ref={measurementBlockRef}
              className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border-2 border-foreground bg-surface p-4 lg:min-h-0"
            >
              {activeMeasurementItem && (
                <div className="orderSection-measure flex shrink-0 flex-col gap-3">
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
                    <div className="flex justify-center gap-3 border-y-2 border-foreground/15 py-0.5">
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
                <div className="orderSection-customer flex shrink-0 flex-col gap-2">
                  <span className="order-heading text-sm font-medium">New customer</span>
                  <Input id="newCustomerName" label="Full name" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} error={newCustomerFieldErrors.fullname} />
                  <PhoneNumberInput id="newCustomerPhone" value={newCustomerPhone} onChange={setNewCustomerPhone} error={newCustomerFieldErrors.phonenumber} />
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
                <div className="orderSection-summary flex shrink-0 flex-col gap-3">
                  <div className="flex items-center justify-between border-b-2 border-foreground/15 pb-3">
                    <span className="order-heading text-sm font-medium">Order Summary Preview</span>
                    <button type="button" onClick={() => setSummarySource(null)} className="text-sm text-foreground/70 hover:text-foreground">
                      Close
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-foreground/70">
                        <th className="py-1 font-medium">#</th>
                        <th className="py-1 font-medium">Garment</th>
                        <th className="py-1 text-right font-medium">Qty</th>
                        {businessMode === "tailoringFabric" && <th className="py-1 text-right font-medium">Cloth</th>}
                        <th className="py-1 text-right font-medium">Tailoring</th>
                        <th className="py-1 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemRows.map((row, index) => (
                        <tr key={row.id} className="border-b border-border/50">
                          <td className="py-1">{index + 1}</td>
                          <td className="py-1">{row.garmentType}</td>
                          <td className="py-1 text-right">{row.quantity || "0"}</td>
                          {businessMode === "tailoringFabric" && (
                            <td className="py-1 text-right">{clothAmount(row, businessMode).toFixed(2)}</td>
                          )}
                          <td className="py-1 text-right">{(Number(row.tailoringRate) || 0).toFixed(2)}</td>
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
              {/* Nothing fills this box when no item, new customer or summary is open. It is kept
                  in the layout rather than collapsed so Order summary and Schedule below stay
                  pinned to the bottom, level with column 1. */}
            </div>

            <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-stretch">
              {/* Column 2: money. Clicking the cell (outside the interactive advance fields) opens
                  the invoice preview above. */}
              <div
                ref={orderSummaryRef}
                onClick={() => handleOpenSummary("summary")}
                className={`orderSection-summary flex w-full flex-1 cursor-pointer flex-col gap-2 rounded-lg border p-4 ${
                  summarySource === "summary" ? "border-foreground bg-surface ring-1 ring-foreground" : "border-border bg-surface"
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

              {/* Column 3: scheduling. Clicking it opens the same Order Summary Preview as the cell
                  beside it — the two cells are one review step, and reaching the preview shouldn't
                  depend on which half of the row you happen to click. */}
              <div
                ref={scheduleRef}
                onClick={() => handleOpenSummary("schedule")}
                className={`orderSection-schedule flex w-full flex-1 cursor-pointer flex-col gap-3 rounded-lg border p-4 ${
                  summarySource === "schedule" ? "border-foreground bg-surface ring-1 ring-foreground" : "border-border bg-surface"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <label htmlFor="dueAtUtc" className="text-sm font-medium">
                    Collection date
                  </label>
                  {/* Weekday beside the field, on its line — it answers "is that a Sunday?" right
                      where the date is read, and sharing the row costs no height. The field is
                      given a fixed width and the day one of its own, wide enough for "Wednesday",
                      so neither moves as the date changes. The day sits just after the field
                      rather than out at the card's edge — it reads as part of the date, not as a
                      separate column.

                      A text field rather than a native date input, because a native one renders
                      in the browser's own locale — mm/dd/yyyy on these machines — and no attribute
                      changes that ("lang" is ignored). The real date input is still there, kept
                      rendered but invisible behind this one, purely so its picker can be opened. */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <input
                        id="dueAtUtc"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="DD-MM-YYYY"
                        value={dueDateText}
                        disabled={isOrderCreated}
                        // Read-only because the click that opens the picker also takes focus away
                        // from this field — a caret that can be placed but never typed into is
                        // worse than a field that plainly belongs to the picker. Enter and Space
                        // open it too, so this is still reachable without a mouse.
                        readOnly
                        onClick={() => datePickerRef.current?.showPicker?.()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            datePickerRef.current?.showPicker?.();
                          }
                        }}
                        className={`${fieldClassName} w-28 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
                      />
                      {/* Invisible, not hidden: showPicker throws on an element that is not being
                          rendered. Sized over the text field so the picker opens against it. */}
                      <input
                        ref={datePickerRef}
                        type="date"
                        tabIndex={-1}
                        aria-hidden="true"
                        value={dueAtUtc}
                        disabled={isOrderCreated}
                        onChange={(e) => setDueAtUtc(e.target.value)}
                        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                      />
                    </div>
                    {/* Rendered even when blank, so nothing shifts as the date is typed. */}
                    <span className="w-[5.5rem] shrink-0 truncate text-sm font-medium text-foreground/70">
                      {collectionWeekday?.label ?? ""}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="employee" className="text-sm font-medium">
                    Assigned employee (optional)
                  </label>
                  {/* The whole roster in one list rather than a search box: a shop has tens of
                      staff, not thousands, and picking from a list beats typing a name you have
                      to spell right. "Not assigned" is the first option and the default — most
                      orders are handed to a tailor later, not at the counter. */}
                  <select
                    id="employee"
                    value={employee?.id ?? ""}
                    disabled={isOrderCreated || isLoadingEmployees}
                    onChange={(e) => setEmployee(employees.find((candidate) => candidate.id === e.target.value) ?? null)}
                    className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <option value="">{isLoadingEmployees ? "Loading employees…" : "Not assigned"}</option>
                    {employees.map((option) => (
                      <option key={option.id} value={option.id}>
                        {/* Code alongside the name — a shop can hold two Kumars. */}
                        {option.fullName}
                        {option.employeeCode ? ` (${option.employeeCode})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="orderNotes" className="text-sm font-medium">
                    Notes (optional)
                  </label>
                  <textarea
                    id="orderNotes"
                    rows={1}
                    value={orderNotes}
                    disabled={isOrderCreated}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Anything the tailor should know…"
                    className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: order creation and (once created) invoice generation, as two explicit steps.
                Takes whatever height is left over so this column ends level with the item list
                beside it — the frozen panel above rounds to a fixed size, and without this the
                slack showed up as a gap under the buttons. */}
            {/* No error text lives in this card. A message appearing here changed its height, and
                with it the height of everything aligned to it — order failures are announced by a
                toast at the page's bottom-right instead, where nothing has to move to make room. */}
            <div className="flex w-full shrink-0 flex-col justify-center gap-3 rounded-lg border border-border bg-surface p-4">
              {/* Wraps — four buttons in a nowrap row have a min-content width of 334px, which no
                  amount of shrinking elsewhere could fit on a 320px phone. That was the page's
                  sideways scroll, not anything in the item list. */}
              <div className="flex flex-wrap items-center justify-center gap-3">
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
