import {
  CalendarDays,
  Sparkles,
  Save,
  Loader2,
  Zap,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { InfoCard } from "../../../Elements/infoCard/InfoCard";
import { secondaryBtn } from "../../../Elements/navigationButtons/NavigationButtons";
import { useAsync } from "../../../hooks/useAsync";
import { addDays, longDate, toIso } from "../../../lib/isoDate";

import {
  getPredictions,
  localISODate,
  type CyclePhase,
} from "../../../services/cycle";

import {
 ENERGIES,
  MOODS,
  MUCUS,
  emptyLog,
  getDailyLog,
  getLogRange,
  saveDailyLog,
  type DailyLog,
} from "../../../services/logs";

import { getPhaseInsight } from "../../../services/insights";

import type { FertilityTracking, OnboardingData } from "../../../types";
import type { Journey } from "../../../services/settings";
import type { CycleInfo } from "../shared/daily-log/phaseCopy";
import { CycleDayStrip } from "../shared/daily-log/CycleDayStrip";

import {
  NumberField,
  Section,
  TimeField,
} from "../../dailyLog/fields";

import { MedicationPanel } from "../../dailyLog/MedicationPanel";
import type { PhaseViewProps } from "../types";

import { LutealShell } from "../luteal/components/Shell";

import moodHappy from "../../../assets/phases/follicular/mood_happy.png";
import moodCalm from "../../../assets/phases/follicular/mood_calm.png";
import moodNeutral from "../../../assets/phases/follicular/mood_neutral.png";
import moodIrritable from "../../../assets/phases/follicular/mood_irritable.png";
import moodSad from "../../../assets/phases/follicular/mood_sad.png";

import mucusDry from "../../../assets/phases/follicular/mucus_dry.png";
import mucusSticky from "../../../assets/phases/follicular/mucus_sticky.png";
import mucusCreamy from "../../../assets/phases/follicular/mucus_creamy.png";
import mucusWatery from "../../../assets/phases/follicular/mucus_watery.png";
import mucusEggWhite from "../../../assets/phases/follicular/mucus_eggwhite.png";

interface Props {
  data: OnboardingData;
  state: PhaseViewProps["state"];
  /** Settings journey: only used on ovulation days. */
  journey?: Journey;
  /** Settings tracking toggles: only used on ovulation days. */
  tracking?: Partial<FertilityTracking>;
  initialDay?: string;
  onDateChange: (day: string) => void;
  onNavigate: (
    tab:
      | "overview"
      | "calendar"
      | "daily-log"
      | "insights"
      | "settings",
  ) => void;
}

const PHASE_TITLE: Record<CyclePhase, string> = {
  menstrual: "Menstruation",
  follicular: "Follicular Phase",
  ovulation: "Ovulation",
  luteal: "Luteal Phase",
  unknown: "Daily Log",
};

const MOOD_IMAGES: Record<string, string> = {
  Happy: moodHappy,
  Calm: moodCalm,
  Neutral: moodNeutral,
  Irritable: moodIrritable,
  Sad: moodSad,
};

const MUCUS_IMAGE: Record<string, string> = {
  Dry: mucusDry,
  Sticky: mucusSticky,
  Creamy: mucusCreamy,
  Watery: mucusWatery,
  "Egg white": mucusEggWhite,
};

const MUCUS_META: Record<
  string,
  {
    subtitle: string;
    fertility: string;
  }
> = {
  Dry: {
    subtitle: "Minimal moisture",
    fertility: "Low fertility",
  },
  Sticky: {
    subtitle: "Adhesive / Tacky",
    fertility: "Low fertility",
  },
  Creamy: {
    subtitle: "Lotion-like",
    fertility: "Transitional",
  },
  Watery: {
    subtitle: "Clear & fluid",
    fertility: "High fertility",
  },
  "Egg white": {
    subtitle: "Stretchy & clear",
    fertility: "Peak fertility",
  },
};

function firstFieldError(err: unknown) {
  const e = err as {
    message?: string;
    fieldErrors?: Record<string, string[]>;
  };

  const first = e.fieldErrors
    ? Object.values(e.fieldErrors).flat()[0]
    : undefined;

  return first
    ? `${e.message ?? "Couldn't save."} ${first}`
    : e.message ?? "Couldn't save. Please try again.";
}

function buildDates(center: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(center, i - 3));
}

function buildCycleInfo(
  days: {
    date: string;
    phase: CyclePhase;
    cycleDay: number | null;
  }[],
): (date: string) => CycleInfo {
  const map = new Map(
    days.map((d) => [
      d.date,
      {
        cycleDay: d.cycleDay,
        phase: d.phase,
      },
    ]),
  );

  return (date) =>
    map.get(date) ?? {
      cycleDay: null,
      phase: "unknown",
    };
}

export function FollicularDailyLog({
  data,
  state,
  journey = "cycle_tracking",
  tracking = {},
  initialDay,
  onDateChange,
  onNavigate,
}: Props) {
  const today = localISODate();

  const [day, setDay] = useState(
    initialDay ?? state.date ?? today,
  );

  const [draft, setDraft] = useState<DailyLog | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dates = useMemo(
    () => buildDates(day),
    [day],
  );

  const rangeStart = dates[0];
  const rangeEnd = dates[dates.length - 1];

  const loadLog = useCallback(
    (signal: AbortSignal) =>
      getDailyLog(day, signal),
    [day],
  );

  const logRes = useAsync(loadLog);

  const loadPredictions = useCallback(
    (signal: AbortSignal) =>
      getPredictions(
        rangeStart,
        rangeEnd,
        signal,
      ),
    [rangeStart, rangeEnd],
  );

  const predRes = useAsync(loadPredictions);

  const loadMarks = useCallback(
    (signal: AbortSignal) =>
      getLogRange(
        rangeStart,
        rangeEnd,
        signal,
      ),
    [rangeStart, rangeEnd],
  );

  const marksRes = useAsync(loadMarks);

  const loadInsight = useCallback(
    (signal: AbortSignal) =>
      getPhaseInsight(day, signal),
    [day],
  );

  const insightRes = useAsync(loadInsight);

  const serverLog =
    logRes.data?.date === day
      ? logRes.data
      : null;

  const log =
    draft ??
    serverLog ??
    emptyLog(day);

  const predicted =
    predRes.data?.days ?? [];

  const selectedInfo =
    predicted.find(
      (d) => d.date === day,
    ) ?? {
      date: day,
      phase: state.phase,
      cycleDay: state.cycleDay,
    };

  const cycleInfo =
    buildCycleInfo(predicted);

  const logged = new Set(
    (marksRes.data?.logs ?? []).map(
      (l) => l.date,
    ),
  );

  const update = <
    K extends keyof DailyLog
  >(
    key: K,
    value: DailyLog[K],
  ) => {
    setDraft((current) => ({
      ...(current ?? log),
      [key]: value,
    }));

    setMessage(null);
  };

  const chooseDay = (next: string) => {
    setDraft(null);
    setMessage(null);
    setError(null);

    setDay(next);
    onDateChange(next);
  };

  const persist = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await saveDailyLog(day, log);

      setDraft(null);

      setMessage(
        "Daily log saved.",
      );

      marksRes.refetch();
      logRes.refetch();
    } catch (err) {
      setError(firstFieldError(err));
    } finally {
      setSaving(false);
    }
  };

  const moveMonth = (delta: number) => {
    const d = new Date(
      `${day}T12:00:00`,
    );

    d.setMonth(
      d.getMonth() + delta,
    );

    chooseDay(toIso(d));
  };

  const phase =
    selectedInfo.phase;

  const insight =
    insightRes.data?.insight;

  const showFollicular =
    phase === "follicular" ||
    phase === "ovulation";

  // Ovulation day + (TTC or Prevent) => fertility layout. Both off => same layout as Follicular.
  const fertilityMode =
    phase === "ovulation" &&
    (journey === "trying_to_conceive" || journey === "pregnancy_prevention");
  const ttc = journey === "trying_to_conceive";
  const cardOn = (key: keyof FertilityTracking, logged: boolean) =>
    !fertilityMode || tracking[key] === true || logged;
  const showBbt = cardOn("bbt", log.bbtCelsius != null);
  const showMucus = cardOn("cervicalMucus", log.cervicalMucus != null);
  const showLh = cardOn("lhTest", log.lhTest != null);
  const showLibido = cardOn("libido", log.libido != null);
  const showIntercourse = fertilityMode && (tracking.intercourse === true || log.intercourse != null);

  if (logRes.status === "error") {
    return (
      <div className="animate-fade-up pb-12">
        <LutealShell
          data={data}
          state={state}
          active="daily-log"
          onNavigate={onNavigate}
        />

        <InfoCard live>
          {logRes.error?.message ??
            "Couldn't load this day."}{" "}

          <button
            type="button"
            onClick={logRes.refetch}
            className="font-semibold underline"
          >
            Try again
          </button>
        </InfoCard>
      </div>
    );
  }

  return (
    <div className="animate-fade-up pb-12">

      {/* PHASE NAVIGATION */}

      <LutealShell
        data={data}
        state={state}
        active="daily-log"
        onNavigate={onNavigate}
      />

      {/* CYCLE DAY STRIP */}

      <CycleDayStrip
        today={today}
        dates={dates}
        selectedDate={day}
        info={{
          cycleDay:
            selectedInfo.cycleDay,
          phase:
            selectedInfo.phase,
        }}
        cycleInfo={cycleInfo}
        isLogged={(d) =>
          logged.has(d)
        }
        onSelect={chooseDay}
        onToday={() =>
          chooseDay(today)
        }
        onShiftWeek={(n) =>
          chooseDay(
            addDays(day, n * 7),
          )
        }
        onShiftMonth={moveMonth}
      />

      {/* HEADER */}

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-micro font-bold uppercase tracking-[0.16em] text-rose-ink">
            Daily log
          </p>

          <h1 className="mt-1 text-headline font-bold tracking-[-0.02em] text-ink">
            {longDate(day)}
          </h1>

          <p className="mt-1 text-body text-ink-muted">
            {PHASE_TITLE[phase]} ·{" "}
            {selectedInfo.cycleDay
              ? `Cycle day ${selectedInfo.cycleDay}`
              : "cycle day unavailable"}
          </p>
        </div>

        {phase !== "unknown" && (
          <span className="rounded-full bg-[#F3E8FF] px-3 py-1.5 text-xs font-bold text-[#7C3AED]">
            {PHASE_TITLE[phase]}
          </span>
        )}
      </div>

      {/* AI INSIGHT */}

      <section className="mt-5 rounded-[22px] border border-[#F3E8FF] bg-gradient-to-r from-[#F7F0FF] via-[#FBF3FC] to-[#FFF0F6] p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#8B5CF6]">
          <Sparkles className="size-4" />
          AI WELLNESS INSIGHT
        </div>

        <p className="mt-2 text-body text-ink">
          {insight?.summary ??
            `Log a few ${phase === "ovulation" ? "ovulation" : "follicular"} signs and Ava can build a more useful phase insight for you.`}
        </p>

        {insight?.tips?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {insight.tips.map(
              (tip) => (
                <span
                  key={tip}
                  className="rounded-full border border-purple-200 bg-white/90 px-3 py-1 text-xs font-semibold text-ink-muted"
                >
                  {tip}
                </span>
              ),
            )}
          </div>
        ) : null}
      </section>

      {showFollicular && (
        <>
          {/* FERTILITY NOTE (TTC / Prevent only) */}

          {fertilityMode && (
            <div className="rounded-[18px] border border-[#F3D5E2] bg-[#FFF7FB] px-4 py-3 text-body text-ink">
              {ttc
                ? "Trying to conceive: your fertile window is open. Log LH, mucus and BBT to spot your peak days."
                : "Pregnancy prevention: this is a higher-chance day. Cycle tracking alone is not a guaranteed method — use protection."}
            </div>
          )}

          {/* BBT */}

          <div className={showBbt ? "contents" : "hidden"}>

          <Section
            id="follicular-bbt"
            title="Basal Body Temperature"
            hint="Measure at the same time each morning, before getting up."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Temperature"
                unit="°C"
                min={35}
                max={38.5}
                step={0.01}
                value={log.bbtCelsius}
                onChange={(v) =>
                  update(
                    "bbtCelsius",
                    v,
                  )
                }
              />

              <TimeField
                label="Time measured"
                value={log.bbtTime}
                onChange={(v) =>
                  update(
                    "bbtTime",
                    v,
                  )
                }
              />
            </div>

            {/* CONNECTED THERMOMETER */}

            <div className="mt-4 rounded-[18px] border border-[#E9D5FF] bg-[#FAF5FF] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Connected Thermometer
                  </p>

                  <p className="mt-1 text-xs text-ink-muted">
                    Automatic BBT sync
                  </p>
                </div>

                <button
                  type="button"
                  disabled
                  className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-semibold text-ink-muted opacity-70"
                >
                  Not connected
                </button>
              </div>

              <div className="mt-3 border-t border-[#E9D5FF] pt-3">
                <p className="text-xs font-semibold text-[#7C3AED]">
                  Manual Entry
                </p>

                <p className="mt-1 text-xs text-ink-muted">
                  Enter your waking temperature above.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[16px] bg-[#FAF5FF] p-3 text-xs text-[#68708A]">
              <span className="font-bold text-[#7C3AED]">
                Pre-ovulatory pattern:
              </span>{" "}
              low and steady readings are commonly seen before the thermal shift.
            </div>
          </Section>
          </div>

          {/* MOOD + ENERGY */}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">

            {/* MOOD CARD */}

            <section className="rounded-[22px] border border-[#F3D5E2] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-[#FFF0F6]">
                      <img
                        src={moodHappy}
                        alt=""
                        className="size-7 object-contain"
                      />
                    </div>

                    <h2 className="text-body font-semibold text-ink">
                      Mood
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-ink-muted">
                    Select how you feel today
                  </p>
                </div>

                <span className="text-xs text-ink-muted">
                  ⓘ
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {MOODS.map(
                  (mood) => {
                    const image =
                      MOOD_IMAGES[mood];

                    const selected =
                      log.mood === mood;

                    return (
                      <button
                        key={mood}
                        type="button"
                        aria-pressed={
                          selected
                        }
                        onClick={() =>
                          update(
                            "mood",
                            mood,
                          )
                        }
                        className={`flex min-h-[96px] flex-col items-center justify-center rounded-2xl border px-2 py-2 transition ${
                          selected
                            ? "border-[#F43F8F] bg-[#FFF1F7]"
                            : "border-[#F3D5E2] bg-white hover:bg-[#FFF8FB]"
                        }`}
                      >
                        {image && (
                          <img
                            src={image}
                            alt=""
                            className="mb-1 h-12 w-12 object-contain"
                          />
                        )}

                        <span
                          className={`text-xs font-semibold ${
                            selected
                              ? "text-[#F43F8F]"
                              : "text-ink-muted"
                          }`}
                        >
                          {mood}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </section>

            {/* ENERGY CARD */}

            <section className="rounded-[22px] border border-[#F3D5E2] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#FFF0F6]">
                      <Zap className="size-4 fill-[#F43F8F] text-[#F43F8F]" />
                    </div>

                    <h2 className="text-body font-semibold text-ink">
                      Energy Level
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-ink-muted">
                    How is your energy today?
                  </p>
                </div>

                <span className="text-xs text-ink-muted">
                  ⓘ
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {ENERGIES.map(
                  (energy) => {
                    const selected =
                      log.energy === energy;

                    const iconColor =
                      energy === "Low"
                        ? "text-[#EC4899]"
                        : energy === "Moderate"
                          ? "text-[#F59E0B]"
                          : "text-[#EF4444]";

                    return (
                      <button
                        key={energy}
                        type="button"
                        aria-pressed={
                          selected
                        }
                        onClick={() =>
                          update(
                            "energy",
                            energy,
                          )
                        }
                        className={`flex min-h-[96px] flex-col items-center justify-center rounded-2xl border px-2 py-2 transition ${
                          selected
                            ? "border-[#F43F8F] bg-[#FFF1F7]"
                            : "border-[#F3D5E2] bg-white hover:bg-[#FFF8FB]"
                        }`}
                      >
                        <Zap
                          className={`size-4 fill-current ${iconColor}`}
                        />

                        <span
                          className={`mt-2 text-xs font-semibold ${
                            selected
                              ? "text-[#F43F8F]"
                              : "text-ink"
                          }`}
                        >
                          {energy}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </section>
          </div>

          {/* CERVICAL MUCUS */}

          <div className={showMucus ? "contents" : "hidden"}>
          <Section
            id="follicular-mucus"
            title="Cervical Mucus & Discharge"
            hint="Key indicator of natural fertility and estrogen progression"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {MUCUS.map(
                (mucus) => {
                  const selected =
                    log.cervicalMucus ===
                    mucus;

                  const image =
                    MUCUS_IMAGE[mucus];

                  const meta =
                    MUCUS_META[mucus];

                  const fertilityClass =
                    meta.fertility ===
                    "Low fertility"
                      ? "border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]"
                      : meta.fertility ===
                          "Transitional"
                        ? "border-[#FBCFE8] bg-[#FFF0F6] text-[#EC4899]"
                        : meta.fertility ===
                            "High fertility"
                          ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                          : "border-[#FBCFE8] bg-[#FFF0F6] text-[#EC4899]";

                  return (
                    <button
                      key={mucus}
                      type="button"
                      aria-pressed={
                        selected
                      }
                      onClick={() =>
                        update(
                          "cervicalMucus",
                          mucus,
                        )
                      }
                      className={`relative flex min-h-[128px] flex-col items-center justify-center rounded-[18px] border px-3 py-3 text-center transition ${
                        selected
                          ? "border-2 border-[#FF3B8D] bg-[#FFF0F6]"
                          : "border-[#ECEAF0] bg-white hover:border-[#F7B8D2]"
                      }`}
                    >
                      {selected && (
                        <span className="absolute right-2 top-2 size-2 rounded-full bg-[#FF3B8D]" />
                      )}

                      <img
                        src={image}
                        alt=""
                        className="size-12 object-contain"
                      />

                      <span className="mt-2 text-xs font-bold text-ink">
                        {mucus}
                      </span>

                      <span className="mt-0.5 text-[9px] text-ink-muted">
                        {meta.subtitle}
                      </span>

                      <span
                        className={`mt-2 rounded-full border px-2 py-0.5 text-[8px] font-semibold ${fertilityClass}`}
                      >
                        {meta.fertility}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </Section>
          </div>

          {/* INTERCOURSE (TTC / Prevent, only if tracking is on) */}

          {showIntercourse && (
            <Section id="ovulation-intercourse" title="Intercourse" hint={ttc ? "Helps time your best days to try." : "Compare logged dates with your fertile window."}>
              <div className="flex gap-2">
                {([[true, "Yes"], [false, "No"]] as const).map(([val, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => update("intercourse", val)}
                    className={`rounded-full border px-5 py-2 text-sm font-semibold ${log.intercourse === val ? "border-[#F43F8F] bg-[#FFF0F6] text-[#F43F8F]" : "border-[#F3D5E2] bg-white text-ink-muted"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* LH + LIBIDO */}

          <div className="grid gap-4 lg:grid-cols-2">
  {/* LH / OVULATION TEST */}
  <div className={showLh ? "contents" : "hidden"}>
  <section className="rounded-[22px] border border-[#F3D5E2] bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#FFF0F6]">
            <span className="text-sm text-[#F43F8F]">♜</span>
          </div>

          <h2 className="text-body font-semibold text-ink">
            LH / Ovulation Test
          </h2>
        </div>

        <p className="mt-1 text-xs text-ink-muted">
          Log your daily ovulation predictor kit test line intensity.
        </p>
      </div>

      <span className="pt-1 text-[9px] font-medium text-ink-muted">
        OPK Strip Tracker
      </span>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[
        {
          value: "Negative",
          range: "< 10 mIU",
          lines: 1,
        },
        {
          value: "Low",
          range: "10–25 mIU",
          lines: 2,
        },
        {
          value: "High",
          range: "25–40 mIU",
          lines: 2,
        },
        {
          value: "Peak",
          range: "≥ 40 mIU",
          lines: 2,
        },
      ].map((item) => {
        const selected =
          log.lhTest === item.value;

        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              update("lhTest", item.value as DailyLog["lhTest"])
            }
            className={[
              "flex min-h-[108px] flex-col items-center justify-center rounded-[16px] border px-3 py-3 transition",
              selected
                ? "border-[#F43F8F] bg-[#FFF0F6]"
                : "border-[#E8E9EE] bg-[#FAFBFC] hover:border-[#F7B8D2]",
            ].join(" ")}
          >
            <div className="flex h-3 w-9 items-center justify-center gap-1 rounded-[3px] border border-[#D8DCE4] bg-white">
              {Array.from({
                length: item.lines,
              }).map((_, index) => (
                <span
                  key={index}
                  className="h-2 w-[2px] rounded-full bg-[#F43F8F]"
                />
              ))}
            </div>

            <span
              className={[
                "mt-4 text-xs font-bold",
                selected
                  ? "text-[#F43F8F]"
                  : "text-ink",
              ].join(" ")}
            >
              {item.value}
            </span>

            <span className="mt-1 text-[9px] text-ink-muted">
              {item.range}
            </span>
          </button>
        );
      })}
    </div>

    <div className="mt-3 border-t border-[#F3E5EC] pt-3">
      <p className="text-[9px] text-ink-muted">
        <span className="mr-1 text-[#F43F8F]">ⓘ</span>
        Peak LH stimulates egg release within 24 to 36 hours.
      </p>
    </div>
  </section>
  </div>

  {/* LIBIDO */}
  <div className={showLibido ? "contents" : "hidden"}>
  <section className="rounded-[22px] border border-[#F3D5E2] bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#FFF0F6]">
            <span className="text-sm text-[#F43F8F]">◕</span>
          </div>

          <h2 className="text-body font-semibold text-ink">
            Libido & Desire Level
          </h2>
        </div>

        <p className="mt-1 text-xs text-ink-muted">
          Track your natural sex drive and vitality throughout the cycle.
        </p>
      </div>

      <span className="pt-1 text-[9px] font-medium text-ink-muted">
        Estrogen Peak Metric
      </span>
    </div>

    <div className="mt-4 grid grid-cols-3 gap-2">
      {[
        {
          value: "Low",
          description: "Calm & resting",
          icon: "♡",
          iconClass: "text-[#A855F7]",
        },
        {
          value: "Medium",
          description: "Moderate desire",
          icon: "✣",
          iconClass: "text-[#F43F8F]",
        },
        {
          value: "High",
          description: "Surging drive",
          icon: "♥",
          iconClass: "text-[#F43F8F]",
        },
      ].map((item) => {
        const selected =
          log.libido === item.value;

        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={selected}
            onClick={() =>
             update("libido", item.value as DailyLog["libido"])
            }
            className={[
              "flex min-h-[108px] flex-col items-center justify-center rounded-[16px] border px-3 py-3 transition",
              selected
                ? "border-[#F43F8F] bg-[#FFF0F6]"
                : "border-[#E8E9EE] bg-[#FAFBFC] hover:border-[#F7B8D2]",
            ].join(" ")}
          >
            <span
              className={`text-lg ${item.iconClass}`}
            >
              {item.icon}
            </span>

            <span
              className={[
                "mt-3 text-xs font-bold",
                selected
                  ? "text-[#F43F8F]"
                  : "text-ink",
              ].join(" ")}
            >
              {item.value}
            </span>

            <span className="mt-1 text-[9px] text-ink-muted">
              {item.description}
            </span>
          </button>
        );
      })}
    </div>

    <div className="mt-3 border-t border-[#F3E5EC] pt-3">
      <p className="text-[9px] text-ink-muted">
        <span className="mr-1 text-[#F43F8F]">✣</span>
        Libido naturally surges as estrogen rises towards ovulation.
      </p>
    </div>
  </section>
  </div>
</div>
        </>
      )}

      {/* Symptoms & Notes intentionally removed */}

      <MedicationPanel day={day} />

      {error && (
        <InfoCard live>
          {error}
        </InfoCard>
      )}

      {message && (
        <p
          role="status"
          className="rounded-full bg-[#F0FDF4] px-4 py-2 text-sm font-semibold text-[#15803D]"
        >
          {message}
        </p>
      )}

      {/* SAVE */}

      <div className="mt-2 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            void persist()
          }
          disabled={
            saving ||
            logRes.status ===
              "loading"
          }
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F43F8F] px-7 py-3 font-semibold text-white shadow-[0_6px_18px_rgba(244,63,143,0.28)] disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}

          {saving
            ? "Saving…"
            : "Save log"}
        </button>

        <button
          type="button"
          onClick={() =>
            onNavigate(
              "calendar",
            )
          }
          className={secondaryBtn}
        >
          <CalendarDays className="size-[18px]" />
          Open calendar
        </button>
      </div>

      <p className="mt-4 text-caption text-ink-muted">
        Your log is saved to the Django backend.
      </p>
    </div>
  );
}