import { Brain, Smile, Sparkles, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import illustration from "../../../assets/phases/ovulation-illustration.png";
import { useAsync } from "../../../hooks/useAsync";
import { getPhaseInsight } from "../../../services/insights";
import { getDailyLog } from "../../../services/logs";
import { fmtDate } from "../../dashboard/phases";
import { CycleStatusCard } from "../luteal/components/OverviewSections";
import type { PhaseViewProps } from "../types";
import { PhaseTipsModal } from "../shared/ui/PhaseTipsModal";
import { ENERGY_LEVEL, MOOD_LEVEL } from "./fertility";
import { OVULATION_COPY, WELLNESS_GROUPS } from "./ovulationContent";
import { CheckList, Hero } from "./OvulationParts";

const SEGMENTS = 7;
const inset = "min-w-0 rounded-[24px] bg-white shadow-[0px_6px_18px_-10px_rgba(236,72,153,0.16)]";



function Badge({ icon: Icon, tone }: { icon: typeof Zap; tone: string }) {
  return (
    <span className={`flex size-10 shrink-0 items-center justify-center rounded-full lg:size-11 ${tone}`} aria-hidden="true">
      <Icon className="size-5 lg:size-[22px]" strokeWidth={1.75} />
    </span>
  );
}

function LevelCard({ title, icon, tone, fill, value, level, note, onOpen }: { title: string; icon: typeof Zap; tone: string; fill: string; value: string | null; level: number; note: string; onOpen: () => void }) {
  return (
    <section className={`${inset} p-[clamp(1rem,1.4vw,1.25rem)]`} aria-label={title}>
      <div className="flex items-center gap-2.5">
        <Badge icon={icon} tone={tone} />
        <h3 className="text-lu-heading font-bold text-lu-ink">{title}</h3>
      </div>
      <p className="mt-3 text-lu-title font-semibold text-lu-ink">{value ?? "Not logged"}</p>
      <div role="img" aria-label={`${title}: ${value ?? "not logged"}, ${level} of ${SEGMENTS}`} className="mt-2 flex items-center gap-[5px]">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span key={i} className={`h-[15px] w-[17px] rounded-[4px] ${i < level ? fill : "bg-[#F1E3ED]"}`} />
        ))}
      </div>
      <p className="mt-2.5 max-w-[330px] text-lu-body text-lu-ink-muted">{value ? "Logged for this day." : note}</p>
      {!value && (
        <button type="button" onClick={onOpen} className="mt-2 text-lu-label font-semibold text-lu-brand-strong hover:underline">
          Log it in Daily Log
        </button>
      )}
    </section>
  );
}

/** Default ovulation screen (journey: Track my cycle). Static education + the user's own logs + the stored AI insight. */
export function OvulationOverview({ state, onLogPeriod, onAskAva, onOpenDailyLog }: PhaseViewProps) {
  const day = state.date;
  const [tipsOpen, setTipsOpen] = useState(false);
  const log = useAsync(useCallback((s: AbortSignal) => getDailyLog(day, s), [day]));
  const insight = useAsync(useCallback((s: AbortSignal) => getPhaseInsight(day, s), [day]));
  const openLog = onOpenDailyLog ?? (() => {});
  const data = log.data;
  const ai = insight.data?.insight ?? null;

  return (
    <div className="flex flex-col gap-lu-grid">
      <div className="grid grid-cols-1 gap-lu-grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <CycleStatusCard title="Ovulation Phase" cycleDay={state.cycleDay} cycleLength={state.cycleProfile.medianCycleLength} hasInsight={insight.data?.status === "ready"} />
        <Hero
          heading="You're in your ovulation phase"
          description="Your body is around its most fertile point. Estrogen is typically high, and you may notice more energy and a brighter mood."
          onLogPeriod={onLogPeriod}
          image={illustration}
          extra={
            <button type="button" onClick={() => setTipsOpen(true)} aria-haspopup="dialog" className="rounded-full bg-gradient-to-r from-[#F860AE] to-[#D048C0] px-5 py-2.5 text-lu-label font-semibold text-white shadow-lu-glow">
              View Tips
            </button>
          }
        />
      </div>

      <div className="flex flex-col gap-[15px] rounded-[28px] border border-[#F1EEFF] bg-white p-3 shadow-lu-card sm:p-4 lg:p-5">
        <section className={`${inset} flex flex-col justify-between gap-4 p-5 md:flex-row md:items-start lg:p-6`} aria-labelledby="ovulation-summary">
          <div className="min-w-0 max-w-[760px]">
            <h2 id="ovulation-summary" className="text-lu-heading font-bold text-lu-ink">{OVULATION_COPY.heading}</h2>
            <p className="mt-2.5 text-lu-body text-lu-ink-muted">{OVULATION_COPY.description}</p>
            {state.ovulation && (
              <p className="mt-2 text-lu-label font-semibold text-lu-brand-strong">Estimated ovulation: around {fmtDate(state.ovulation.date)}</p>
            )}
          </div>
          <p className="inline-flex h-12 flex-shrink-0 items-center self-start whitespace-nowrap rounded-full bg-[#FFF4FA] px-5 text-lu-body font-semibold text-[#E0006A]">
            {OVULATION_COPY.encouragement}
          </p>
        </section>

        <div className="grid grid-cols-1 gap-[15px] lg:grid-cols-3">
          <section className={`${inset} p-[clamp(1rem,1.4vw,1.25rem)]`} aria-label="Hormonal changes">
            <div className="flex items-center gap-2.5">
              <Badge icon={Sparkles} tone="bg-[#F4ECFF] text-[#873DE3]" />
              <h3 className="text-lu-heading font-bold text-lu-ink">Hormonal Changes</h3>
            </div>
            <p className="mt-2.5 max-w-[280px] text-lu-body text-[#8A3FE6]">{OVULATION_COPY.hormones}</p>
          </section>
          <LevelCard title="Energy Level" icon={Zap} tone="bg-[#FFEED1] text-[#EA7100]" fill="bg-[#F2217E]" value={data?.energy ?? null} level={data?.energy ? ENERGY_LEVEL[data.energy] ?? 0 : 0} note={OVULATION_COPY.energyNote} onOpen={openLog} />
          <LevelCard title="Mood" icon={Smile} tone="bg-[#DCF9E5] text-[#00983B]" fill="bg-[#03A14A]" value={data?.mood ?? null} level={data?.mood ? MOOD_LEVEL[data.mood] ?? 0 : 0} note={OVULATION_COPY.moodNote} onOpen={openLog} />
        </div>

        <section id="ai-recommendation" tabIndex={-1} className={`${inset} flex items-start gap-4 p-5 outline-none lg:p-6`} aria-labelledby="ovulation-ai">
          <Badge icon={Brain} tone="bg-[#F4ECFF] text-[#873DE3]" />
          <div className="min-w-0 max-w-[960px] flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id="ovulation-ai" className="text-lu-heading font-bold text-lu-ink">AI Insights</h3>
              {onAskAva && (
                <button type="button" onClick={onAskAva} aria-haspopup="dialog" className="rounded-full bg-[#F3E8FF] px-4 py-1.5 text-lu-label font-medium text-[#7E22CE] hover:bg-[#E9D5FF]">
                  Ask Ava
                </button>
              )}
            </div>
            <p className="mt-2 text-lu-body text-lu-ink-muted">
              {insight.status === "loading" ? "Preparing your insight…" : (ai?.summary ?? "Your AI insight isn't available right now.")}
            </p>
            {ai && ai.tips.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {ai.tips.map((tip) => (
                  <li key={tip} className="rounded-full bg-[#EDE9FE] px-3 py-1 text-lu-caption font-medium text-[#7C3AED]">{tip}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div id="ovulation-tips" className="grid scroll-mt-6 grid-cols-1 gap-[15px] lg:grid-cols-3">
          {WELLNESS_GROUPS.map(({ id, title, icon, tone, check, items }) => (
            <section key={id} className={`${inset} p-[clamp(1rem,1.4vw,1.25rem)]`} aria-label={title}>
              <div className="flex items-center gap-2.5">
                <Badge icon={icon} tone={tone} />
                <h3 className="text-lu-heading font-bold text-lu-ink">{title}</h3>
              </div>
              <CheckList items={items} check={check} />
            </section>
          ))}
        </div>
      </div>

      {tipsOpen && <PhaseTipsModal phaseLabel="Ovulation" day={day} onClose={() => setTipsOpen(false)} />}
    </div>
  );
}