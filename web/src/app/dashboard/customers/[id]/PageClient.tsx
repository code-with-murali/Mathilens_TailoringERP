"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerForm } from "../CustomerForm";
import { MeasurementsSection } from "./MeasurementsSection";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { useRouteId } from "@/lib/use-route-id";
import { ApiError } from "@/lib/api-client";
import { getCustomer, updateCustomer, type Customer, type CustomerInput } from "@/lib/api/customers";

export default function EditCustomerPage() {
  const customerId = useRouteId();
  const router = useRouter();
  const { showToast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getCustomer(customerId, getAccessToken())
      .then((data) => {
        if (!cancelled) {
          setCustomer(data);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setLoadError(error instanceof ApiError ? error.message : "Unable to load this customer.");
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  async function handleUpdate(input: CustomerInput) {
    await updateCustomer(customerId, input, getAccessToken());
    showToast("Customer updated.");
    router.push("/dashboard/customers");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Not "Edit Customer" any more: editing happens in a dialog on the list, and this page is
            what the list links to for measurements. Their details are still here and still
            editable — it is just no longer the only way in. */}
        <h1 className="text-2xl font-semibold">{customer?.fullName ?? "Customer"}</h1>
        <Link href="/dashboard/customers" className="text-sm text-foreground/70 hover:text-foreground">
          Back to customers
        </Link>
      </div>

      {loadError ? (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      ) : !customer ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : (
        <div className="flex max-w-2xl flex-col gap-6">
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <CustomerForm
              customerId={customerId}
              initialValues={{
                fullName: customer.fullName,
                phoneNumber: customer.phoneNumber,
                email: customer.email,
                address: customer.address,
                notes: customer.notes,
                gender: customer.gender,
                religion: customer.religion,
                dateOfBirth: customer.dateOfBirth,
                weddingDate: customer.weddingDate,
              }}
              onSubmit={handleUpdate}
              onCancel={() => router.push("/dashboard/customers")}
            />
          </div>

          <MeasurementsSection customerId={customerId} />
        </div>
      )}
    </div>
  );
}
