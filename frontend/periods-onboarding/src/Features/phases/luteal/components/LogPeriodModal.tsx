import { useId, useRef, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { localISODate, logPeriod } from "../../../../services/cycle";
import { CRAMPS, FLOWS, getDailyLog, saveDailyLog, type Cramps, type Flow } from "../../../../services/logs";
import type { ApiError } from "../../../../services/api/client";
import { longDate } from "../../../../lib/isoDate";
import { LuModal } from "../../shared/ui/LuModal";

function PillGroup<T extends string>({ label, options, value, onChange, invalid }: { label: string; options: readonly T[]; value: T | null; onChange: (v: T) => void; invalid: boolean }) {
  const id = useId();
  return (
    <fieldset>
      <legend id={id} className="text-lu-body font-semibold text-lu-ink">{label}</legend>
      <div role="radiogroup" aria-labelledby={id} className="mt-3 grid grid-cols-2 gap-[clamp(8px,1vw,14px)]">
        {options.map((o) => {
          const selected = o === value;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o)}
              className={`min-w-0 truncate rounded-full px-3 py-[clamp(11px,1vw,15px)] text-lu-body transition-colors ${
                selected
                  ? "border-2 border-lu-brand bg-lu-brand-soft font-semibold text-lu-brand-strong"
                  : `border bg-white font-medium text-lu-ink hover:border-lu-brand-line hover:bg-lu-brand-tint ${invalid ? "border-[#FDA4AF]" : "border-lu-line"}`
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Starts a period today (cycle engine) and stores flow / cramps / clots / notes in today's daily log. */
export function LogPeriodModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const today = localISODate();
  const [flow, setFlow] = useState<Flow | null>(null);
  const [cramps, setCramps] = useState<Cramps | null>(null);
  const [clots, setClots] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const missing = [!flow && "flow", !cramps && "cramps level"].filter(Boolean) as string[];

  const save = async () => {
    setSubmitted(true);
    if (!flow || !cramps) return;
    setSaving(true);
    setError(null);
    try {
      await logPeriod(today, null);
      // Merge into today's existing log so nothing already logged is overwritten
      const existing = await getDailyLog(today);
      await saveDailyLog(today, { ...existing, flow, cramps, clotsPresent: clots, notes: notes.trim() || existing.notes });
      onSaved();
    } catch (err) {
      setError((err as ApiError).message || "Couldn't save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <LuModal labelledBy={titleId} describedBy={descId} onClose={onClose} initialFocus={closeBtn} className="max-h-[92dvh] overflow-y-auto px-[clamp(18px,2.6vw,36px)] pb-[clamp(20px,2.4vw,34px)] pt-[clamp(20px,2.4vw,32px)] sm:max-w-[600px]">
      <div className="flex flex-col gap-[clamp(18px,1.8vw,26px)]">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lu-title font-bold text-lu-ink">Log Period</h2>
            <p id={descId} className="mt-1.5 text-lu-body text-lu-ink-muted">Record your period details for today. Your predictions update when you save.</p>
          </div>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lu-brand-soft text-lu-brand-strong transition-colors hover:bg-[#FBCFE8]">
            <X className="size-[18px]" strokeWidth={2.4} />
          </button>
        </header>

        <p className="flex items-center gap-3 rounded-full bg-lu-brand-soft/70 px-[clamp(12px,1.4vw,18px)] py-[clamp(10px,1vw,14px)]">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-lu-brand-strong shadow-lu-pill">
            <CalendarDays className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="min-w-0 text-lu-body font-semibold text-lu-ink">Today · {longDate(today)}</span>
        </p>

        <PillGroup label="How is your flow today?" options={FLOWS} value={flow} onChange={setFlow} invalid={submitted && !flow} />
        <PillGroup label="Cramps Level" options={CRAMPS} value={cramps} onChange={setCramps} invalid={submitted && !cramps} />

        <div className="flex items-center justify-between gap-3 rounded-full border border-lu-line px-[clamp(16px,1.6vw,22px)] py-[clamp(12px,1.2vw,16px)]">
          <span className="text-lu-body font-semibold text-lu-ink">Clots Present</span>
          <button type="button" role="switch" aria-checked={clots} aria-label="Clots present" onClick={() => setClots((c) => !c)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${clots ? "bg-lu-brand" : "bg-[#EEF0F4]"}`}>
            <span className={`absolute left-1 top-1 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(17,24,39,0.25)] transition-transform ${clots ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div>
          <label htmlFor="lu-period-notes" className="text-lu-body font-semibold text-lu-ink">Notes</label>
          <textarea id="lu-period-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a note..." className="mt-3 block min-h-[clamp(96px,8vw,120px)] w-full resize-y rounded-[24px] border border-lu-line bg-white px-[clamp(16px,1.6vw,22px)] py-4 text-lu-body text-lu-ink outline-none placeholder:text-lu-ink-faint focus:border-lu-brand" />
        </div>

        {submitted && missing.length > 0 && <p role="alert" className="-mt-2 text-lu-label font-medium text-[#E11D48]">Please select your {missing.join(" and ")}.</p>}
        {error && <p role="alert" className="-mt-2 text-lu-label font-medium text-[#E11D48]">{error}</p>}

        <div className="grid grid-cols-2 items-center gap-3">
          <button type="button" onClick={save} disabled={saving} className="rounded-full bg-lu-brand py-[clamp(12px,1.1vw,15px)] text-lu-body font-semibold text-white shadow-lu-glow transition-colors hover:bg-lu-brand-strong disabled:opacity-60">
            {saving ? "Saving…" : "Save Log"}
          </button>
          <button type="button" onClick={onClose} className="py-3 text-lu-body font-medium text-lu-ink-soft hover:text-lu-ink">Cancel</button>
        </div>
      </div>
    </LuModal>
  );
}