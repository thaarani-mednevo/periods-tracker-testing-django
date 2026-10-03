import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { InfoCard } from "../../Elements/infoCard/InfoCard";
import { secondaryBtn } from "../../Elements/navigationButtons/NavigationButtons";
import { useCycle } from "../../hooks/useCycle";
import { PHASE_VIEWS } from "../phases/registry";
import { fmtDate, PHASES, type PhaseId } from "./phases";

interface PhasePageProps {
  initial?: PhaseId;
  onBack: () => void;
  onLogPeriod: () => void;
  onOpenTrends: () => void;
}

export function PhasePage({ initial, onBack, onLogPeriod, onOpenTrends }: PhasePageProps) {
  const cycle = useCycle();
  const state = cycle.data;
   // No explicit pick yet: open on whichever phase the engine says she is in right now.
  const [picked, setPicked] = useState<PhaseId | null>(initial ?? null);
  const selected: PhaseId = picked ?? (state && state.phase !== "unknown" ? state.phase : "menstrual");

  const meta = PHASES.find((p) => p.id === selected)!;
  const row = state?.phases.find((p) => p.phase === selected);
  const isNow = state?.phase === selected;

  return (
    <div className="animate-fade-up pb-12">
      <button type="button" onClick={onBack} className={`${secondaryBtn} mb-6`}>
        <ArrowLeft className="size-[18px]" aria-hidden="true" />
        Back
      </button>

      <div role="tablist" aria-label="Cycle phases" className="mb-5 flex flex-wrap gap-2">
        {PHASES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === selected}
            onClick={() => setPicked(p.id)}
            className={`rounded-full px-4 py-1.5 text-body-sm font-semibold ${
              p.id === selected ? "bg-rose text-white" : "bg-blush-50 text-ink-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {PHASE_VIEWS[selected] && state ? (
        (() => {
          const View = PHASE_VIEWS[selected]!;
          return <View state={state} onLogPeriod={onLogPeriod} onOpenTrends={onOpenTrends} />;
        })()
      ) : (
      <section className="rounded-[24px] border border-blush-300 bg-white p-5 shadow-glass sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-headline font-bold tracking-[-0.02em] text-ink">{meta.label} phase</h1>
          {isNow && (
            <span className="rounded-full bg-blush-50 px-3 py-1 text-caption font-semibold text-rose-ink">
              You're here now{state?.cycleDay ? ` · Day ${state.cycleDay}` : ""}
            </span>
          )}
        </div>
        <p className="mt-3 text-body text-ink-muted">{meta.blurb}</p>

        {cycle.status === "loading" && <p className="mt-5 text-body text-ink-muted">Loading…</p>}

        {row && (
          <dl className="mt-5 grid gap-3">
            <div className="rounded-[18px] bg-blush-50 p-3.5">
              <dt className="text-caption font-semibold uppercase tracking-[0.12em] text-ink-muted">This cycle</dt>
              <dd className="text-base font-bold text-ink">
                {selected === "ovulation"
                  ? fmtDate(row.start)
                  : row.end
                    ? `${fmtDate(row.start)} – ${fmtDate(row.end)}`
                    : `${fmtDate(row.start)} until your next period`}
              </dd>
            </div>
            {selected === "ovulation" && state?.ovulation && (
              <div className="rounded-[18px] bg-blush-50 p-3.5">
                <dt className="text-caption font-semibold uppercase tracking-[0.12em] text-ink-muted">Likely window</dt>
                <dd className="text-base font-bold text-ink">
                  {fmtDate(state.ovulation.windowStart)} – {fmtDate(state.ovulation.windowEnd)}
                </dd>
              </div>
            )}
          </dl>
        )}

        {cycle.status === "ready" && !row && (
          <InfoCard className="mt-5">Not enough data yet to place this phase. Log a period to get predictions.</InfoCard>
        )}
        {cycle.status === "error" && (
          <InfoCard className="mt-5" live>{cycle.error?.message ?? "Couldn't load your cycle."}</InfoCard>
        )}
        {cycle.status === "no-setup" && (
          <InfoCard className="mt-5" live>We couldn't find your saved setup. Go back and tap "Save it now".</InfoCard>
        )}
        <InfoCard variant="disclaimer" className="mt-3">
          Estimates are based on your logged cycles and are not a diagnosis or a method of contraception.
        </InfoCard>
      </section>
      )}
    </div>
  );
}