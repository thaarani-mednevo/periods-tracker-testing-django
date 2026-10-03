import { Check, Compass, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { Journey } from "../../services/settings";
import { LuModal } from "../phases/shared/ui/LuModal";
import { JourneyIcon } from "./controls";
import { JOURNEY_OPTIONS } from "./journeyOptions";

/** Mount it only while open, so the selection always starts from the saved journey. */
export function ManageJourneyModal({ current, onClose, onSave }: {
  current: Journey;
  onClose: () => void;
  onSave: (journey: Journey) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<Journey>(current);
  const [saving, setSaving] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const save = async () => {
    setSaving(true);
    const ok = await onSave(selected);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <LuModal labelledBy={titleId} describedBy={descId} onClose={onClose} initialFocus={closeBtn} className="max-h-[92dvh] overflow-y-auto p-6 sm:max-w-[520px] sm:p-7">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F0FF] text-[#6C5CE7]">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-lu-title font-bold text-lu-ink">Manage Your Journey</h2>
            <p id={descId} className="mt-1 text-lu-label text-lu-ink-muted">Choose one focus. You can change this anytime.</p>
          </div>
        </div>
        <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lu-brand-soft text-lu-brand-strong">
          <X className="size-4" strokeWidth={2.4} />
        </button>
      </header>

      <fieldset className="mt-5 space-y-3">
        <legend className="sr-only">Journey</legend>
        {JOURNEY_OPTIONS.map((j) => {
          const isSelected = selected === j.id;
          return (
            <label
              key={j.id}
              className={`relative flex w-full cursor-pointer items-start justify-between gap-3.5 rounded-[1.25rem] border-2 p-4 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#F43F8F] sm:items-center ${
                isSelected ? "border-[#F43F8F] bg-[#FFF5F9]" : "border-[#F1DDE8] bg-white hover:bg-[#FFF9FB]"
              }`}
            >
              <input type="radio" name="journey" value={j.id} checked={isSelected} onChange={() => setSelected(j.id)} className="sr-only" />
              <span className="flex min-w-0 flex-1 items-start gap-3.5">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-[#F43F8F] text-white" : `${j.iconBg} ${j.iconColor}`}`}>
                  <JourneyIcon icon={j.icon} />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#17152B]">{j.title}</span>
                    {current === j.id && <span className="rounded-full border border-[#BBF7D0] bg-[#DCFCE7] px-2 py-0.5 text-[0.62rem] font-bold text-[#15803D]">Current</span>}
                  </span>
                  <span className="block text-xs font-medium leading-relaxed text-[#68708A]">{j.description}</span>
                </span>
              </span>
              <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? "border-[#F43F8F] bg-[#F43F8F]" : "border-[#CBD5E1] bg-white"}`}>
                {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="mt-6 grid grid-cols-2 items-center gap-3">
        <button type="button" onClick={save} disabled={saving} className="rounded-full bg-lu-brand py-3 text-lu-body font-semibold text-white shadow-lu-glow transition-colors hover:bg-lu-brand-strong disabled:opacity-60">
          {saving ? "Saving…" : "Save Journey"}
        </button>
        <button type="button" onClick={onClose} className="py-3 text-lu-body font-medium text-lu-ink-soft hover:text-lu-ink">Cancel</button>
      </div>
    </LuModal>
  );
}