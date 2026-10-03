import { CalendarHeart, Flower2, ShieldAlert, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import meditation from "../../../assets/phases/follicular/meditation.png";
import { InfoCard } from "../../../Elements/infoCard/InfoCard";
import type { FertilityTracking } from "../../../types";
import { fmtDate } from "../../dashboard/phases";
import { AIRecommendation, CycleStatusCard, MedicationHistory } from "../luteal/components/OverviewSections";
import type { PhaseViewProps } from "../types";
import { LH_META, LIBIDO_META, MUCUS_META, fertilityLevel, statusCopy } from "./fertility";
import { FERTILITY_COPY, MUCUS_SCALE } from "./ovulationContent";
import {
  BbtCard,
  FactGrid,
  FertilityLevelCard,
  Hero,
  IntercourseCard,
  LhCard,
  LibidoCard,
  MucusCard,
  ProtectionCard,
  StatusBanner,
  trackingOn,
  useOvulationData,
  type Fact,
} from "./OvulationParts";
import { FertilityInsightCard } from "./OvulationInsight";
import { PhaseTipsModal } from "../shared/ui/PhaseTipsModal";

export interface OvulationFertilityProps extends PhaseViewProps {
  journey: "trying_to_conceive" | "pregnancy_prevention";
  /** Settings > tracking toggles. A card is shown when its toggle is on (or a value is already logged). */
  tracking: Partial<FertilityTracking>;
}

/**
 * Fertility-journey ovulation screen (ovulation-phase design).
 * Same data for both journeys; the journey changes the wording, the facts shown and the safety note.
 * Which signal cards appear follows the tracking toggles from Settings.
 */
export function OvulationFertility({ state, journey, tracking, onLogPeriod, onAskAva, onOpenDailyLog }: OvulationFertilityProps) {
  const d = useOvulationData(state);
  const [tipsOpen, setTipsOpen] = useState(false);
  const openLog = onOpenDailyLog ?? (() => {});
  const copy = FERTILITY_COPY[journey];
  const ttc = journey === "trying_to_conceive";
  const { fw, status, log } = d;
  const data = log.data;

  const showMucus = trackingOn(tracking, "cervicalMucus", data?.cervicalMucus != null);
  const showBbt = trackingOn(tracking, "bbt", d.bbt.latest != null);
  const showLh = trackingOn(tracking, "lhTest", data?.lhTest != null);
  const showLibido = trackingOn(tracking, "libido", data?.libido != null);
  const showIntercourse = trackingOn(tracking, "intercourse", data?.intercourse != null);

  const banner = status ? statusCopy(status, journey) : null;
  const level = status ? fertilityLevel(status) : null;

  const facts: Fact[] = ttc
    ? [
        { icon: Flower2, label: "Fertile window", value: fw ? `${fmtDate(fw.start)} – ${fmtDate(fw.end)}` : "—", note: "5 days before ovulation to 1 day after" },
        { icon: Target, label: "Peak fertility day", value: fw ? fmtDate(fw.peakDay) : "—", note: "Usually the day before ovulation" },
        { icon: Sparkles, label: "Estimated ovulation", value: fw ? fmtDate(fw.ovulation) : "—", note: "Can shift by a few days" },
        { icon: CalendarHeart, label: "Best days to try", value: fw ? `${fmtDate(fw.bestStart)} – ${fmtDate(fw.ovulation)}` : "—", note: "Highest chance of conception" },
      ]
    : [
        { icon: Flower2, label: "Fertile window", value: fw ? `${fmtDate(fw.start)} – ${fmtDate(fw.end)}` : "—", note: "5 days before ovulation to 1 day after" },
        { icon: ShieldAlert, label: "Higher chance days", value: fw ? `${fmtDate(fw.bestStart)} – ${fmtDate(fw.ovulation)}` : "—", note: "Highest estimated chance of pregnancy" },
        { icon: Sparkles, label: "Estimated ovulation", value: fw ? fmtDate(fw.ovulation) : "—", note: "Can shift by a few days" },
        {
          icon: CalendarHeart,
          label: "Today",
          value: !status ? "—" : status.kind === "open" || status.kind === "peak" ? "Higher chance" : "Lower chance (estimate)",
          note: "Estimates can be off",
        },
      ];

  // Only what the user actually logged. Nothing is guessed; an empty pill says "Not logged".
  const signals = [
    { label: "LH surge", value: showLh && data?.lhTest ? data.lhTest : null },
    { label: "Mucus", value: showMucus && data?.cervicalMucus ? data.cervicalMucus : null },
    { label: "BBT", value: showBbt && d.bbt.state === "rising" ? "Rising" : showBbt && d.bbt.latest != null ? "Logged" : null },
  ];

  const readinessRow1 = showBbt && showMucus ? "lg:grid-cols-2" : "";
  const readinessRow2 =
    showLh && showLibido
      ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]"
      : showLh || showLibido
        ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        : "";

  return (
    <div className="flex flex-col gap-lu-grid">
      <div className="grid grid-cols-1 gap-lu-grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <CycleStatusCard title="Ovulation Phase" cycleDay={state.cycleDay} cycleLength={state.cycleProfile.medianCycleLength} hasInsight={d.insight.data?.status === "ready"} />
        <Hero
          heading={copy.heading}
          description={copy.description}
          onLogPeriod={onLogPeriod}
          image={meditation}
          extraFirst
          extra={
            <button type="button" onClick={() => setTipsOpen(true)} aria-haspopup="dialog" className="rounded-full bg-gradient-to-r from-[#EC4899] to-[#F472B6] px-5 py-2.5 text-lu-label font-semibold text-white shadow-lu-glow">
              View Tips
            </button>
          }
        />
      </div>

      <section className="flex flex-col gap-[15px] rounded-[28px] border border-[#F1EEFF] bg-white p-3 shadow-lu-card sm:p-4 lg:p-5" aria-labelledby="ovulation-readiness">
        <div>
          <h2 id="ovulation-readiness" className="text-lu-heading font-bold text-lu-ink">Ovulation readiness</h2>
          <p className="mt-1 text-lu-label text-lu-ink-muted">Multi-signal fertility intelligence, updated live</p>
        </div>

        {(showBbt || showMucus) && (
          <div className={`grid grid-cols-1 gap-lu-grid ${readinessRow1}`}>
            {showBbt && <BbtCard analysis={d.bbt} onOpen={openLog} />}
            {showMucus && <MucusCard log={data} scale={MUCUS_SCALE} meta={MUCUS_META} onOpen={openLog} />}
          </div>
        )}

        <div className={`grid grid-cols-1 gap-lu-grid ${readinessRow2}`}>
          {level && <FertilityLevelCard level={level} signals={signals} />}
          {showLh && <LhCard log={data} meta={LH_META} onOpen={openLog} />}
          {showLibido && <LibidoCard log={data} meta={LIBIDO_META} onOpen={openLog} />}
        </div>

        <AIRecommendation insight={d.insight.data?.insight ?? null} loading={d.insight.status === "loading"} onAskAva={onAskAva} />

        <FertilityInsightCard status={status} ttc={ttc} log={data} bbt={d.bbt} />
      </section>

      {banner && <StatusBanner {...banner} />}
      <FactGrid facts={facts} />
      {!ttc && <ProtectionCard />}
      {showIntercourse && (
        <div className="grid grid-cols-1 gap-lu-grid sm:grid-cols-2 xl:grid-cols-3">
          <IntercourseCard log={data} day={d.day} onSaved={d.refetchLogs} />
        </div>
      )}

      <MedicationHistory entries={d.meds.data?.intakes.slice(0, 4) ?? []} onViewAll={openLog} />

      <InfoCard variant="disclaimer">{copy.disclaimer}</InfoCard>

      {tipsOpen && <PhaseTipsModal phaseLabel="Ovulation" day={state.date} onClose={() => setTipsOpen(false)} />}
    </div>
  );
}