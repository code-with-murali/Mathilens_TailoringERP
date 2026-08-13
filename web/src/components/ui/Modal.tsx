"use client";

import { useEffect, type ReactNode } from "react";

/**
 * A dialog for a form, as opposed to <see cref="ConfirmDialog"/>'s single question.
 *
 * Sized wider and scrollable inside itself, because the forms it holds are taller than a phone: the
 * dialog scrolls, never the page behind it, which is what stops a half-filled form losing its place
 * when the keyboard opens on a tablet.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  // Escape closes it, and the page behind stops scrolling while it is open — otherwise a flick on a
  // tablet scrolls the list underneath and the form appears to jump.
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 backdrop-blur-[1px]">
      {/* A button rather than a div so dismissing by clicking away is reachable from a keyboard too;
          it is aria-hidden because the same escape is already on Escape and the Cancel control. */}
      <button type="button" aria-hidden="true" tabIndex={-1} onClick={onClose} className="fixed inset-0 -z-10 cursor-default" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-auto w-full max-w-2xl rounded-lg border border-border bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-foreground/70">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-md p-2 text-foreground/60 transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
