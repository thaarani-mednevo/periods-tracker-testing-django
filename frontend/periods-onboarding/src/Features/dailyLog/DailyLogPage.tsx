import { ArrowLeft, CalendarDays } from "lucide-react";
import { useCallback, useState } from "react";
import { InfoCard } from "../../Elements/infoCard/InfoCard";
import { secondaryBtn } from "../../Elements/navigationButtons/NavigationButtons";
import { useAsync } from "../../hooks/useAsync";
import { addDays, dayOfMonth, longDate, weekdayShort } from "../../lib/isoDate";
import type { ApiError } from "../../services/api/client";
import { getPredictions, localISODate, type CyclePhase } from "../../services/cycle";
import {
  BLOOD_COLORS, CLOT_SIZES, CRAMPS, ENERGIES, FLOWS, LEVELS, LH_TESTS, LIBIDOS, MOODS, MUCUS, SLEEPS, SYMPTOMS,
  emptyLog, getDailyLog, getLogRange, saveDailyLog, type DailyLog,
} from "../../services/logs";
import { card } from "../phases/shared";
import { ChoiceGroup, MultiChoice, NotesField, NumberField, ScaleGroup, Section, TimeField, YesNo } from "./fields";
import { MedicationPanel } from "./MedicationPanel";
import { ProductsEditor } from "./ProductsEditor";

type SectionId = "period" | "bbt" | "fertility" | "wellness" | "mood" | "symptoms" | "notes";

/** Which groups of fields are shown for the phase of the selected day. "Show all" overrides it. */
function visibleSections(phase: CyclePhase, showAll: boolean): Set<SectionId> {
  const s = new Set<SectionId>(["mood", "symptoms", "notes"]);
  if (showAll || phase === "unknown") return new Set<SectionId>(["period", "bbt", "fertility", "wellness", "mood", "symptoms", "notes"]);
  if (phase === "menstrual") s.add("period");
  if (phase === "follicular" || phase === "ovulation") {
    s.add("bbt");
    s.add("fertility");
  }
  if (phase === "luteal") {
    s.add("wellness");
    s.add("bbt");
  }
  return s;
}

const PHASE_NAME: Record<CyclePhase, string> = {
  menstrual: "Menstrual phase", follicular: "Follicular phase", ovulation: "Estimated ovulation day", luteal: "Luteal phase", unknown: "",
};

const firstFieldError = (err: ApiError) => {
  const first = err.fieldErrors ? Object.values(err.fieldErrors).flat()[0] : undefined;
  return first ? `${err.message} ${first}` : err.message;
};

function LogForm({ day, initial, phase, onSaved }: { day: string; initial: DailyLog; phase: CyclePhase; onSaved: () => void }) {
  const [draft, setDraft] = useState<DailyLog>(initial);
  const [version, setVersion] = useState(0); // remounts number inputs after "Clear day"
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const show = visibleSections(phase, showAll);

  const set = <K extends keyof DailyLog>(key: K, value: DailyLog[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setMessage(null);
  };

  const persist = async (log: DailyLog, done: string) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      setDraft(await saveDailyLog(day, log));
      setMessage(done);
      onSaved();
    } catch (err) {
      setError(firstFieldError(err as ApiError) || "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5" key={version}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body text-ink-muted">
          {phase !== "unknown" ? `${PHASE_NAME[phase]} · showing the fields that matter most.` : "Log what you noticed today."}
        </p>
        {phase !== "unknown" && (
          <button type="button" onClick={() => setShowAll((v) => !v)} aria-pressed={showAll} className={secondaryBtn}>
            {showAll ? "Show phase fields only" : "Show all fields"}
          </button>
        )}
      </div>

      {show.has("period") && (
        <Section id="log-period" title="Period" hint="Only log what you noticed.">
          <ChoiceGroup label="Flow" options={FLOWS} value={draft.flow} onChange={(v) => set("flow", v)} />
          <ChoiceGroup label="Blood colour" options={BLOOD_COLORS} value={draft.bloodColor} onChange={(v) => set("bloodColor", v)} />
          <YesNo label="Clots" value={draft.clotsPresent} onChange={(v) => set("clotsPresent", v)} />
          {draft.clotsPresent && <ChoiceGroup label="Clot size" options={CLOT_SIZES} value={draft.clotSize} onChange={(v) => set("clotSize", v)} />}
          <ChoiceGroup label="Cramps" options={CRAMPS} value={draft.cramps} onChange={(v) => set("cramps", v)} />
          <ScaleGroup label="Pain (0 = none, 10 = worst)" min={0} max={10} value={draft.painScore} onChange={(v) => set("painScore", v)} />
          <ProductsEditor value={draft.products} onChange={(v) => set("products", v)} />
        </Section>
      )}

      {show.has("bbt") && (
        <Section id="log-bbt" title="Basal body temperature" hint="Measure at the same time each morning, before getting up.">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField key={`bbt-${version}`} label="Temperature" unit="°C" min={35} max={38.5} step={0.01} value={draft.bbtCelsius} onChange={(v) => set("bbtCelsius", v)} />
            <TimeField label="Time measured" value={draft.bbtTime} onChange={(v) => set("bbtTime", v)} />
          </div>
        </Section>
      )}

      {show.has("fertility") && (
        <Section id="log-fertility" title="Fertility signs" hint="Optional signs some people track around ovulation.">
          <ChoiceGroup label="Cervical mucus" options={MUCUS} value={draft.cervicalMucus} onChange={(v) => set("cervicalMucus", v)} />
          <ChoiceGroup label="LH test" options={LH_TESTS} value={draft.lhTest} onChange={(v) => set("lhTest", v)} />
          <ChoiceGroup label="Libido" options={LIBIDOS} value={draft.libido} onChange={(v) => set("libido", v)} />
          <YesNo label="Intercourse" value={draft.intercourse} onChange={(v) => set("intercourse", v)} />
        </Section>
      )}

      {show.has("wellness") && (
        <Section id="log-wellness" title="Wellness">
          <ChoiceGroup label="Sleep quality" options={SLEEPS} value={draft.sleep} onChange={(v) => set("sleep", v)} />
          <ChoiceGroup label="Fatigue" options={LEVELS} value={draft.fatigue} onChange={(v) => set("fatigue", v)} />
          <ChoiceGroup label="Cravings" options={LEVELS} value={draft.cravings} onChange={(v) => set("cravings", v)} />
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField key={`w-${version}`} label="Water" unit="ml" min={0} max={10000} step={50} value={draft.waterMl} onChange={(v) => set("waterMl", v)} />
            <NumberField key={`s-${version}`} label="Steps" min={0} max={100000} step={100} value={draft.steps} onChange={(v) => set("steps", v)} />
            <NumberField key={`k-${version}`} label="Weight" unit="kg" min={25} max={300} step={0.1} value={draft.weightKg} onChange={(v) => set("weightKg", v)} />
          </div>
        </Section>
      )}

      {show.has("mood") && (
        <Section id="log-mood" title="Mood & energy">
          <ChoiceGroup label="Mood" options={MOODS} value={draft.mood} onChange={(v) => set("mood", v)} />
          <ChoiceGroup label="Energy" options={ENERGIES} value={draft.energy} onChange={(v) => set("energy", v)} />
        </Section>
      )}

      {show.has("symptoms") && (
        <Section id="log-symptoms" title="Symptoms">
          <MultiChoice label="Symptoms today" options={SYMPTOMS} value={draft.symptoms} onChange={(v) => set("symptoms", v)} />
        </Section>
      )}

      {show.has("notes") && (
        <Section id="log-notes" title="Notes">
          <NotesField value={draft.notes} onChange={(v) => set("notes", v)} />
        </Section>
      )}

      <MedicationPanel day={day} />

      {error && <InfoCard live>{error}</InfoCard>}
      {message && <p role="status" className="text-body-sm font-semibold text-rose-ink">{message}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => persist(draft, "Saved.")} disabled={saving} className="rounded-full bg-rose px-6 py-3 font-semibold text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save log"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setVersion((v) => v + 1);
            void persist(emptyLog(day), "Day cleared.");
          }}
          className={secondaryBtn}
        >
          Clear this day
        </button>
      </div>
      <InfoCard variant="disclaimer">Your log is for your own tracking. It is not a diagnosis or medical advice.</InfoCard>
    </div>
  );
}

interface DailyLogPageProps {
  initialDay?: string;
  onDayChange?: (day: string) => void;
  onBack: () => void;
  onOpenCalendar: () => void;
}

export function DailyLogPage({ initialDay, onDayChange, onBack, onOpenCalendar }: DailyLogPageProps) {
  const today = localISODate();
  const [day, setDayState] = useState(initialDay ?? today);
  const setDay = (d: string) => {
    setDayState(d);
    onDayChange?.(d); // parent phase-a re-check pannum, menstrual/luteal date na andha UI-ku switch aagum
  };
  const strip = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));

  const loadLog = useCallback((s: AbortSignal) => getDailyLog(day, s), [day]);
  const log = useAsync(loadLog);
  const loadPhase = useCallback((s: AbortSignal) => getPredictions(day, day, s), [day]);
  const phaseRes = useAsync(loadPhase);
  const loadMarks = useCallback((s: AbortSignal) => getLogRange(strip[0], today, s), [strip[0], today]); // eslint-disable-line react-hooks/exhaustive-deps
  const marks = useAsync(loadMarks);

  const logged = new Set((marks.data?.logs ?? []).map((l) => l.date));
  const phase: CyclePhase = phaseRes.status === "ready" ? (phaseRes.data?.days[0]?.phase ?? "unknown") : "unknown";
  const ready = log.status === "ready" && log.data?.date === day && phaseRes.status !== "loading";

  return (
    <div className="animate-fade-up pb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={secondaryBtn}>
          <ArrowLeft className="size-[18px]" aria-hidden="true" />
          Back
        </button>
        <button type="button" onClick={onOpenCalendar} className={secondaryBtn}>
          <CalendarDays className="size-[18px]" aria-hidden="true" />
          Calendar
        </button>
      </div>

      <p className="text-micro font-bold uppercase tracking-[0.16em] text-rose-ink">Daily log</p>
      <h1 className="mt-1 text-headline font-bold tracking-[-0.02em] text-ink">{longDate(day)}</h1>

      <div className={`${card} mt-5 mb-5`}>
        <div role="group" aria-label="Pick a day" className="flex gap-2 overflow-x-auto pb-1">
          {strip.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={d === day}
              onClick={() => setDay(d)}
              className={`relative flex min-w-[3.5rem] flex-col items-center rounded-[16px] px-2.5 py-2 text-caption font-semibold ${
                d === day ? "bg-rose text-white" : "bg-blush-50 text-ink-muted hover:opacity-80"
              }`}
            >
              <span>{weekdayShort(d)}</span>
              <span className="text-body font-bold">{dayOfMonth(d)}</span>
              {logged.has(d) && <span aria-label="Has a log" className={`mt-0.5 size-1.5 rounded-full ${d === day ? "bg-white" : "bg-rose"}`} />}
            </button>
          ))}
        </div>
        <label className="mt-3 inline-block text-body-sm font-semibold text-ink">
          Or choose a date{" "}
          <input type="date" value={day} max={today} onChange={(e) => e.target.value && setDay(e.target.value)} className="ml-2 rounded-[12px] border border-line px-3 py-1.5 text-body text-ink" />
        </label>
      </div>

      {log.status === "error" && (
        <InfoCard live>
          {log.error?.message ?? "Couldn't load this day."}{" "}
          <button type="button" onClick={log.refetch} className="font-semibold underline">Try again</button>
        </InfoCard>
      )}
      {!ready && log.status !== "error" && <p className="text-body text-ink-muted">Loading…</p>}
      {ready && log.data && <LogForm key={day} day={day} initial={log.data} phase={phase} onSaved={marks.refetch} />}
    </div>
  );
}
