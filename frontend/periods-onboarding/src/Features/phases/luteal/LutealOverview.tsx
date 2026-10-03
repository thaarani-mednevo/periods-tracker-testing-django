import { useCallback, useState } from "react";
import { InfoCard } from "../../../Elements/infoCard/InfoCard";
import { useAsync } from "../../../hooks/useAsync";
import { addDays } from "../../../lib/isoDate";
import { getPhaseInsight } from "../../../services/insights";
import { getDailyLog, getMedicationHistory } from "../../../services/logs";
import { fmtDate } from "../../dashboard/phases";
import type { PhaseViewProps } from "../types";
import { LogPeriodModal } from "./components/LogPeriodModal";
import { MetricCard, type MetricCardProps } from "./components/MetricCard";
import { PhaseTipsModal } from "../shared/ui/PhaseTipsModal";
import { AIRecommendation, CycleInsights, CycleStatusCard, MedicationHistory, PhaseCard } from "./components/OverviewSections";
import { DEFAULT_STEP_GOAL, WATER_TARGET_ML } from "../shared/daily-log/constants";
import { Emoji } from "../shared/ui/Emoji";
import { ScaleArt, WaterGlassArt } from "../shared/ui/Illustrations";
import { CRAVING_EMOJI, EnergyBolt, FatigueBattery, MOOD_EMOJI, MoodFace, SLEEP_EMOJI } from "../shared/ui/visuals";

// Display goals only. The backend has no goal fields yet.
export const WATER_GOAL_ML = WATER_TARGET_ML;
export const STEP_GOAL = DEFAULT_STEP_GOAL;

const visualSize = "w-[clamp(50px,4.2vw,72px)]";
const emojiSize = "text-[clamp(36px,3vw,52px)]";
const NOT_LOGGED = "Not logged";
const TAP_TO_LOG = "Tap the arrow to log today";



export function LutealOverview({ state, onOpenTrends, onAskAva, onOpenDailyLog, onChanged }: PhaseViewProps) {
  const [logOpen, setLogOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const day = state.date;

  const loadLog = useCallback((s: AbortSignal) => getDailyLog(day, s), [day]);
  const loadHistory = useCallback((s: AbortSignal) => getMedicationHistory(addDays(day, -60), day, s), [day]);
  const log = useAsync(loadLog).data;
  const history = useAsync(loadHistory).data?.intakes.slice(0, 4) ?? [];
  const loadInsight = useCallback((s: AbortSignal) => getPhaseInsight(day, s), [day]);
  const insight = useAsync(loadInsight);

  const openLog = onOpenDailyLog ?? (() => {});
  const next = state.nextPeriod;
  const nextPeriodText = next
    ? `Your next period is expected around ${fmtDate(next.date)}.`
    : "Log a period to see when your next one is expected.";

  const water = log?.waterMl ?? null;
  const steps = log?.steps ?? null;

  const metrics: MetricCardProps[] = [
    {
      label: "Mood",
      value: log?.mood ?? NOT_LOGGED,
      description: log?.mood ? "How you felt today" : TAP_TO_LOG,
      accent: "bg-[#EDE9FE] text-[#6D28D9]",
      visual: log?.mood ? (
        <span className={`${visualSize} aspect-square`}><MoodFace value={log.mood} className="text-[clamp(28px,2.4vw,40px)]" /></span>
      ) : (
        <Emoji symbol={MOOD_EMOJI.Neutral} className={`${emojiSize} opacity-40`} />
      ),
    },
    {
      label: "Body Weight",
      value: log?.weightKg != null ? `${log.weightKg} kg` : NOT_LOGGED,
      description: log?.weightKg != null ? "Logged today" : TAP_TO_LOG,
      accent: "bg-[#E0F2FE] text-[#0284C7]",
      visual: <ScaleArt value={log?.weightKg != null ? String(log.weightKg) : undefined} className={visualSize} />,
    },
    {
      label: "Hydration",
      value: water != null ? `${(water / 1000).toFixed(1)} / ${(WATER_GOAL_ML / 1000).toFixed(1)}L` : NOT_LOGGED,
      description: water != null ? "Daily goal" : TAP_TO_LOG,
      badge: water != null ? { text: `${Math.min(100, Math.round((water / WATER_GOAL_ML) * 100))}%`, className: "bg-[#CFFAFE] text-[#0E7490]" } : undefined,
      accent: "bg-[#CFFAFE] text-[#0891B2]",
      visual: <WaterGlassArt fill={water != null ? water / WATER_GOAL_ML : 0} className={visualSize} />,
    },
    {
      label: "Fatigue Level",
      value: log?.fatigue ? (log.fatigue === "None" ? "No Fatigue" : `${log.fatigue} Fatigue`) : NOT_LOGGED,
      description: log?.fatigue ? "How tired you felt" : TAP_TO_LOG,
      accent: "bg-[#FEF9C3] text-[#CA8A04]",
      visual: <FatigueBattery value={log?.fatigue ?? null} className="h-[clamp(50px,4.2vw,72px)]" />,
    },
    {
      label: "Sleep Quality",
      value: log?.sleep ?? NOT_LOGGED,
      description: log?.sleep ? "Last night" : TAP_TO_LOG,
      accent: "bg-[#E0E7FF] text-[#4F46E5]",
      visual: <Emoji symbol={log?.sleep ? SLEEP_EMOJI[log.sleep] : "😴"} label="Sleep" className={`${emojiSize} ${log?.sleep ? "" : "opacity-40"}`} />,
    },
    {
      label: "Daily Activity",
      value: steps != null ? `${steps.toLocaleString("en-US")} steps` : NOT_LOGGED,
      description: steps != null ? `${Math.round((steps / STEP_GOAL) * 100)}% of ${STEP_GOAL.toLocaleString("en-US")} step goal` : TAP_TO_LOG,
      accent: "bg-[#DCFCE7] text-[#16A34A]",
      visual: <Emoji symbol="👟" label="Activity" className={`${emojiSize} ${steps != null ? "" : "opacity-40"}`} />,
    },
    {
      label: "Energy Level",
      value: log?.energy ? `${log.energy} Energy` : NOT_LOGGED,
      description: log?.energy ? "How your energy felt" : TAP_TO_LOG,
      accent: "bg-[#FFEDD5] text-[#EA580C]",
      visual: (
        <span className={`${visualSize} flex aspect-square items-center justify-center rounded-full bg-[#FFF7ED]`}>
          <EnergyBolt value={log?.energy ?? null} />
        </span>
      ),
    },
    {
      label: "Cravings",
      value: log?.cravings ?? NOT_LOGGED,
      description: log?.cravings ? "Cravings today" : TAP_TO_LOG,
      accent: "bg-[#ECFCCB] text-[#65A30D]",
      visual: <Emoji symbol={log?.cravings ? CRAVING_EMOJI[log.cravings] : "🧁"} label="Cravings" className={`${emojiSize} ${log?.cravings ? "" : "opacity-40"}`} />,
    },
  ];

  return (
    <div className="flex flex-col gap-lu-grid">
      <div className="grid grid-cols-1 gap-lu-grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <CycleStatusCard cycleDay={state.cycleDay} cycleLength={state.cycleProfile.medianCycleLength} hasInsight={insight.data?.status === "ready"} />
        <PhaseCard onLogPeriod={() => setLogOpen(true)} onViewTips={() => setTipsOpen(true)} />
      </div>

      <div className="grid grid-cols-1 gap-lu-grid sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => <MetricCard key={m.label} {...m} onOpen={openLog} />)}
      </div>

      <AIRecommendation insight={insight.data?.insight ?? null} loading={insight.status === "loading"} onAskAva={onAskAva} />
      <MedicationHistory entries={history} onViewAll={openLog} />
      <CycleInsights nextPeriodText={nextPeriodText} onViewDetails={onOpenTrends} />

      <InfoCard variant="disclaimer">Estimates are based on your logged cycles and are not a diagnosis or a method of contraception.</InfoCard>

      {tipsOpen && <PhaseTipsModal phaseLabel="Luteal" day={day} onClose={() => setTipsOpen(false)} />}

      {logOpen && (
        <LogPeriodModal
          onClose={() => setLogOpen(false)}
          onSaved={() => {
            setLogOpen(false);
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}