import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";
import { primaryBtn, secondaryBtn } from "./../../Elements/navigationButtons/NavigationButtons";

interface StartOverDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirms clearing saved setup progress — the one destructive action on the welcome page. */
export function StartOverDialog({ open, onConfirm, onCancel }: StartOverDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    const previouslyFocused = active instanceof HTMLElement ? active : null;
    cancelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>("button");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-[#2D2428]/15" onClick={onCancel} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-over-title"
        aria-describedby="start-over-desc"
        className="relative w-full max-w-[min(380px,calc(100vw-32px))] animate-scale-in rounded-panel border border-card-border bg-white p-5 shadow-dialog"
      >
        <h2 id="start-over-title" className="text-heading font-bold text-ink">
          Start over?
        </h2>
        <p id="start-over-desc" className="mt-1.5 text-body leading-relaxed text-ink-sub">
          Your saved setup progress will be cleared.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} className={cn(secondaryBtn, "min-h-10 px-4 text-body")}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={cn(primaryBtn, "min-h-10 px-5 text-body")}>
            Start Over
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
