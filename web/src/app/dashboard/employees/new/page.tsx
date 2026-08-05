"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmployeeForm } from "../EmployeeForm";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { createEmployee, type EmployeeInput } from "@/lib/api/employees";

export default function NewEmployeePage() {
  const router = useRouter();
  const { showToast } = useToast();

  async function handleCreate(input: EmployeeInput) {
    await createEmployee(input, getAccessToken());
    showToast("Employee created.");
    router.push("/dashboard/employees");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Employee</h1>
        <Link href="/dashboard/employees" className="text-sm text-foreground/70 hover:text-foreground">
          Back to employees
        </Link>
      </div>
      <div className="max-w-xl rounded-lg border border-border bg-surface p-6">
        <EmployeeForm submitLabel="Create employee" onSubmit={handleCreate} />
      </div>
    </div>
  );
}
