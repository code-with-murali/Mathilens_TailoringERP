"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImportExportButtons } from "@/components/ui/ImportExportButtons";
import { useToast } from "@/components/ui/ToastProvider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { searchCustomers, deleteCustomer, RELIGIONS, type Customer, type Religion } from "@/lib/api/customers";

const filterClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

export default function CustomersPage() {
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [religion, setReligion] = useState<Religion | "">("");
  // Religion is a niche, occasion-wear filter, not something staff narrow by every day, so it
  // sits behind a disclosure rather than taking permanent space next to the search box.
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, meta } = await searchCustomers(debouncedSearch, page, pageSize, getAccessToken(), religion || null);
      setCustomers(items);
      setMeta(meta);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load customers.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, religion, page, pageSize]);

  useEffect(() => {
    // The standard fetch-on-dependency-change pattern: loadCustomers' setState calls all
    // happen after an `await`, in a genuine async continuation, not synchronously within this
    // effect body — unlike the auth-guard/hydration cases elsewhere in this app, there's no
    // SSR snapshot for the compiler to race against here (this whole page is client-only).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCustomers();
  }, [loadCustomers]);

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
      await deleteCustomer(pendingDelete.id, getAccessToken());
      showToast("Customer deleted.");
      setPendingDelete(null);
      await loadCustomers();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Unable to delete this customer.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <div className="flex items-start gap-2">
          <ImportExportButtons resource="customers" label="customers" onImported={loadCustomers} />
          <Link href="/dashboard/customers/new">
            <Button type="button">New Customer</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[16rem] flex-1">
            <Input
              id="search"
              label="Search by name or phone"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search customers…"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsAdvancedOpen((open) => !open)}
            aria-expanded={isAdvancedOpen}
            aria-controls="advancedFilters"
            className="rounded-md border border-border px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            {/* The count keeps a collapsed-but-active filter from silently narrowing the list. */}
            Advanced filter{religion ? " (1)" : ""}
          </button>
        </div>

        {isAdvancedOpen && (
          <div id="advancedFilters" className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="religionFilter" className="text-sm font-medium">
                Religion
              </label>
              <select
                id="religionFilter"
                value={religion}
                onChange={(e) => {
                  setReligion(e.target.value as Religion | "");
                  // A narrower list can be shorter than the page you're on.
                  setPage(1);
                }}
                className={filterClassName}
              >
                <option value="">All religions</option>
                {RELIGIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {religion && (
              <button
                type="button"
                onClick={() => {
                  setReligion("");
                  setPage(1);
                }}
                className="py-2 text-sm text-foreground/70 hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : loadError ? (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      ) : customers.length === 0 ? (
        <p className="text-sm text-foreground/70">No customers found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{customer.fullName}</td>
                  <td className="px-4 py-3">{customer.phoneNumber}</td>
                  <td className="px-4 py-3">{customer.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link href={`/dashboard/customers/${customer.id}`} className="text-foreground/70 hover:text-foreground">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(customer)}
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

      {meta && <Pagination
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete customer"
        description={pendingDelete ? `Are you sure you want to delete ${pendingDelete.fullName}? This cannot be undone.` : ""}
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
