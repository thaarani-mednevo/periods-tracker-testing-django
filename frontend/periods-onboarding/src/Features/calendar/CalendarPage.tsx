import { ChevronLeft, ChevronRight, ClipboardCheck, ClipboardList } from "lucide-react";
import type { OnboardingData } from "../../types";
import { useCallback, useMemo, useState } from "react";
import { InfoCard } from "../../Elements/infoCard/InfoCard";
import { useCycle } from "../../hooks/useCycle";
import { LutealShell } from "../phases/luteal/components/Shell";
import { useAsync } from "../../hooks/useAsync";
import { toIso } from "../../lib/isoDate";
import { getCurrentCycle, getPredictions, localISODate, type CyclePhase, type PredictedDay } from "../../services/cycle";
import { getLogRange } from "../../services/logs";

type KnownPhase = Exclude<CyclePhase, "unknown">;

/** Same phase look as the Menstruation calendar design: pastel pills, green solid for ovulation. */
const PHASE: Record<KnownPhase, { label: string; short: string; pill: string; badge: string; dot: string }> = {
  menstrual: {
    label: "Menstruation",
    short: "Period",
    pill: "bg-[#FFE2EC] text-[#D81B60]",
    badge: "border-pink-200 text-[#D81B60]",
    dot: "bg-[#F43F8F]",
  },
  follicular: {
    label: "Follicular Phase",
    short: "Follicular",
    pill: "bg-white text-[#17152B] enabled:hover:bg-pink-50",
    badge: "border-[#CBD5E1] text-[#475569]",
    dot: "bg-white border-2 border-solid border-[#CBD5E1]",
  },
  ovulation: {
    label: "Ovulation",
    short: "Ovulation",
    pill: "bg-[#22C55E] text-white shadow-md shadow-emerald-400/40",
    badge: "border-emerald-300 text-[#16A34A]",
    dot: "bg-[#22C55E]",
  },
  luteal: {
    label: "Luteal Phase",
    short: "Luteal",
    pill: "bg-[#EDE9FE] text-[#6D4AD8]",
    badge: "border-purple-200 text-[#6D4AD8]",
    dot: "bg-[#8B5CF6]",
  },
};

/** Light green for the estimated fertile window around the ovulation day (the day itself stays solid green). */
const WINDOW_PILL = "bg-[#DCFCE7] text-[#15803D] border-2 border-[#86EFAC]";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const fromIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDaysIso = (iso: string, n: number) => {
  const d = fromIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
};
const fmtShort = (iso: string) => fromIso(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const fmtLong = (iso: string) =>
  fromIso(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

function phaseOf(info?: PredictedDay): KnownPhase | null {
  if (!info) return null;
  if (info.isOvulationDay) return "ovulation";
  return info.phase === "unknown" ? null : info.phase;
}

const navBtn =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#F5F5F7] text-[#55607A] transition-colors hover:bg-gray-200";
const sideCard =
  "flex items-center justify-between gap-3 rounded-[18px] border border-[#F1DDE8] bg-white p-3.5 shadow-[0_2px_12px_rgba(23,21,43,0.02)]";

interface CalendarPageProps {
  data: OnboardingData;
  onBack: () => void;
  onOpenDay: (day: string) => void;
  onOpenOverview: () => void;
  onOpenDailyLog: () => void;
  onOpenTrends: () => void;
  onOpenSettings: () => void;
  selectedDay?: string;
}

export function CalendarPage({
  data,
  onOpenDay,  onOpenOverview,
  onOpenDailyLog,
  onOpenTrends,
  onOpenSettings,
  selectedDay,
}: CalendarPageProps) {
  const cycle = useCycle(selectedDay);

  const today = localISODate();
  const now = new Date();
  const base = selectedDay ? fromIso(selectedDay) : now; // select panna date irukkura month-la open aagum
  const [cursor, setCursor] = useState({ y: base.getFullYear(), m: base.getMonth() });

  // Month grid: leading/trailing days from neighbouring months complete the weeks.
  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const last = new Date(cursor.y, cursor.m + 1, 0);
    const start = new Date(cursor.y, cursor.m, 1 - first.getDay());
    const end = new Date(cursor.y, cursor.m + 1, 6 - last.getDay()); // day 0 = last of month, so this = last + remaining weekdays
    const days: string[] = [];
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(toIso(d));
    return days;
  }, [cursor]);

  const pastDates = useMemo(() => [addDaysIso(today, -3), addDaysIso(today, -2), addDaysIso(today, -1)], [today]);
  const upcomingDate = useMemo(() => addDaysIso(today, 1), [today]);

  // One range that covers the grid AND the Past / Today / Upcoming sidebar, whatever month is open.
  const rangeStart = grid[0] < pastDates[0] ? grid[0] : pastDates[0];
  const rangeEnd = grid[grid.length - 1] > upcomingDate ? grid[grid.length - 1] : upcomingDate;

  const loadPred = useCallback((s: AbortSignal) => getPredictions(rangeStart, rangeEnd, s), [rangeStart, rangeEnd]);
  const pred = useAsync(loadPred);
  const loadLogs = useCallback((s: AbortSignal) => getLogRange(rangeStart, rangeEnd, s), [rangeStart, rangeEnd]);
  const logs = useAsync(loadLogs);
  const current = useAsync(useCallback((signal: AbortSignal) => getCurrentCycle(selectedDay ?? localISODate(), signal), [selectedDay]));

  const byDate = new Map<string, PredictedDay>((pred.data?.days ?? []).map((d) => [d.date, d]));
  const logged = new Set((logs.data?.logs ?? []).map((l) => l.date));

  const move = (delta: number) =>
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const goToday = () => setCursor({ y: now.getFullYear(), m: now.getMonth() });

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayPhase = phaseOf(byDate.get(today));
  const upcomingPhase = phaseOf(byDate.get(upcomingDate));

  return (
    <div className="animate-fade-up w-full pb-12">
      {cycle.status === "ready" && cycle.data && (
  <LutealShell
    data={data}
    state={cycle.data}
    active="calendar"
    onNavigate={(tab) => {
      if (tab === "overview") onOpenOverview();
      else if (tab === "daily-log") onOpenDailyLog();
      else if (tab === "insights") onOpenTrends();
      else if (tab === "settings") onOpenSettings();
    }}
  />
)}
      <h1 className="sr-only">Cycle calendar</h1>

      {current.data?.phase === "ovulation" && (
        <section className="mb-5 rounded-[22px] border border-emerald-200 bg-gradient-to-r from-[#F0FDF4] to-white p-4 shadow-sm sm:p-5" aria-label="Ovulation calendar summary">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-micro font-bold uppercase tracking-[0.16em] text-[#16A34A]">Current phase</p>
              <h2 className="mt-1 text-lg font-bold text-[#17152B]">Ovulation · Cycle day {current.data.cycleDay ?? "–"}</h2>
              <p className="mt-1 text-sm text-[#68708A]">Solid green is the estimated ovulation day. Light green is the fertile window around it.</p>
            </div>
            <button type="button" onClick={() => onOpenDay(current.data?.date ?? today)} className="rounded-full bg-[#22C55E] px-4 py-2 text-xs font-bold text-white hover:bg-[#16A34A]">
              Open today&apos;s log
            </button>
          </div>
        </section>
      )}

      {current.data?.phase === "follicular" && (
        <section className="mb-5 rounded-[22px] border border-[#E9D5FF] bg-gradient-to-r from-[#FAF5FF] to-white p-4 shadow-sm sm:p-5" aria-label="Follicular calendar summary">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-micro font-bold uppercase tracking-[0.16em] text-[#8B5CF6]">Current phase</p>
              <h2 className="mt-1 text-lg font-bold text-[#17152B]">Follicular phase · Cycle day {current.data.cycleDay ?? "–"}</h2>
              <p className="mt-1 text-sm text-[#68708A]">Use the calendar to jump into any day and see the phase-specific Daily Log.</p>
            </div>
            <button type="button" onClick={() => onOpenDay(current.data?.date ?? today)} className="rounded-full bg-[#8B5CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#7C3AED]">
              Open today&apos;s log
            </button>
          </div>
        </section>
      )}

      <div className="grid w-full grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.8fr)]">
        {/* Month calendar */}
        <section
          aria-labelledby="calendar-month"
          className="w-full space-y-5 rounded-[24px] border border-[#F1DDE8] bg-white p-4 shadow-[0_4px_20px_rgba(23,21,43,0.03)] sm:p-6 md:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="calendar-month" className="text-xl font-bold tracking-tight text-[#17152B] sm:text-2xl" aria-live="polite">
              {monthLabel}
            </h2>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => move(-1)} aria-label="Previous month" className={navBtn}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => move(1)} aria-label="Next month" className={navBtn}>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goToday}
                className="ml-1 cursor-pointer rounded-full bg-[#FFF0F6] px-4 py-1.5 text-xs font-bold text-[#D81B60] transition-colors hover:bg-pink-100"
              >
                Today
              </button>
            </div>
          </div>

          {pred.status === "error" && (
            <InfoCard live>
              {pred.error?.message ?? "Couldn't load the calendar."}{" "}
              <button type="button" onClick={pred.refetch} className="font-semibold underline">
                Try again
              </button>
            </InfoCard>
          )}

          <div className="w-full">
            <div aria-hidden="true" className="grid grid-cols-7 py-1 text-center text-xs font-semibold text-[#8A92A6]">
              {WEEKDAYS.map((d, i) => (
                <span key={d} title={WEEKDAYS_LONG[i]}>
                  {d}
                </span>
              ))}
            </div>

            {Array.from({ length: grid.length / 7 }).map((_, week) => (
              <ul key={week} aria-label={`Week ${week + 1}`} className="mt-2 grid grid-cols-7 gap-x-1 gap-y-2 sm:gap-x-2">
                {grid.slice(week * 7, week * 7 + 7).map((iso) => {
                  const inMonth = fromIso(iso).getMonth() === cursor.m;
                  const info = byDate.get(iso);
                  const phase = inMonth ? phaseOf(info) : null;
                  const inWindow = inMonth && phase !== "ovulation" && !!info?.inOvulationWindow;
                  const isToday = iso === today;
                  const future = iso > today;
                  const hasLog = logged.has(iso);
                  const label = [
                    fmtLong(iso),
                    isToday ? "today" : null,
                    phase ? `${PHASE[phase].label}${info?.type === "estimated" ? " (estimate)" : ""}` : null,
                    inWindow ? "fertile window" : null,
                    hasLog ? "has a log" : null,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <li key={iso} className="flex flex-col items-center justify-center">
                      <button
                        type="button"
                        disabled={future}
                        onClick={() => onOpenDay(iso)}
                        aria-label={label}
                        aria-current={isToday ? "date" : undefined}
                        className={`relative flex h-[46px] w-full max-w-[54px] flex-col items-center justify-center rounded-2xl font-bold transition-all enabled:cursor-pointer disabled:cursor-default sm:h-[48px] ${
                          inWindow
                            ? WINDOW_PILL
                            : phase
                            ? PHASE[phase].pill
                            : inMonth
                              ? "bg-white text-[#17152B] enabled:hover:bg-pink-50"
                              : "text-[#A0AEC0] enabled:hover:bg-gray-50"
                        } ${isToday ? "ring-2 ring-inset ring-[#F43F8F]" : ""} ${
                          iso === selectedDay && !isToday ? "ring-2 ring-inset ring-[#7C3AED]" : ""
                        }`}
                      >
                        <span className="text-xs font-bold leading-none sm:text-sm">{fromIso(iso).getDate()}</span>
                        {hasLog && <span aria-hidden="true" className="mt-1 h-1 w-1 rounded-full bg-current opacity-70" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>

          {/* Legend */}
          <ul
            aria-label="Legend"
            className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 border-t border-[#F1DDE8]/70 pt-4 text-xs font-medium text-[#55607A] sm:gap-x-5"
          >
            {(["menstrual", "ovulation", "luteal", "follicular"] as KnownPhase[]).map((p) => (
              <li key={p} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${PHASE[p].dot}`} />
                {PHASE[p].label}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full border-2 border-[#86EFAC] bg-[#DCFCE7]" />
              Fertile window
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#55607A]" />
              Log saved
            </li>
          </ul>
        </section>

        {/* Details column: Past, Today, Upcoming */}
        <div className="w-full space-y-5 text-left">
          <section aria-labelledby="past-title" className="space-y-2.5">
            <h3 id="past-title" className="text-base font-bold tracking-tight text-[#17152B]">
              Past
            </h3>
            <div className="space-y-2.5">
              {pastDates.map((d) => {
                const phase = phaseOf(byDate.get(d));
                const hasLog = logged.has(d);
                return (
                  <div key={d} className={sideCard}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                          hasLog ? "bg-[#FF2D7A] text-white shadow-sm" : "bg-[#FFF0F6] text-[#D81B60]"
                        }`}
                      >
                        {fromIso(d).getDate()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-bold text-[#17152B] sm:text-sm">
                          {fmtShort(d)} — {phase ? PHASE[phase].label : "No prediction"}
                        </h4>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-[#68708A]">
                          {hasLog ? "Log saved" : "No log yet"}
                        </p>
                      </div>
                    </div>
                    {phase && (
                      <span className={`shrink-0 rounded-full border bg-white px-3 py-1 text-xs font-semibold ${PHASE[phase].badge}`}>
                        {PHASE[phase].short}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="today-title" className="space-y-2.5">
            <h3 id="today-title" className="text-base font-bold tracking-tight text-[#17152B]">
              Today
            </h3>
            <div className="space-y-3.5 rounded-[22px] border border-purple-200/80 bg-[#FAF7FD] p-4 shadow-[0_2px_12px_rgba(108,92,231,0.04)] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#EDE9FE] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#7C3AED]">
                    Today
                  </span>
                  <h4 className="text-xs font-bold text-[#17152B] sm:text-sm">
                    {fmtShort(today)}
                    {todayPhase ? ` — ${PHASE[todayPhase].label}` : ""}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenDay(today)}
                  className="cursor-pointer rounded-full bg-[#7C3AED] px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#6D28D9]"
                >
                  {logged.has(today) ? "Update Log" : "Add Log"}
                </button>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-purple-100 bg-white p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7C3AED]">
                  {logged.has(today) ? (
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>
                <p className="min-w-0 truncate text-xs font-bold text-[#17152B] sm:text-sm">
                  {logged.has(today) ? "Today's log is saved" : "Nothing logged yet today"}
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="upcoming-title" className="space-y-2.5">
            <h3 id="upcoming-title" className="text-base font-bold tracking-tight text-[#17152B]">
              Upcoming
            </h3>
            <div className={sideCard}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] text-sm font-bold text-[#7C3AED]">
                  {fromIso(upcomingDate).getDate()}
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-xs font-bold text-[#17152B] sm:text-sm">
                    {fmtShort(upcomingDate)} — {upcomingPhase ? PHASE[upcomingPhase].label : "No prediction"}
                  </h4>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-[#68708A]">Estimated from your logged cycles</p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-[#68708A]">In 1 day</span>
            </div>
          </section>
        </div>
      </div>

      <InfoCard variant="disclaimer" className="mt-5">
        Phases are estimates from your logged cycles. They are not a diagnosis or a method of contraception.
      </InfoCard>
    </div>
  );
}