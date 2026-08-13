"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/Pagination";
import { ImportExportButtons } from "@/components/ui/ImportExportButtons";
import { useToast } from "@/components/ui/ToastProvider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { searchEmployees, retireEmployee, EMPLOYMENT_TYPE_LABELS, type Employee } from "@/lib/api/employees";

/** yyyy-MM-dd off the local calendar — a last working day is a day in the shop, not a UTC instant. */
function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}


export default function EmployeesPage() {
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Employees are retired, never deleted: their order history has to stay readable, and their
  // code and phone stay theirs so an old job card still resolves to the right person.
  const [pendingRetire, setPendingRetire] = useState<Employee | null>(null);
  const [lastWorkingDate, setLastWorkingDate] = useState(todayIsoDate);
  const [isRetiring, setIsRetiring] = useState(false);

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, meta } = await searchEmployees(debouncedSearch, page, pageSize, getAccessToken());
      setEmployees(items);
      setMeta(meta);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load employees.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, pageSize]);

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

  async function handleConfirmRetire() {
    if (!pendingRetire) {
      return;
    }

    setIsRetiring(true);
    try {
      await retireEmployee(pendingRetire.id, lastWorkingDate, getAccessToken());
      showToast(`${pendingRetire.fullName} retired.`);
      setPendingRetire(null);
      await loadEmployees();
    } catch (error) {
      // The server refuses a date before their joining date — its message says so, show it as-is.
      showToast(error instanceof ApiError ? error.message : "Unable to retire this employee.", "error");
    } finally {
      setIsRetiring(false);
    }
  }

  async function handleReturnToWork(employee: Employee) {
    try {
      await retireEmployee(employee.id, null, getAccessToken());
      showToast(`${employee.fullName} is back on the active roster.`);
      await loadEmployees();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Unable to update this employee.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <div className="flex items-start gap-2">
          <ImportExportButtons resource="employees" label="employees" onImported={loadEmployees} />
          <Link href="/dashboard/employees/new">
            {/* Label is just "New" — the page heading above already says Employees. The aria-label
                keeps it unambiguous for a screen reader reading controls out of context. */}
            <Button type="button" aria-label="New employee">New</Button>
          </Link>
        </div>
      </div>

      <Input
        id="search"
        label="Search by name, code or phone"
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
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Job Title</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono">{employee.employeeCode}</td>
                  <td className="px-4 py-3">{employee.fullName}</td>
                  <td className="px-4 py-3">{employee.jobTitle ?? "—"}</td>
                  <td className="px-4 py-3">{employee.phoneNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{EMPLOYMENT_TYPE_LABELS[employee.employmentType]}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(`${employee.joiningDate}T00:00:00Z`).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {employee.isActive ? (
                      <span className="text-success">Active</span>
                    ) : (
                      <span className="text-foreground/60">
                        Retired {new Date(`${employee.lastWorkingDate}T00:00:00Z`).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link href={`/dashboard/employee/${employee.id}`} className="text-foreground/70 hover:text-foreground">
                        View
                      </Link>
                      <Link href={`/dashboard/employees/${employee.id}`} className="text-foreground/70 hover:text-foreground">
                        Edit
                      </Link>
                      {employee.isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingRetire(employee);
                            setLastWorkingDate(todayIsoDate());
                          }}
                          className="text-foreground/70 hover:text-foreground"
                        >
                          Retire
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReturnToWork(employee)}
                          className="text-foreground/70 hover:text-foreground"
                        >
                          Return to work
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && <Pagination
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />}

      {/* Retiring needs a date, which a plain confirm dialog cannot ask for. */}
      {pendingRetire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="retireTitle" className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
            <h2 id="retireTitle" className="text-lg font-semibold">
              Retire {pendingRetire.fullName}
            </h2>
            <p className="mt-1 text-sm text-foreground/70">
              Records their last working day. Their record and order history stay — this only takes them off the list
              for new work, and it can be undone.
            </p>
            <div className="mt-4 flex flex-col gap-1">
              <label htmlFor="retireDate" className="text-sm font-medium">
                Last working date
              </label>
              <input
                id="retireDate"
                type="date"
                value={lastWorkingDate}
                min={pendingRetire.joiningDate}
                onChange={(e) => setLastWorkingDate(e.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingRetire(null)}
                className="text-sm text-foreground/70 hover:text-foreground"
              >
                Cancel
              </button>
              <Button type="button" onClick={handleConfirmRetire} disabled={isRetiring}>
                {isRetiring ? "Saving…" : "Retire"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
