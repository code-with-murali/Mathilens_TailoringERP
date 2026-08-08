"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { searchClothPrices, createClothPrice, updateClothPrice, deleteClothPrice, type ClothPrice } from "@/lib/api/clothPrices";

const PAGE_SIZE = 20;

type FormState = { mode: "create" } | { mode: "edit"; clothPrice: ClothPrice } | null;

export default function PriceDetailPage() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [clothPrices, setClothPrices] = useState<ClothPrice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(null);
  const [formClothCode, setFormClothCode] = useState("");
  const [formClothName, setFormClothName] = useState("");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formSellingPrice, setFormSellingPrice] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ClothPrice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, meta } = await searchClothPrices("", page, PAGE_SIZE, getAccessToken());
      setClothPrices(items);
      setMeta(meta);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load price details.");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-dependency-change pattern is intentionally not
    // restructured around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function openCreateForm() {
    setFormState({ mode: "create" });
    setFormClothCode("");
    setFormClothName("");
    setFormCostPrice("");
    setFormSellingPrice("");
    setFormError(null);
  }

  function openEditForm(clothPrice: ClothPrice) {
    setFormState({ mode: "edit", clothPrice });
    setFormClothCode(clothPrice.clothCode);
    setFormClothName(clothPrice.clothName);
    setFormCostPrice(String(clothPrice.costPrice));
    setFormSellingPrice(String(clothPrice.sellingPrice));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!formClothCode.trim()) {
      setFormError("Enter a cloth code.");
      return;
    }
    if (!formClothName.trim()) {
      setFormError("Enter a cloth name.");
      return;
    }
    const costPrice = Number(formCostPrice);
    if (!Number.isFinite(costPrice) || costPrice <= 0) {
      setFormError("Enter a cost price greater than zero.");
      return;
    }
    const sellingPrice = Number(formSellingPrice);
    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      setFormError("Enter a selling price greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      const input = { clothCode: formClothCode, clothName: formClothName, costPrice, sellingPrice };
      if (formState?.mode === "edit") {
        await updateClothPrice(formState.clothPrice.id, input, getAccessToken());
      } else {
        await createClothPrice(input, getAccessToken());
      }
      showToast(formState?.mode === "create" ? "Price added." : "Price updated.");
      setFormState(null);
      await load();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to save this price.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteClothPrice(pendingDelete.id, getAccessToken());
      showToast("Price deleted.");
      setPendingDelete(null);
      await load();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Unable to delete this price.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Price Detail</h1>
        {formState === null && (
          <Button type="button" onClick={openCreateForm}>
            New Price
          </Button>
        )}
      </div>

      {formState && (
        <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4 rounded-lg border border-border bg-surface p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Input id="clothCode" label="Cloth code" value={formClothCode} onChange={(e) => setFormClothCode(e.target.value)} />
            <Input id="clothName" label="Cloth name" value={formClothName} onChange={(e) => setFormClothName(e.target.value)} />
            <Input id="costPrice" label="Cost price" type="number" min="0" step="0.01" value={formCostPrice} onChange={(e) => setFormCostPrice(e.target.value)} />
            <Input id="sellingPrice" label="Selling price" type="number" min="0" step="0.01" value={formSellingPrice} onChange={(e) => setFormSellingPrice(e.target.value)} />
          </div>
          {formError && (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setFormState(null)} className="text-sm text-foreground/70 hover:text-foreground">
              Cancel
            </button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : formState.mode === "create" ? "Add price" : "Save changes"}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : loadError ? (
        <p role="alert" className="text-sm text-red-600">
          {loadError}
        </p>
      ) : clothPrices.length === 0 ? (
        <p className="text-sm text-foreground/70">No prices configured yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium">Cloth code</th>
                <th className="px-4 py-3 font-medium">Cloth name</th>
                <th className="px-4 py-3 font-medium">Cost price</th>
                <th className="px-4 py-3 font-medium">Selling price</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {clothPrices.map((clothPrice) => (
                <tr key={clothPrice.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono">{clothPrice.clothCode}</td>
                  <td className="px-4 py-3">{clothPrice.clothName}</td>
                  <td className="px-4 py-3">{clothPrice.costPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">{clothPrice.sellingPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => openEditForm(clothPrice)} className="text-foreground/70 hover:text-foreground">
                        Edit
                      </button>
                      <button type="button" onClick={() => setPendingDelete(clothPrice)} className="text-red-600 hover:text-red-700">
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
        title="Delete price"
        description={pendingDelete ? `Are you sure you want to delete the price for "${pendingDelete.clothCode}"? This cannot be undone.` : ""}
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
