import { useCallback, useState } from "react";
import { Icon3D } from "../../../Elements/icon3D/Icon3D";
import { InfoCard } from "../../../Elements/infoCard/InfoCard";
import illustration from "../../../assets/phases/menstrual-illustration.webp";
import { useAsync } from "../../../hooks/useAsync";
import { useCycleHistory } from "../../../hooks/useCycleHistory";
import { addDays } from "../../../lib/isoDate";
import { getPhaseInsight } from "../../../services/insights";
import { localISODate } from "../../../services/cycle";
import { getDailyLog, getMedicationHistory, SYMPTOMS } from "../../../services/logs";
import { fmtDate } from "../../dashboard/phases";
import { MetricCard, type MetricCardProps } from "../luteal/components/MetricCard";
import { AIRecommendation, CycleStatusCard, MedicationHistory } from "../luteal/components/OverviewSections";
import { CONFIDENCE_LABEL, days, span } from "../shared";
import { Emoji } from "../shared/ui/Emoji";
import type { PhaseViewProps } from "../types";
import { MENSTRUAL_COPY, WELLNESS } from "./menstrualContent";
import { PhaseTipsModal } from "../shared/ui/PhaseTipsModal";


const card = "lu-card p-lu-card";
const emojiSize = "text-[clamp(36px,3vw,52px)]";
const NOT_LOGGED = "Not logged";
const TAP_TO_LOG = "Tap the arrow to log today";

export function MenstrualOverview({ state, onLogPeriod, onAskAva, onOpenTrends, onOpenDailyLog }: PhaseViewProps) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const history = useCycleHistory();
  const day = state.date;
  const isToday = day === localISODate();
  const tapToLog = isToday ? TAP_TO_LOG : "Tap the arrow to log this day";

  const loadLog = useCallback((s: AbortSignal) => getDailyLog(day, s), [day]);
  const loadMeds = useCallback((s: AbortSignal) => getMedicationHistory(addDays(day, -60), day, s), [day]);
  const log = useAsync(loadLog).data;
  const meds = useAsync(loadMeds).data?.intakes.slice(0, 4) ?? [];
  const loadInsight = useCallback((signal: AbortSignal) => getPhaseInsight(day, signal), [day]);
  const insight = useAsync(loadInsight);

  const { cycleProfile: profile, nextPeriod: next, period } = state;
  const cycleLength = profile.medianCycleLength;
  const periodLength = profile.typicalPeriodLength;
  const completed = (history.data ?? []).filter((p) => p.cycleLength !== null);
  const openLog = onOpenDailyLog ?? (() => {});

  // Ring = one segment per period day (5 if the user said 5 days). Red once the period is actually logged;
  // soft pink while it is only a prediction.
  const logged = period?.startType === "observed";
  const ringSegments = Math.max(1, Math.round(periodLength ?? 5));
  const ringLength = ringSegments;

  const nextNote = !next
    ? "Not enough data yet"
    : [state.isOverdue ? `${days(state.overdueDays)} later than predicted` : `in ${days(state.daysUntilNextPeriod ?? 0)}`, span(next.rangeStart, next.rangeEnd)]
        .filter(Boolean)
        .join(" · ");

  const symptomLabels = (log?.symptoms ?? []).map((id) => SYMPTOMS.find((s) => s.id === id)?.label ?? id);
  const clots = log?.clotsPresent ? (log.clotSize ? `${log.clotSize} clots` : "Clots present") : log?.clotsPresent === false ? "No clots" : null;

  const metrics: (MetricCardProps & { onOpen: () => void })[] = [
    {
      label: "Period Tracker",
      value: `Day ${state.cycleDay ?? "–"}${periodLength ? ` of ~${Math.round(periodLength)}` : ""}`,
      description: period ? `${period.type === "observed" ? "Ended" : "Expected to end"} ${fmtDate(period.end)}` : "Not enough data yet",
      accent: "bg-[#FCE7F3] text-[#DB2777]",
      visual: <Emoji symbol="🩸" label="Period" className={emojiSize} />,
      onOpen: openLog,
    },
    {
      label: "Cramps Level",
      value: log?.cramps ?? NOT_LOGGED,
      description: log?.cramps ? "How your cramps felt" : tapToLog,
      accent: "bg-[#FEF9C3] text-[#CA8A04]",
      visual: <Emoji symbol="😣" label="Cramps" className={`${emojiSize} ${log?.cramps ? "" : "opacity-40"}`} />,
      onOpen: openLog,
    },
    {
      label: "Blood Flow",
      value: log?.flow ?? NOT_LOGGED,
      description: clots ?? (log?.flow ? "Clots not logged" : TAP_TO_LOG),
      accent: "bg-[#FFE4E6] text-[#E11D48]",
      visual: <Emoji symbol="💧" label="Flow" className={`${emojiSize} ${log?.flow ? "" : "opacity-40"}`} />,
      onOpen: openLog,
    },
    {
      label: "Symptoms",
      value: symptomLabels.length ? `${symptomLabels.length} logged` : NOT_LOGGED,
      description: symptomLabels.join(", ") || TAP_TO_LOG,
      accent: "bg-[#EDE9FE] text-[#6D28D9]",
      visual: <Emoji symbol="📝" label="Symptoms" className={`${emojiSize} ${symptomLabels.length ? "" : "opacity-40"}`} />,
      onOpen: openLog,
    },
    {
      label: "Next Period",
      value: next ? fmtDate(next.date) : "—",
      description: nextNote,
      accent: "bg-[#E0F2FE] text-[#0284C7]",
      visual: <Emoji symbol="📅" label="Next period" className={emojiSize} />,
      onOpen: onOpenTrends,
    },
    {
      label: "Prediction",
      value: CONFIDENCE_LABEL[state.confidence.level],
      description: [
        cycleLength ? `~${Math.round(cycleLength)}-day cycle` : null,
        profile.variability != null
          ? `±${profile.variability} days · ${profile.sampleSize} ${profile.sampleSize === 1 ? "cycle" : "cycles"} logged`
          : "from the length you entered",
      ]
        .filter(Boolean)
        .join(" · "),
      accent: "bg-[#F3E8FF] text-[#7E22CE]",
      visual: <Emoji symbol="✨" label="Prediction" className={emojiSize} />,
      onOpen: onOpenTrends,
    },
  ];

  return (
    <div className="flex flex-col gap-lu-grid">
      <div className="grid grid-cols-1 gap-lu-grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <CycleStatusCard
          title="Menstrual Phase"
          cycleDay={state.cycleDay}
          cycleLength={ringLength}
          segments={ringSegments}
          segmentColor={logged ? "#E5484D" : undefined}
          segmentTrack={logged ? "#FADADD" : undefined}
          hasInsight={insight.data?.status === "ready"}
        />

        <section className="lu-card relative flex items-center justify-between gap-4 overflow-hidden p-lu-card">
          <div className="min-w-0 max-w-[560px]">
            <h2 className="text-lu-heading font-semibold text-lu-ink">{MENSTRUAL_COPY.heading}</h2>
            <p className="mt-2.5 text-lu-body text-lu-ink-muted">{MENSTRUAL_COPY.description}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onLogPeriod}
                className="rounded-full bg-lu-brand-soft px-[clamp(16px,1.4vw,22px)] py-2.5 text-lu-label font-medium text-lu-brand-strong transition-colors hover:bg-[#FBCFE8]"
              >
                Log period
              </button>
              <button
                type="button"
                onClick={() => setTipsOpen(true)}
                aria-haspopup="dialog"
                className="rounded-full bg-gradient-to-r from-[#EC4899] to-[#F472B6] px-[clamp(16px,1.4vw,22px)] py-2.5 text-lu-label font-medium text-white shadow-lu-glow transition-opacity hover:opacity-90"
              >
                View Period Tips
              </button>
            </div>
          </div>
          <img src={illustration} alt="" className="hidden w-[clamp(108px,9vw,150px)] shrink-0 object-contain sm:block" />
        </section>
      </div>

      <ul aria-label={isToday ? "Today at a glance" : `${fmtDate(day)} at a glance`} className="grid grid-cols-1 gap-lu-grid sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <li key={m.label}>
            <MetricCard {...m} />
          </li>
        ))}
      </ul>

      {tipsOpen && <PhaseTipsModal phaseLabel="Menstrual" day={day} onClose={() => setTipsOpen(false)} />}

      <AIRecommendation insight={insight.data?.insight ?? null} loading={insight.status === "loading"} onAskAva={onAskAva} />
      <MedicationHistory entries={meds} onViewAll={openLog} />

      <section className={card} aria-labelledby="menstrual-previous">
        <h2 id="menstrual-previous" className="text-lu-heading font-semibold text-lu-ink">Previous cycles</h2>
        {history.status === "loading" && <p className="mt-4 text-lu-body text-lu-ink-muted">Loading…</p>}
        {history.status === "error" && (
          <InfoCard className="mt-4" live>
            {history.error?.message ?? "Couldn't load your cycle history."}{" "}
            <button type="button" onClick={history.refetch} className="font-semibold underline">
              Try again
            </button>
          </InfoCard>
        )}
        {history.status === "ready" && completed.length === 0 && (
          <InfoCard className="mt-4">Completed cycles show up here once you log your next period.</InfoCard>
        )}
        {history.status === "ready" && completed.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Completed cycles</caption>
              <thead>
                <tr className="border-b border-lu-line text-lu-caption text-lu-ink-muted">
                  <th scope="col" className="pb-2.5 font-semibold">Cycle</th>
                  <th scope="col" className="pb-2.5 font-semibold">Cycle length</th>
                  <th scope="col" className="pb-2.5 font-semibold">Period length</th>
                </tr>
              </thead>
              <tbody className="text-lu-label text-lu-ink">
                {completed.map((p) => (
                  <tr key={p.id} className="border-b border-lu-line last:border-0">
                    <th scope="row" className="py-3 font-normal">
                      {p.endDate ? span(p.startDate, p.endDate) || fmtDate(p.startDate) : fmtDate(p.startDate)}
                    </th>
                    <td className="py-3">{days(p.cycleLength ?? 0)}</td>
                    <td className="py-3">{p.periodLength ? days(p.periodLength) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ul className="grid gap-lu-grid md:grid-cols-3" aria-label="Wellness tips">
        {WELLNESS.map(({ icon, title, items }) => (
          <li key={title} className={card}>
            <div className="flex items-center gap-3">
              <Icon3D icon={icon} size="sm" />
              <h3 className="text-lu-body font-semibold text-lu-ink">{title}</h3>
            </div>
            <ul className="mt-4 grid gap-2 text-lu-label text-lu-ink-muted">
              {items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rounded-full bg-lu-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <InfoCard variant="disclaimer">
        Estimates are based on your logged cycles and are not a diagnosis or a method of contraception. General wellness information, not medical advice.
      </InfoCard>
    </div>
  );
}