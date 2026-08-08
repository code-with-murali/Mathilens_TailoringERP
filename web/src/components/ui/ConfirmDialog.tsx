"use client";

import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  /** Text shown on the confirm button while isConfirming — defaults to matching confirmLabel's "-ing" destructive phrasing. */
  confirmingLabel?: string;
  /** "danger" (default) suits destructive actions like delete; non-destructive confirmations (e.g. generating an invoice) should pass "primary". */
  confirmVariant?: "danger" | "primary";
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Blocking confirmation for actions worth double-checking before they happen (00_MASTER_SPEC.md § 9.5/9.11) — destructive ones by default, but reusable for any consequential action via confirmVariant. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  confirmingLabel = "Deleting…",
  confirmVariant = "danger",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-[1px]" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        <p className="mb-6 text-sm text-foreground/70">{description}</p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isConfirming}>
            Cancel
          </Button>
          <Button type="button" variant={confirmVariant} onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? confirmingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
