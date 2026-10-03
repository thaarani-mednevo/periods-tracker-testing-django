import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { todayISO } from "../../lib/health";
import { DatePicker } from "../datePicker/DatePicker";
import { primaryBtn, secondaryBtn } from "../navigationButtons/NavigationButtons";
import { cn } from "../../lib/cn";

interface CalendarDialogProps {
  open: boolean;
  /** Currently saved date, ISO "YYYY-MM-DD". */
  value: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
}

/**
 * The full calendar, shown only on demand. It overlays the page, so opening it never changes the
 * height of the step card or introduces a scrollbar. It renders in a portal on <body>: the step card
 * animates with a transform, which would otherwise become the containing block for `position: fixed`
 * and push the dialog off-centre.
 *
 * Picking a day (or "Today") commits straight away and closes — "Select" is there for keyboard users
 * who moved the focused day with the arrow keys. Cancel, Escape and a click outside all close without
 * changing the saved date.
 */
export function CalendarDialog({ open, value, onSelect, onClose }: CalendarDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(() => value || todayISO());

  // Re-sync whenever the dialog is (re)opened, so Cancel always reverts to what was saved. With no
  // date saved yet, the draft starts on today — the day the grid focuses — so "Select" is usable.
  // Adjusted during render (not in an effect) so the grid never paints a stale draft first.
  const [syncedFor, setSyncedFor] = useState({ open, value });
  if (syncedFor.open !== open || syncedFor.value !== value) {
    setSyncedFor({ open, value });
    if (open) setDraft(value || todayISO());
  }

  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    const previouslyFocused = active instanceof HTMLElement ? active : null;
    // Focus the grid's tabbable day so arrow keys work immediately.
    dialogRef.current?.querySelector<HTMLElement>('[role="grid"] button[tabindex="0"]')?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), select");
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
  }, [open, onClose]);

  if (!open) return null;

  const commit = (iso: string) => {
    onSelect(iso);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-[#2D2428]/15" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-dialog-title"
        className="relative w-full max-w-[min(360px,calc(100vw-32px))] animate-scale-in rounded-panel border border-[#F2DDE7] bg-white p-4 shadow-dialog"
      >
        {/* Today lives beside the title: the month/year row below stays on one line at every width. */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="calendar-dialog-title" className="text-lead font-bold text-ink">
            Select date
          </h2>
          <button
            type="button"
            onClick={() => commit(todayISO())}
            className="min-h-11 shrink-0 rounded-lg px-3 text-body-sm font-semibold text-rose-ink transition-colors hover:bg-blush-100 focus-ring pointer-fine:min-h-9"
          >
            Today
          </button>
        </div>

        <DatePicker value={draft} onChange={commit} onFocusedDateChange={setDraft} />

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={cn(secondaryBtn, "min-h-10 px-4 text-body")}>
            Cancel
          </button>
          <button type="button" onClick={() => commit(draft)} disabled={!draft} className={cn(primaryBtn, "min-h-10 px-5 text-body")}>
            Select
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
