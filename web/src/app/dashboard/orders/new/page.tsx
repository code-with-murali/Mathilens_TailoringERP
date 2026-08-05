"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SearchPicker } from "@/components/ui/SearchPicker";
import { OrderItemsEditor, type ItemRow } from "@/components/orders/OrderItemsEditor";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { searchCustomers, type Customer } from "@/lib/api/customers";
import { searchEmployees, type Employee } from "@/lib/api/employees";
import { createOrder, type CreateOrderItemInput } from "@/lib/api/orders";

export default function NewOrderPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [dueAtUtc, setDueAtUtc] = useState("");
  const [itemRows, setItemRows] = useState<ItemRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    try {
      const order = await createOrder(
        { customerId: customer.id, employeeId: employee?.id ?? null, dueAtUtc: new Date(dueAtUtc).toISOString(), items },
        getAccessToken(),
      );
      showToast("Order created.");
      router.push(`/dashboard/orders/${order.id}`);
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

      <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6 rounded-lg border border-border bg-surface p-6">
        <SearchPicker
          id="customer"
          label="Customer"
          selectedLabel={customer ? `${customer.fullName} (${customer.phoneNumber})` : null}
          onSelect={setCustomer}
          onClear={() => setCustomer(null)}
          search={searchCustomers}
          getId={(c) => c.id}
          getLabel={(c) => `${c.fullName} (${c.phoneNumber})`}
          placeholder="Search customers…"
        />

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

        <OrderItemsEditor onChange={setItemRows} />

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
    </div>
  );
}
