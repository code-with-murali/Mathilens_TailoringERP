"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImportExportButtons } from "@/components/ui/ImportExportButtons";
import { useToast } from "@/components/ui/ToastProvider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { searchEmployees, deleteEmployee, type Employee } from "@/lib/api/employees";

const PAGE_SIZE = 20;

export default function EmployeesPage() {
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, meta } = await searchEmployees(debouncedSearch, page, PAGE_SIZE, getAccessToken());
      setEmployees(items);
      setMeta(meta);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load employees.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-dependency-change pattern is intentionally not
    // restructured around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEmployees();
  }, [loadEmployees]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteEmployee(pendingDelete.id, getAccessToken());
      showToast("Employee deleted.");
      setPendingDelete(null);
      await loadEmployees();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Unable to delete this employee.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <div className="flex items-start gap-2">
          <ImportExportButtons resource="employees" label="employees" onImported={loadEmployees} />
          <Link href="/dashboard/employees/new">
            <Button type="button">New Employee</Button>
          </Link>
        </div>
      </div>

      <Input
        id="search"
        label="Search by name or phone"
        value={searchInput}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search employees…"
      />

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : loadError ? (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      ) : employees.length === 0 ? (
        <p className="text-sm text-foreground/70">No employees found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Job Title</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{employee.fullName}</td>
                  <td className="px-4 py-3">{employee.jobTitle ?? "—"}</td>
                  <td className="px-4 py-3">{employee.phoneNumber ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link href={`/dashboard/employees/${employee.id}`} className="text-foreground/70 hover:text-foreground">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(employee)}
                        className="text-danger hover:text-danger-hover"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete employee"
        description={pendingDelete ? `Are you sure you want to delete ${pendingDelete.fullName}? This cannot be undone.` : ""}
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
