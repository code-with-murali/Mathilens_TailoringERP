"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { listSettings, upsertSetting, deleteSetting, type Setting } from "@/lib/api/settings";

const PAGE_SIZE = 20;

type FormState = { mode: "create" } | { mode: "edit"; setting: Setting } | null;

export default function SettingsPage() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(null);
  const [formKey, setFormKey] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Setting | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { items, meta } = await listSettings(page, PAGE_SIZE, getAccessToken());
      setSettings(items);
      setMeta(meta);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load settings.");
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
    setFormKey("");
    setFormValue("");
    setFormError(null);
  }

  function openEditForm(setting: Setting) {
    setFormState({ mode: "edit", setting });
    setFormKey(setting.key);
    setFormValue(setting.value);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!formKey.trim()) {
      setFormError("Enter a key.");
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertSetting(formKey, formValue, getAccessToken());
      showToast(formState?.mode === "create" ? "Setting created." : "Setting updated.");
      setFormState(null);
      await load();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to save this setting.");
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
      await deleteSetting(pendingDelete.key, getAccessToken());
      showToast("Setting deleted.");
      setPendingDelete(null);
      await load();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Unable to delete this setting.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        {formState === null && (
          <Button type="button" onClick={openCreateForm}>
            New Setting
          </Button>
        )}
      </div>

      {formState && (
        <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface p-6">
          <Input
            id="settingKey"
            label="Key"
            value={formKey}
            onChange={(e) => setFormKey(e.target.value)}
            disabled={formState.mode === "edit"}
          />
          <Textarea id="settingValue" label="Value" rows={3} value={formValue} onChange={(e) => setFormValue(e.target.value)} />
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
              {isSubmitting ? "Saving…" : formState.mode === "create" ? "Create setting" : "Save changes"}
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
      ) : settings.length === 0 ? (
        <p className="text-sm text-foreground/70">No settings configured yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono">{setting.key}</td>
                  <td className="max-w-md truncate px-4 py-3">{setting.value}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => openEditForm(setting)} className="text-foreground/70 hover:text-foreground">
                        Edit
                      </button>
                      <button type="button" onClick={() => setPendingDelete(setting)} className="text-red-600 hover:text-red-700">
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
        title="Delete setting"
        description={pendingDelete ? `Are you sure you want to delete "${pendingDelete.key}"? This cannot be undone.` : ""}
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
