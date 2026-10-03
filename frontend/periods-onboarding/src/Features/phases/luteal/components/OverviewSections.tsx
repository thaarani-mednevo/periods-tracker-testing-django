import { Activity, ArrowRight, CalendarDays, Pill, Sparkles } from "lucide-react";
import illustration from "../../../../assets/phases/luteal-illustration.png";
import { fmtDate } from "../../../dashboard/phases";
import type { IntakeRecord } from "../../../../services/logs";
import type { PhaseInsight } from "../../../../services/insights";
import { ProgressRing } from "../../ProgressRing";
import { AvaAvatar } from "../../shared/ui/AvaAvatar";
import { Emoji } from "../../shared/ui/Emoji";
import { LUTEAL_COPY } from "../lutealContent";

export function CycleStatusCard({ cycleDay, cycleLength, hasInsight, title = "Luteal Phase", segments = 4, segmentColor, segmentTrack }: { cycleDay: number | null; cycleLength: number | null; hasInsight: boolean; title?: string; segments?: number; segmentColor?: string; segmentTrack?: string }) {
  const progress = cycleDay && cycleLength ? Math.min(cycleDay / cycleLength, 1) : 0;
  return (
    <section className="lu-card flex items-center gap-[clamp(14px,1.3vw,22px)] p-lu-card">
      <div className="w-[clamp(96px,7.5vw,132px)]">
        <ProgressRing value={progress} size={132} stroke={10} segments={segments} segmentColor={segmentColor} segmentTrack={segmentTrack}>
          <span className="text-lu-title font-bold text-lu-ink">{cycleDay ?? "–"}</span>
          <span className="mt-0.5 text-lu-caption font-medium uppercase tracking-[0.12em] text-lu-ink-muted">Cycle day</span>
        </ProgressRing>
      </div>
      <div className="min-w-0">
        <p className="text-lu-label font-medium uppercase tracking-[0.14em] text-lu-ink-muted">Status</p>
        <h2 className="mt-1.5 text-lu-heading font-semibold text-lu-ink">{title}</h2>
        {hasInsight && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-lu-brand-soft px-3 py-1 text-lu-caption font-medium text-lu-brand-strong">
            <Sparkles className="size-3.5 text-[#F59E0B]" aria-hidden="true" />
            AI Summary Ready
          </span>
        )}
      </div>
    </section>
  );
}

export function PhaseCard({ onLogPeriod, onViewTips }: { onLogPeriod: () => void; onViewTips: () => void }) {
  return (
    <section className="lu-card relative flex items-center justify-between gap-4 overflow-hidden p-lu-card">
      <div className="min-w-0 max-w-[560px]">
        <h2 className="text-lu-heading font-semibold text-lu-ink">{LUTEAL_COPY.heading}</h2>
        <p className="mt-2.5 text-lu-body text-lu-ink-muted">{LUTEAL_COPY.description}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onLogPeriod}
            aria-haspopup="dialog"
            className="rounded-full bg-lu-brand-soft px-[clamp(16px,1.4vw,22px)] py-2.5 text-lu-label font-medium text-lu-brand-strong transition-colors hover:bg-[#FBCFE8]"
          >
            Log period
          </button>
          <button
            type="button"
            onClick={onViewTips}
            className="rounded-full bg-gradient-to-r from-[#EC4899] to-[#F472B6] px-[clamp(16px,1.4vw,22px)] py-2.5 text-lu-label font-medium text-white shadow-lu-glow transition-opacity hover:opacity-90"
          >
            View Tips
          </button>
        </div>
      </div>
      <img src={illustration} alt="" className="hidden w-[clamp(108px,9vw,150px)] shrink-0 object-contain sm:block" />
    </section>
  );
}

const CHIP_EMOJI = ["💧", "🚶‍♀️", "😴"];

/** Shows the stored AI insight (summary + tips). No insight means no hardcoded text. */
export function AIRecommendation({ insight, loading, onAskAva }: { insight: PhaseInsight | null; loading: boolean; onAskAva?: () => void }) {
  return (
    <section id="ai-recommendation" tabIndex={-1} aria-labelledby="ai-recommendation-title" className="lu-card scroll-mt-6 p-[clamp(12px,1.2vw,18px)] outline-none">
      <header className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#EDE9FE]">
            <AvaAvatar className="size-7" />
          </span>
          <h2 id="ai-recommendation-title" className="text-lu-body font-semibold text-lu-ink">AI Recommendation</h2>
        </div>
        {onAskAva && (
          <button type="button" onClick={onAskAva} aria-haspopup="dialog" className="rounded-full bg-[#F3E8FF] px-4 py-2 text-lu-label font-medium text-[#7E22CE] transition-colors hover:bg-[#E9D5FF]">
            Ask Ava
          </button>
        )}
      </header>
      <div className="mt-3 flex flex-col gap-4 rounded-[clamp(14px,1.2vw,18px)] bg-gradient-to-r from-[#FDF2F8] to-[#F5F0FF] p-[clamp(14px,1.4vw,22px)] sm:flex-row sm:items-center">
        <AvaAvatar className="size-[clamp(52px,4.2vw,68px)] shrink-0" />
        <div className="min-w-0">
          <p className="text-lu-body text-lu-ink-soft">
            {loading ? "Preparing your recommendation…" : (insight?.summary ?? "Your AI recommendation isn't available right now.")}
          </p>
          {insight && insight.tips.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {insight.tips.map((tip, i) => (
                <li key={tip} className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE9FE] px-3 py-1 text-lu-caption font-medium text-[#7C3AED]">
                  {tip}
                  <Emoji symbol={CHIP_EMOJI[i % CHIP_EMOJI.length]} className="text-[12px]" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function PillBubble() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lu-brand-soft text-lu-brand-strong">
      <Pill className="size-[18px]" aria-hidden="true" />
    </span>
  );
}

/** Real logged intakes only. */
export function MedicationHistory({ entries, onViewAll }: { entries: IntakeRecord[]; onViewAll: () => void }) {
  return (
    <section className="rounded-lu-card border border-lu-brand-line bg-white p-lu-card shadow-lu-card">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PillBubble />
          <div>
            <h2 className="text-lu-body font-semibold text-lu-ink">Medication History</h2>
            <p className="text-lu-label text-lu-ink-muted">Medications you&apos;ve logged throughout your cycle</p>
          </div>
        </div>
        <button type="button" onClick={onViewAll} className="-my-1 inline-flex items-center gap-2 py-1 text-lu-body font-medium text-lu-brand-strong hover:underline">
          View All History
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </header>
      {entries.length === 0 ? (
        <p className="mt-5 text-lu-label text-lu-ink-muted">No medications logged yet. Mark a medication as taken in your Daily Log and it will appear here.</p>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-lu-grid min-[560px]:grid-cols-2 xl:grid-cols-4">
          {entries.map((m, i) => (
            <li key={`${m.date}-${m.name}-${i}`} className="rounded-[clamp(14px,1.2vw,20px)] border border-lu-brand-line bg-[#FFFAFC] p-[clamp(14px,1.2vw,20px)]">
              <div className="flex items-center gap-3">
                <PillBubble />
                <div className="min-w-0">
                  <p className="truncate text-lu-label font-semibold text-lu-ink">{m.name}</p>
                  <p className="truncate text-lu-caption text-lu-ink-muted">{m.dose || "—"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2 text-lu-caption text-lu-ink-muted">
                <p>{fmtDate(m.date)}</p>
                <span className="font-semibold capitalize text-lu-ink">{m.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const ICON_CLASS = ["bg-[#EDE9FE] text-[#8B5CF6]", "bg-lu-brand-soft text-lu-brand-strong", "bg-[#DCFCE7] text-[#16A34A]"];

export function CycleInsights({ nextPeriodText, onViewDetails }: { nextPeriodText: string; onViewDetails: () => void }) {
  const items = [...LUTEAL_COPY.about, { icon: CalendarDays, category: "Cycle Pattern", title: "Luteal phase", text: nextPeriodText }];
  return (
    <section className="lu-card p-lu-card">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lu-heading font-semibold text-lu-ink">Cycle Insights</h2>
          <p className="mt-0.5 text-lu-label text-lu-ink-muted">Based on your logged data and current cycle phase.</p>
        </div>
        <button
          type="button"
          onClick={onViewDetails}
          className="inline-flex items-center gap-2 rounded-full bg-lu-brand-tint px-4 py-2 text-lu-label font-medium text-lu-brand-strong transition-colors hover:bg-lu-brand-soft"
        >
          <Activity className="size-4" aria-hidden="true" />
          View Details
        </button>
      </header>
      <ul className="mt-5 grid grid-cols-1 gap-lu-grid md:grid-cols-3">
        {items.map(({ icon: Icon, category, title, text }, i) => (
          <li key={title} className="rounded-[clamp(14px,1.2vw,20px)] bg-[#FFF7FA] p-[clamp(16px,1.4vw,24px)]">
            <span className={`flex size-10 items-center justify-center rounded-full ${ICON_CLASS[i % ICON_CLASS.length]}`}>
              <Icon className="size-[18px]" aria-hidden="true" />
            </span>
            <p className="mt-4 text-lu-label text-lu-ink-muted">{category}</p>
            <h3 className="mt-1 text-lu-body font-semibold text-lu-ink">{title}</h3>
            <p className="mt-2.5 text-lu-label text-lu-ink-muted">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}