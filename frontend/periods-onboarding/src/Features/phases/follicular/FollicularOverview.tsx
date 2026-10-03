import { useCallback, useState } from "react";
import { CalendarDays, Heart, Sparkles, TrendingUp, Zap } from "lucide-react";
import { InfoCard } from "../../../Elements/infoCard/InfoCard";
import { Icon3D } from "../../../Elements/icon3D/Icon3D";
import { useAsync } from "../../../hooks/useAsync";
import { addDays } from "../../../lib/isoDate";
import { getPhaseInsight } from "../../../services/insights";
import { getDailyLog, getMedicationHistory } from "../../../services/logs";
import { fmtDate } from "../../dashboard/phases";
import { MetricCard, type MetricCardProps } from "../luteal/components/MetricCard";
import { AIRecommendation, CycleStatusCard, MedicationHistory } from "../luteal/components/OverviewSections";
import { card, days, span } from "../shared";
import type { PhaseViewProps } from "../types";
import { PhaseTipsModal } from "../shared/ui/PhaseTipsModal";
import { FOLLICULAR_COPY, HORMONE, CARE_TIPS, WELLNESS } from "./follicularContent";

import cheering from "../../../assets/phases/follicular/woman_cheering.png";
import mucusArt from "../../../assets/phases/follicular/cervical_mucus_fingers.png";
import lhArt from "../../../assets/phases/follicular/lh_test_device.png";
import libidoArt from "../../../assets/phases/follicular/libido_heart.png";

const NOT_LOGGED = "Not logged";
const TAP_TO_LOG = "Tap the arrow to log today";
const visual = "w-[clamp(52px,4.5vw,76px)] h-[clamp(52px,4.5vw,76px)] object-contain";
const emoji = "text-[clamp(34px,3vw,50px)]";



function formatBbt(value: number | null) {
  return value == null ? NOT_LOGGED : `${value.toFixed(2)}°C`;
}

export function FollicularOverview({ state, onLogPeriod, onAskAva, onOpenTrends, onOpenDailyLog }: PhaseViewProps) {
  const day = state.date;
  const [tipsOpen, setTipsOpen] = useState(false);
  const log = useAsync(useCallback((s: AbortSignal) => getDailyLog(day, s), [day]));
  const meds = useAsync(useCallback((s: AbortSignal) => getMedicationHistory(addDays(day, -60), day, s), [day]));
  const insight = useAsync(useCallback((s: AbortSignal) => getPhaseInsight(day, s), [day]));

  const data = log.data;
  const entries = meds.data?.intakes.slice(0, 4) ?? [];
  const openLog = onOpenDailyLog ?? (() => {});

  const next = state.nextPhase;
  const nextPeriod = state.nextPeriod;

  const metrics: MetricCardProps[] = [
    {
      label: "Basal Body Temperature",
      value: formatBbt(data?.bbtCelsius ?? null),
      description: data?.bbtCelsius != null ? `Measured ${data.bbtTime ?? "today"}` : TAP_TO_LOG,
      accent: "bg-[#EDE9FE] text-[#7C3AED]",
      visual: <span className={`${visual} flex items-center justify-center rounded-full bg-[#F5F0FF]`}>🌡️</span>,
    },
    {
      label: "Mood",
      value: data?.mood ?? NOT_LOGGED,
      description: data?.mood ? "How you felt today" : TAP_TO_LOG,
      accent: "bg-[#FCE7F3] text-[#DB2777]",
      visual: <span className={emoji}>{data?.mood === "Happy" ? "😊" : data?.mood === "Calm" ? "😌" : data?.mood === "Irritable" ? "😤" : data?.mood === "Sad" ? "😔" : "😐"}</span>,
    },
    {
      label: "Cervical Mucus",
      value: data?.cervicalMucus ?? NOT_LOGGED,
      description: data?.cervicalMucus ? "Fertility sign logged today" : TAP_TO_LOG,
      accent: "bg-[#E0F2FE] text-[#0284C7]",
      visual: <img src={mucusArt} alt="" className={visual} />,
    },
    {
      label: "LH Test",
      value: data?.lhTest ?? NOT_LOGGED,
      description: data?.lhTest ? "Ovulation test result" : "Optional fertility tracking",
      accent: "bg-[#DCFCE7] text-[#16A34A]",
      visual: <img src={lhArt} alt="" className={visual} />,
    },
    {
      label: "Libido",
      value: data?.libido ?? NOT_LOGGED,
      description: data?.libido ? "Logged today" : TAP_TO_LOG,
      accent: "bg-[#FFF1F2] text-[#E11D48]",
      visual: <img src={libidoArt} alt="" className={visual} />,
    },
    {
      label: "Energy",
      value: data?.energy ?? NOT_LOGGED,
      description: data?.energy ? "Your energy level today" : TAP_TO_LOG,
      accent: "bg-[#FFF7ED] text-[#EA580C]",
      visual: <span className={`${visual} flex items-center justify-center rounded-full bg-[#FFF7ED] text-3xl`}>⚡</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-lu-grid">
      <div className="grid grid-cols-1 gap-lu-grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <CycleStatusCard
          title="Follicular Phase"
          cycleDay={state.cycleDay}
          cycleLength={state.cycleProfile.medianCycleLength}
          hasInsight={insight.data?.status === "ready"}
        />

        <section className="relative flex min-h-[190px] items-center justify-between gap-5 overflow-hidden rounded-lu-card border border-lu-brand-line bg-white p-lu-card shadow-lu-card">
          <div className="min-w-0 max-w-[620px]">
            <span className="inline-flex rounded-full bg-[#F3E8FF] px-3 py-1 text-lu-caption font-bold uppercase tracking-[0.12em] text-[#7C3AED]">
              Follicular
            </span>
            <h2 className="mt-2 text-lu-heading font-semibold text-lu-ink">{FOLLICULAR_COPY.heading}</h2>
            <p className="mt-2.5 text-lu-body text-lu-ink-muted">{FOLLICULAR_COPY.description}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={onLogPeriod} className="rounded-full bg-lu-brand-soft px-5 py-2.5 text-lu-label font-semibold text-lu-brand-strong hover:bg-[#FBCFE8]">
                Log period
              </button>
              <button type="button" onClick={() => setTipsOpen(true)} aria-haspopup="dialog" className="rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] px-5 py-2.5 text-lu-label font-semibold text-white shadow-lu-glow">
                View Follicular Tips
              </button>
            </div>
          </div>
          <img src={cheering} alt="" className="hidden max-h-[190px] w-[clamp(130px,15vw,230px)] shrink-0 object-contain sm:block" />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-lu-grid sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <li key={m.label} className="list-none">
            <MetricCard {...m} onOpen={openLog} />
          </li>
        ))}
      </div>

      <AIRecommendation insight={insight.data?.insight ?? null} loading={insight.status === "loading"} onAskAva={onAskAva} />

      <section className={card} aria-labelledby="follicular-cycle-insights">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="follicular-cycle-insights" className="text-lu-heading font-semibold text-lu-ink">Cycle Insights</h2>
            <p className="mt-0.5 text-lu-label text-lu-ink-muted">Follicular signals and what to watch as ovulation approaches.</p>
          </div>
          <button type="button" onClick={onOpenTrends} className="inline-flex items-center gap-2 rounded-full bg-[#F3E8FF] px-4 py-2 text-lu-label font-semibold text-[#7C3AED]">
            <TrendingUp className="size-4" /> View Details
          </button>
        </header>
        <ul className="mt-5 grid grid-cols-1 gap-lu-grid md:grid-cols-3">
          <li className="rounded-[20px] bg-[#FAF5FF] p-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#EDE9FE] text-[#7C3AED]"><Sparkles className="size-5" /></span>
            <p className="mt-4 text-lu-caption text-lu-ink-muted">Hormone pattern</p>
            <h3 className="mt-1 text-lu-body font-semibold text-lu-ink">{HORMONE.title}</h3>
            <p className="mt-2 text-lu-label text-lu-ink-muted">{HORMONE.text}</p>
          </li>
          <li className="rounded-[20px] bg-[#FFF7FA] p-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]"><Zap className="size-5" /></span>
            <p className="mt-4 text-lu-caption text-lu-ink-muted">Next phase</p>
            <h3 className="mt-1 text-lu-body font-semibold text-lu-ink">{next ? next.phase : "Not available"}</h3>
            <p className="mt-2 text-lu-label text-lu-ink-muted">{next ? `Starts ${fmtDate(next.startDate)} · ${days(next.daysUntil)}` : "Keep logging to improve predictions."}</p>
          </li>
          <li className="rounded-[20px] bg-[#F0FDF4] p-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]"><CalendarDays className="size-5" /></span>
            <p className="mt-4 text-lu-caption text-lu-ink-muted">Next period</p>
            <h3 className="mt-1 text-lu-body font-semibold text-lu-ink">{nextPeriod ? fmtDate(nextPeriod.date) : "Not enough data"}</h3>
            <p className="mt-2 text-lu-label text-lu-ink-muted">{nextPeriod ? (state.isOverdue ? `${days(state.overdueDays)} later than predicted` : span(nextPeriod.rangeStart, nextPeriod.rangeEnd) || "Estimated from your cycle") : "Log more cycles to see a prediction."}</p>
          </li>
        </ul>
      </section>

      <MedicationHistory entries={entries} onViewAll={openLog} />

      <section id="follicular-tips" className={card} aria-labelledby="follicular-tips-title">
        <header>
          <h2 id="follicular-tips-title" className="flex items-center gap-2 text-lu-heading font-semibold text-lu-ink">
            <Heart className="size-[18px] text-[#8B5CF6]" /> Follicular wellness tips
          </h2>
          <p className="mt-0.5 text-lu-label text-lu-ink-muted">Use these as general wellness prompts, not rules.</p>
        </header>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {CARE_TIPS.map(({ icon: TipIcon, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-[18px] bg-[#FAF5FF] p-4">
              <Icon3D icon={TipIcon} size="sm" />
              <div className="min-w-0">
                <h3 className="text-lu-body font-semibold text-lu-ink">{title}</h3>
                <p className="mt-1 text-lu-label text-lu-ink-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ul className="grid gap-lu-grid md:grid-cols-3" aria-label="Follicular wellness">
        {WELLNESS.map(({ icon: TipIcon, title, items }) => (
          <li key={title} className={card}>
            <div className="flex items-center gap-3">
              <Icon3D icon={TipIcon} size="sm" />
              <h3 className="text-lu-body font-semibold text-lu-ink">{title}</h3>
            </div>
            <ul className="mt-4 grid gap-2 text-lu-label text-lu-ink-muted">
              {items.map((item) => <li key={item} className="flex gap-2"><span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#8B5CF6]" />{item}</li>)}
            </ul>
          </li>
        ))}
      </ul>

      <InfoCard variant="disclaimer">
        Estimates are based on your logged cycles and are not a diagnosis or a method of contraception. General wellness information, not medical advice.
      </InfoCard>

      {tipsOpen && <PhaseTipsModal phaseLabel="Follicular" day={day} onClose={() => setTipsOpen(false)} />}
    </div>
  );
}
