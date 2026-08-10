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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Customer</h1>
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
        <div className="flex max-w-xl flex-col gap-6">
          <div className="rounded-lg border border-border bg-surface p-6">
            <CustomerForm
              initialValues={{
                fullName: customer.fullName,
                phoneNumber: customer.phoneNumber,
                email: customer.email,
                address: customer.address,
                notes: customer.notes,
              }}
              submitLabel="Save changes"
              onSubmit={handleUpdate}
            />
          </div>

          <MeasurementsSection customerId={customerId} />
        </div>
      )}
    </div>
  );
}
