"use client";

import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Blocking confirmation for destructive actions (00_MASTER_SPEC.md § 9.5/9.11). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        <p className="mb-6 text-sm text-foreground/70">{description}</p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isConfirming}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
