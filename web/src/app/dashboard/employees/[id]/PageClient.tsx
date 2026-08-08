"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EmployeeForm } from "../EmployeeForm";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getEmployee, updateEmployee, type Employee, type EmployeeInput } from "@/lib/api/employees";

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getEmployee(params.id, getAccessToken())
      .then((data) => {
        if (!cancelled) {
          setEmployee(data);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setLoadError(error instanceof ApiError ? error.message : "Unable to load this employee.");
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleUpdate(input: EmployeeInput) {
    await updateEmployee(params.id, input, getAccessToken());
    showToast("Employee updated.");
    router.push("/dashboard/employees");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Employee</h1>
        <Link href="/dashboard/employees" className="text-sm text-foreground/70 hover:text-foreground">
          Back to employees
        </Link>
      </div>

      {loadError ? (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      ) : !employee ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : (
        <div className="max-w-xl rounded-lg border border-border bg-surface p-6">
          <EmployeeForm
            initialValues={{
              fullName: employee.fullName,
              jobTitle: employee.jobTitle,
              phoneNumber: employee.phoneNumber,
              email: employee.email,
            }}
            submitLabel="Save changes"
            onSubmit={handleUpdate}
          />
        </div>
      )}
    </div>
  );
}
