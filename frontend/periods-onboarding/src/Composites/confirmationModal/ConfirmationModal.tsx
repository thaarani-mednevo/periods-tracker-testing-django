import { PencilLine, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "../../lib/cn";
import { primaryBtn, secondaryBtn } from "../../Elements/navigationButtons/NavigationButtons";
import { CycleOrb } from "../visuals/cycleOrb/CycleOrb";

interface ConfirmationModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Accessible glass dialog with focus trap and Escape-to-close. */
export function ConfirmationModal({ open, onConfirm, onCancel }: ConfirmationModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    const previouslyFocused = active instanceof HTMLElement ? active : null;
    confirmRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>("button");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
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
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end p-3 sm:place-items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-[#2D2428]/20 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="glass relative w-full max-w-md animate-scale-in overflow-hidden rounded-[32px] p-6 pt-4 text-center sm:p-8 sm:pt-5"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,156,198,0.4),transparent_65%)]" aria-hidden="true" />
        <div className="relative mx-auto w-fit" aria-hidden="true">
          <CycleOrb size={92} />
        </div>
        <h2 id="confirm-title" className="relative mt-1 text-section font-semibold tracking-tight text-ink">
          Ready to start tracking?
        </h2>
        <p id="confirm-desc" className="relative mt-2 text-lead leading-relaxed text-ink-sub">
          You're about to complete your setup. You can update these preferences anytime from Settings.
        </p>
        <div className="relative mt-7 flex flex-col gap-3">
          <button ref={confirmRef} type="button" onClick={onConfirm} className={cn(primaryBtn, "w-full")}>
            <Sparkles className="size-[18px]" aria-hidden="true" />
            Complete Setup
          </button>
          <button type="button" onClick={onCancel} className={cn(secondaryBtn, "w-full")}>
            <PencilLine className="size-[18px]" aria-hidden="true" />
            Go Back &amp; Edit
          </button>
        </div>
      </div>
    </div>
  );
}
