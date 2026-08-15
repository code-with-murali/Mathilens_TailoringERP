"use client";

import { useEffect, type ReactNode } from "react";

/**
 * A dialog for a form, as opposed to <see cref="ConfirmDialog"/>'s single question.
 *
 * Sized to fit rather than to scroll. The forms inside lay their fields out in two columns from the
 * small breakpoint up, so a nine-field customer form is five rows deep and lands well inside a
 * laptop screen with nothing to scroll. `max-h`/`overflow-y-auto` on the body is a guard, not the
 * plan: on a phone held sideways, or with the browser's text scaled up, something has to give, and
 * the alternative to an occasional scroll is a Submit button nobody can reach.
 *
 * dvh rather than vh throughout — on a phone, vh is measured against the viewport with the address
 * bar retracted, so a dialog sized in vh is taller than what is actually on screen.
 */
export function Modal({
  open,
  title,
  description,
  icon,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  /** Optional mark beside the title, for dialogs that carry one. Purely decorative. */
  icon?: ReactNode;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-[1px] sm:p-4">
      {/* A button rather than a div so dismissing by clicking away is reachable from a keyboard too;
          it is aria-hidden because the same escape is already on Escape and the Cancel control. */}
      <button type="button" aria-hidden="true" tabIndex={-1} onClick={onClose} className="fixed inset-0 -z-10 cursor-default" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
      >
        {/* Centred rather than top-aligned: with no description the title is a single line, and an
            icon and a close button hanging from the top of a one-line header sit visibly high. */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold sm:text-lg">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-foreground/70">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 shrink-0 rounded-md p-2 text-foreground/60 transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
      </div>
    </div>
  );
}

/**
 * The row of controls that closes every form dialog: Cancel on the left, Submit on the right.
 *
 * Shared rather than written per form so the two words, the order and the spacing are the same
 * wherever a dialog asks for something — the pair is the part of a dialog people learn by position
 * rather than by reading. Full width and side by side on a phone, so neither is a small target.
 */
export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex items-center justify-end gap-3 border-t border-border pt-4">{children}</div>;
}
