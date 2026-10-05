import { useState } from "react";
import { CalendarDays, CalendarPlus, MessageCircle, NotebookPen, PencilLine, TrendingUp } from "lucide-react";
import { useCycle } from "../../hooks/useCycle";
import { submitOnboardingProfile } from "../../services/onboarding";
import { localISODate, logPeriod, type CycleState } from "../../services/cycle";
import type { OnboardingData } from "../../types";
import { InfoCard } from "../../Elements/infoCard/InfoCard";
import { secondaryBtn } from "../../Elements/navigationButtons/NavigationButtons";
import { AskAvaModal } from "../insights/AskAvaModal";
import { PhaseInsightCard } from "../insights/PhaseInsightCard";
import { LogPeriodModal } from "./LogPeriodPage";
import { PHASE_VIEWS } from "../phases/registry";
import { LutealShell } from "../phases/luteal/components/Shell";
import { fmtDate, PHASES } from "./phases";

/** Plain-language reason for the confidence level; the backend only sends codes. */
function confidenceNote(state: CycleState): string | null {
  const r = state.confidence.reasons;
  if (r.includes("period_overdue")) return `Your period is ${state.overdueDays} ${state.overdueDays === 1 ? "day" : "days"} later than predicted. Log it when it starts and your predictions will update.`;
  if (r.includes("no_cycle_data")) return "Add your cycle length or log a couple of periods to get predictions.";
  if (r.includes("assumed_default_cycle_length")) return "We're using a typical 28-day cycle until you add your cycle length or log a period.";
  if (r.includes("based_on_onboarding_only")) return "Predictions use the cycle length you entered. They get more accurate as you log periods.";
  if (r.includes("only_one_cycle_logged") || r.includes("few_cycles_logged")) return "Predictions are still learning from your first few cycles.";
  if (r.includes("moderate_cycle_variability") || r.includes("high_cycle_variability")) return "Your cycle length varies, so dates are shown as ranges.";
  return null;
}

interface DashboardProps {
  data: OnboardingData;
  selectedDay?: string;
  onEditSetup: () => void;
  onOpenTrends: () => void;
  onOpenDailyLog: () => void;
  onOpenCalendar: () => void;
  onOpenSettings?: () => void;
}

export function Dashboard({
  data,
  selectedDay,
  onEditSetup,
  onOpenTrends,
  onOpenDailyLog,
  onOpenCalendar,
  onOpenSettings,
}: DashboardProps) {
  const cycle = useCycle(selectedDay);
  const [retrying, setRetrying] = useState(false);
  const [avaOpen, setAvaOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [lateDismissed, setLateDismissed] = useState(false);
  const [startingToday, setStartingToday] = useState(false);

  const periodStartedToday = async () => {
    setStartingToday(true);
    try {
      await logPeriod(localISODate());
      cycle.refetch();
    } catch {
      openLogPeriod(); // e.g. a period is already logged close to today: let the user pick the date
    } finally {
      setStartingToday(false);
    }
  };
  const openLogPeriod = () => setLogOpen(true);
  const state = cycle.data;

  const View = state && state.phase !== "unknown" ? PHASE_VIEWS[state.phase] : undefined;
  const shelled = cycle.status === "ready" && (state?.phase === "luteal" || state?.phase === "menstrual" || state?.phase === "follicular" || state?.phase === "ovulation");
  const note = state ? confidenceNote(state) : null;
  const next = state?.nextPhase;
  const nextLabel = next ? PHASES.find((p) => p.id === next.phase)?.label : undefined;

  const retrySave = async () => {
    setRetrying(true);
    await submitOnboardingProfile(data);
    setRetrying(false);
    cycle.refetch();
  };

  return (
    <div className="animate-fade-up pb-12">
      <div className={shelled ? "hidden" : "mb-6 flex flex-wrap items-end justify-between gap-4"}>

        <div>
          <p className="text-micro font-bold uppercase tracking-[0.16em] text-rose-ink">Cycle dashboard</p>
          <h1 className="mt-1 text-headline font-bold tracking-[-0.02em] text-ink">
            {data.name.trim() ? `Welcome, ${data.name.trim().split(/\s+/)[0]}` : "Welcome to your tracker"}
          </h1>
          {next && nextLabel && (
            <p className="mt-1 text-body-sm text-ink-muted">
              Next: <span className="font-semibold text-ink">{nextLabel}</span>{" "}
              {next.daysUntil === 1 ? "tomorrow" : `in ${next.daysUntil} days`} · {fmtDate(next.startDate)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onOpenDailyLog} className={secondaryBtn}>
            <NotebookPen className="size-[18px]" aria-hidden="true" />
            Daily log
          </button>
          <button type="button" onClick={onOpenCalendar} className={secondaryBtn}>
            <CalendarDays className="size-[18px]" aria-hidden="true" />
            Calendar
          </button>
          <button type="button" onClick={onOpenTrends} className={secondaryBtn}>
            <TrendingUp className="size-[18px]" aria-hidden="true" />
            Trends
          </button>
          <button type="button" onClick={() => setAvaOpen(true)} className={secondaryBtn}>
            <MessageCircle className="size-[18px]" aria-hidden="true" />
            Ask Ava
          </button>
          <button type="button" onClick={openLogPeriod} className={secondaryBtn}>
            <CalendarPlus className="size-[18px]" aria-hidden="true" />
            Log period
          </button>
          <button type="button" onClick={onEditSetup} className={secondaryBtn}>
            <PencilLine className="size-[18px]" aria-hidden="true" />
            Edit setup
          </button>
        </div>
      </div>

      {shelled && state && (
        <LutealShell
          data={data}
          state={state}
          active="overview"
          onNavigate={(tab) => {
            if (tab === "calendar") onOpenCalendar();
            else if (tab === "daily-log") onOpenDailyLog();
            else if (tab === "insights") onOpenTrends();
            else if (tab === "settings") (onOpenSettings ?? onEditSetup)();
          }}
        />
      )}

      {cycle.status === "loading" && <p className="text-body text-ink-muted">Loading…</p>}

      {cycle.status === "no-setup" && (
        <InfoCard live>
          We couldn't find your saved setup.{" "}
          <button type="button" onClick={retrySave} disabled={retrying} className="font-semibold underline">
            {retrying ? "Saving…" : "Save it now"}
          </button>
        </InfoCard>
      )}

      {cycle.status === "error" && (
        <InfoCard live>
          {cycle.error?.message ?? "Couldn't load your cycle."}{" "}
          <button type="button" onClick={cycle.refetch} className="font-semibold underline">
            Try again
          </button>
        </InfoCard>
      )}

      {cycle.status === "ready" && state && (
        <div className="grid gap-5">
          {state.isOverdue && !lateDismissed ? (
            <InfoCard live>
              <p>
                Your last logged period started {state.period ? fmtDate(state.period.start) : "a while ago"}, and your
                period is {state.overdueDays} {state.overdueDays === 1 ? "day" : "days"} later than predicted. Did you
                have a period since then?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={openLogPeriod} className={secondaryBtn}>
                  Yes, add the date
                </button>
                <button type="button" onClick={periodStartedToday} disabled={startingToday} className={secondaryBtn}>
                  {startingToday ? "Saving…" : "It started today"}
                </button>
                <button type="button" onClick={() => setLateDismissed(true)} className={secondaryBtn}>
                  Not yet
                </button>
              </div>
            </InfoCard>
          ) : (
            note && <InfoCard>{note}</InfoCard>
          )}
          {View ? (
            <>
              <View
                state={state}
                onLogPeriod={openLogPeriod}
                onOpenTrends={onOpenTrends}
                onAskAva={() => setAvaOpen(true)}
                onOpenDailyLog={onOpenDailyLog}
                onChanged={cycle.refetch}
              />
              {/* Keyed so a new phase or day fetches a fresh insight */}
              {!shelled && <PhaseInsightCard key={`${state.phase}-${state.date}`} />}
            </>
          ) : (
            <InfoCard>
              {state.isOverdue
                ? "It's been a long time since your last logged period, so we can't estimate your phase."
                : "Not enough data yet to show your phase."}{" "}
              <button type="button" onClick={openLogPeriod} className="font-semibold underline">
                Log a period
              </button>
            </InfoCard>
          )}
        </div>
      )}

      {avaOpen && <AskAvaModal onClose={() => setAvaOpen(false)} />}
      {logOpen && (
        <LogPeriodModal
          onClose={() => setLogOpen(false)}
          onSaved={() => {
            setLogOpen(false);
            cycle.refetch();
          }}
        />
      )}
    </div>
  );
}