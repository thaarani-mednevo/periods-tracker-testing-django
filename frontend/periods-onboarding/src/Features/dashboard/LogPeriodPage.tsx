import { ArrowLeft, CalendarDays, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { InfoCard } from "../../Elements/infoCard/InfoCard";
import { secondaryBtn } from "../../Elements/navigationButtons/NavigationButtons";
import type { ApiError } from "../../services/api/client";
import { logPeriod, localISODate } from "../../services/cycle";
import { CRAMPS, FLOWS, getDailyLog, saveDailyLog } from "../../services/logs";
import { LuModal } from "../phases/shared/ui/LuModal";

export function LogPeriodPage({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const today = localISODate();
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await logPeriod(start, end || null);
      onDone();
    } catch (err) {
      setError((err as Error).message || "Couldn't save. Please try again.");
      setSaving(false);
    }
  };

  const field = "mt-1 w-full rounded-[14px] border border-line bg-white px-3.5 py-2.5 text-body text-ink";

  return (
    <div className="animate-fade-up pb-12">
      <button type="button" onClick={onBack} className={`${secondaryBtn} mb-6`}>
        <ArrowLeft className="size-[18px]" aria-hidden="true" />
        Back
      </button>
      <section className="max-w-xl rounded-[24px] border border-blush-300 bg-white p-5 shadow-glass sm:p-7">
        <h1 className="text-headline font-bold tracking-[-0.02em] text-ink">Log your period</h1>
        <p className="mt-2 text-body text-ink-muted">Your predictions update as soon as you save.</p>

        <label className="mt-5 block text-body-sm font-semibold text-ink">
          First day
          <input type="date" value={start} max={today} onChange={(e) => setStart(e.target.value)} className={field} />
        </label>
        <label className="mt-4 block text-body-sm font-semibold text-ink">
          Last day <span className="font-normal text-ink-muted">(optional, add it when it ends)</span>
          <input type="date" value={end} min={start} max={today} onChange={(e) => setEnd(e.target.value)} className={field} />
        </label>

        {error && <InfoCard className="mt-5" live>{error}</InfoCard>}

        <button
          type="button"
          onClick={save}
          disabled={saving || !start}
          className="mt-6 rounded-full bg-rose px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save period"}
        </button>
      </section>
    </div>
  );
}

const pill = (on: boolean) =>
  `rounded-full border px-4 py-3 text-sm font-medium transition-colors ${
    on ? "border-[#F43F8F] bg-[#FFF0F6] text-[#F43F8F]" : "border-[#F3D5E2] bg-white text-ink hover:bg-[#FFF7FB]"
  }`;

/** Dashboard popup: starts today's period and saves flow, cramps, clots and notes for today. */
export function LogPeriodModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const today = localISODate();
  const [flow, setFlow] = useState<string | null>(null);
  const [cramps, setCramps] = useState<string | null>(null);
  const [clots, setClots] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await logPeriod(today, null);
      const existing = await getDailyLog(today);
      await saveDailyLog(today, {
        ...existing,
        flow: (flow ?? existing.flow) as typeof existing.flow,
        cramps: (cramps ?? existing.cramps) as typeof existing.cramps,
        clotsPresent: clots || existing.clotsPresent,
        notes: notes.trim() || existing.notes,
      });
      onSaved();
    } catch (err) {
      setError((err as ApiError).message || "Couldn't save. Please try again.");
      setSaving(false);
    }
  };

  return createPortal(
    <LuModal labelledBy="log-period-title" onClose={onClose} className="max-h-[90vh] max-w-[520px] overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="log-period-title" className="text-xl font-bold text-ink">Log Period</h2>
          <p className="mt-1 text-body text-ink-muted">Record your period details for today.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full bg-[#FFE4EF] p-2 text-[#F43F8F]">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-full bg-[#FDEBF3] p-2 pr-5">
        <span className="flex size-9 items-center justify-center rounded-full bg-white text-[#F43F8F]" aria-hidden="true">
          <CalendarDays className="size-4" />
        </span>
        <span className="font-semibold text-ink">Today · {dateLabel}</span>
      </div>

      <p className="mt-6 font-semibold text-ink">How is your flow today?</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {FLOWS.map((f) => (
          <button key={String(f)} type="button" aria-pressed={flow === f} onClick={() => setFlow(flow === f ? null : String(f))} className={pill(flow === f)}>
            {String(f)}
          </button>
        ))}
      </div>

      <p className="mt-6 font-semibold text-ink">Cramps Level</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {CRAMPS.map((c) => (
          <button key={String(c)} type="button" aria-pressed={cramps === c} onClick={() => setCramps(cramps === c ? null : String(c))} className={pill(cramps === c)}>
            {String(c)}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-full border border-[#F3D5E2] px-5 py-3">
        <span className="font-semibold text-ink">Clots Present</span>
        <button
          type="button"
          role="switch"
          aria-checked={clots}
          aria-label="Clots present"
          onClick={() => setClots((v) => !v)}
          className={`relative h-7 w-12 rounded-full transition-colors ${clots ? "bg-[#F43F8F]" : "bg-[#E5E3EA]"}`}
        >
          <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${clots ? "left-6" : "left-1"}`} />
        </button>
      </div>

      <label className="mt-6 block font-semibold text-ink">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Add a note..."
          className="mt-2 w-full resize-none rounded-[20px] border border-[#F3D5E2] px-4 py-3 text-body font-normal text-ink"
        />
      </label>

      {error && <p role="alert" className="mt-4 text-body-sm font-semibold text-rose-ink">{error}</p>}

      <button type="button" onClick={save} disabled={saving} className="mt-6 rounded-full bg-[#F43F8F] px-7 py-3 font-semibold text-white disabled:opacity-60">
        {saving ? "Saving…" : "Save period"}
      </button>
    </LuModal>,
    document.body,
  );
}