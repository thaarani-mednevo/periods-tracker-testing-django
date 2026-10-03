import { useCallback, useEffect, useRef, useState } from "react";
import type { CyclePhase, CycleState } from "../../services/cycle";
import { useCycle } from "../../hooks/useCycle";
import { useAsync } from "../../hooks/useAsync";
import { getProfile, journeyFromGoal } from "../../services/settings";
import type { OnboardingData } from "../../types";
import { LutealDailyLog } from "./luteal/LutealDailyLog";
import { MenstrualDailyLog } from "./menstrual/MenstrualDailyLog";
import { FollicularDailyLog } from "./follicular/FollicularDailyLog";

interface PhaseDailyLogProps {
  data: OnboardingData;
  initialDay?: string;
  onBack: () => void;
  onOpenCalendar: () => void;
  onOpenTrends: () => void;
  onOpenSettings: () => void;
  /** Selected date maarumbodhu App-ku sollum, so ellaa pages-layum same date irukkum */
  onDayChange?: (day: string) => void;
}

export function PhaseDailyLog({
  data,
  initialDay,
  onBack,
  onOpenCalendar,
  onOpenTrends,
  onOpenSettings,
  onDayChange,
}: PhaseDailyLogProps) {
  /*
   * This is the date currently selected inside Daily Log.
   *
   * Important:
   * When user changes Sep 20 -> Sep 10,
   * this state changes and useCycle(selectedDay)
   * asks Django for the phase of Sep 10.
   */
  const [selectedDay, setSelectedDay] = useState(initialDay);

  useEffect(() => {
    setSelectedDay(initialDay);
  }, [initialDay]);

  /*
   * IMPORTANT:
   * Do NOT use useCycle() here.
   *
   * We need the cycle state for the SELECTED DATE.
   */
  const cycle = useCycle(selectedDay);

  // Journey (Track / TTC / Prevent) + tracking toggles from Settings.
  const profile = useAsync(useCallback((sig: AbortSignal) => getProfile(sig), []));
  const journey = journeyFromGoal(profile.data?.fertilityGoal ?? "");
  const tracking = profile.data?.fertilityTracking ?? {};

  const lastReady = useRef<CycleState | null>(null);
  if (cycle.status === "ready" && cycle.data) lastReady.current = cycle.data;
  const state = cycle.status === "ready" ? cycle.data : lastReady.current;

  // Dates the engine can't place in a phase (e.g. before the first logged period) report "unknown".
  // Keep showing the last known phase screen instead of dropping to the generic page.
  const lastPhase = useRef<Exclude<CyclePhase, "unknown"> | null>(null);
  if (state && state.phase !== "unknown") lastPhase.current = state.phase;

  if ((!state && cycle.status !== "error") || (profile.status === "loading" && !profile.data)) {
    return <p className="text-body text-ink-muted">Loading…</p>;
  }

  if (cycle.status === "error") {
    return (
      <div className="py-8">
        <p className="text-body text-ink-muted">
          Couldn&apos;t load the cycle information.
        </p>
      </div>
    );
  }
    if (!state) return null;

  const phase: Exclude<CyclePhase, "unknown"> = state.phase !== "unknown" ? state.phase : (lastPhase.current ?? "follicular");

  const handleDateChange = (date: string) => {
    setSelectedDay(date);
    onDayChange?.(date);
  };

  const handleNavigate = (tab: string) => {
    if (tab === "overview") {
      onBack();
    } else if (tab === "calendar") {
      onOpenCalendar();
    } else if (tab === "insights") {
      onOpenTrends();
    } else if (tab === "settings") {
      onOpenSettings();
    }
  };

  /*
   * MENSTRUATION
   */
  if (phase === "menstrual") {
    return (
      <MenstrualDailyLog
        key="menstrual"
        data={data}
        state={state}
        initialDay={selectedDay}
        onDateChange={handleDateChange}
        onNavigate={handleNavigate}
      />
    );
  }

  /*
   * LUTEAL
   */
  if (phase === "luteal") {
    return (
      <LutealDailyLog
        key="luteal"
        data={data}
        state={state}
        initialDay={selectedDay}
        onDateChange={handleDateChange}
        onNavigate={handleNavigate}
      />
    );
  }

  /*
   * FOLLICULAR + OVULATION (also the fallback for dates with no known phase)
   *
   * Uses the same Django DailyLog API as the other phases, but gets the
   * phase-specific visual treatment from the Follicular reference design.
   */
  return (
    <FollicularDailyLog
      key="follicular-ovulation"
      data={data}
      state={state}
      journey={journey}
      tracking={tracking}
      initialDay={selectedDay}
      onDateChange={handleDateChange}
      onNavigate={handleNavigate}
    />
  );
}