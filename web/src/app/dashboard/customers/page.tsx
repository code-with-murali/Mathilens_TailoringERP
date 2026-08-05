"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { searchCustomers, deleteCustomer, type Customer } from "@/lib/api/customers";

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);
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
      const { items, meta } = await searchCustomers(debouncedSearch, page, PAGE_SIZE, getAccessToken());
      setCustomers(items);
      setMeta(meta);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load customers.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Link href="/dashboard/customers/new">
          <Button type="button">New Customer</Button>
        </Link>
      </div>

      <Input
        id="search"
        label="Search by name or phone"
        value={searchInput}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search customers…"
      />

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : loadError ? (
        <p role="alert" className="text-sm text-red-600">
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
                        className="text-red-600 hover:text-red-700"
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
        title="Delete customer"
        description={pendingDelete ? `Are you sure you want to delete ${pendingDelete.fullName}? This cannot be undone.` : ""}
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
