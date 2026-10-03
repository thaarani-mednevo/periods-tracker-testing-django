import { addDays, parseIso } from "../../../lib/isoDate";
import type { DailyLog, LhTest, Libido, Mucus } from "../../../services/logs";
import type { Journey } from "../../../services/settings";

/**
 * Pure helpers for the ovulation screens. Every date comes from the backend engine
 * (`state.ovulation.date`); nothing here predicts anything new, it only labels the window around it.
 */

const MS_PER_DAY = 86_400_000;
const diffDays = (from: string, to: string) => Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / MS_PER_DAY);
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// ---------------------------------------------------------------- fertile window
export interface FertileWindow {
  /** 5 days before ovulation. */
  start: string;
  /** 1 day after ovulation. */
  end: string;
  /** First of the 3 highest-chance days (2 days before ovulation). */
  bestStart: string;
  /** Usually the single most fertile day (the day before ovulation). */
  peakDay: string;
  ovulation: string;
}

export function fertileWindow(ovulationDate?: string | null): FertileWindow | null {
  if (!ovulationDate) return null;
  return {
    start: addDays(ovulationDate, -5),
    end: addDays(ovulationDate, 1),
    bestStart: addDays(ovulationDate, -2),
    peakDay: addDays(ovulationDate, -1),
    ovulation: ovulationDate,
  };
}

export type WindowStatus =
  | { kind: "before"; days: number }
  | { kind: "open"; days: number }
  | { kind: "peak"; days: number }
  | { kind: "after"; days: number };

/** `days` = days until the window opens (before), until ovulation (open / peak) or since it closed (after). */
export function windowStatus(today: string, w: FertileWindow): WindowStatus {
  if (today < w.start) return { kind: "before", days: diffDays(today, w.start) };
  if (today > w.end) return { kind: "after", days: diffDays(w.end, today) };
  if (today >= w.bestStart && today <= w.ovulation) return { kind: "peak", days: Math.max(diffDays(today, w.ovulation), 0) };
  return { kind: "open", days: diffDays(today, w.ovulation) };
}

/** Visual-only fertility level taken from the window position. It is a label, never a score. */
export function fertilityLevel(s: WindowStatus): { label: string; percent: number; note: string } {
  switch (s.kind) {
    case "before":
      return { label: "Low", percent: 12, note: `window opens in ${plural(s.days, "day")}` };
    case "open":
      // days < 0: the last day of the window, right after the estimated ovulation day.
      return s.days < 0
        ? { label: "Falling", percent: 35, note: "last day of your window" }
        : { label: "Rising", percent: 50, note: `peaks in ${plural(s.days, "day")}` };
    case "peak":
      return { label: "Peak", percent: 92, note: s.days > 0 ? `ovulation in ${plural(s.days, "day")}` : "ovulation day" };
    default:
      return { label: "Low", percent: 15, note: `window closed ${plural(s.days, "day")} ago` };
  }
}

/** Banner copy. The two fertility journeys use the same facts, only the framing differs. */
export function statusCopy(s: WindowStatus, journey: Exclude<Journey, "cycle_tracking">) {
  const ttc = journey === "trying_to_conceive";
  switch (s.kind) {
    case "before":
      return {
        title: ttc ? `Your fertile window opens in ${plural(s.days, "day")}` : "Lower chance of pregnancy for now (estimate)",
        text: ttc
          ? "Keep logging cervical mucus and temperature so you can spot it early."
          : `Your fertile window is estimated to open in ${plural(s.days, "day")}. Estimates can be off.`,
        tone: "calm" as const,
      };
    case "open":
      return {
        title: ttc ? "You are in your fertile window" : "Higher chance of pregnancy today",
        text:
          s.days < 0
            ? ttc
              ? "Ovulation has likely just passed. Today is the last day of your estimated window."
              : "Today is the last day of your estimated fertile window."
            : ttc
              ? "Chances rise as ovulation gets closer."
              : "You are inside your estimated fertile window.",
        tone: "alert" as const,
      };
    case "peak":
      return {
        title: ttc ? "These are your best days to try" : "Highest chance of pregnancy right now",
        text: ttc
          ? "The two days before ovulation and ovulation day are usually the most fertile."
          : "These are the days with the highest estimated chance of pregnancy.",
        tone: "alert" as const,
      };
    default:
      return {
        title: ttc ? "Your fertile window has passed for this cycle" : "Lower chance of pregnancy (estimate)",
        text: `It closed ${plural(s.days, "day")} ago. ${ttc ? "Your next window starts after your next period." : "Estimates can be off, so keep using your usual protection."}`,
        tone: "calm" as const,
      };
  }
}

// ---------------------------------------------------------------- BBT
export interface BbtAnalysis {
  /** Reading logged for the selected day, if any. */
  latest: number | null;
  /** Average of earlier readings (needs at least 3). */
  baseline: number | null;
  delta: number | null;
  state: "no_reading" | "not_enough" | "rising" | "steady";
  points: { date: string; value: number }[];
}

export const RISE_THRESHOLD_C = 0.2;
export const toFahrenheit = (c: number) => (c * 9) / 5 + 32;

export function analyseBbt(logs: DailyLog[], day: string): BbtAnalysis {
  const points = logs
    .filter((l): l is DailyLog & { bbtCelsius: number } => l.bbtCelsius != null && l.date <= day)
    .map((l) => ({ date: l.date, value: l.bbtCelsius }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const latest = points.find((p) => p.date === day)?.value ?? null;
  const earlier = points.filter((p) => p.date < day);
  const baseline = earlier.length >= 3 ? earlier.reduce((sum, p) => sum + p.value, 0) / earlier.length : null;
  const delta = latest != null && baseline != null ? latest - baseline : null;

  const state: BbtAnalysis["state"] =
    latest == null ? "no_reading" : delta == null ? "not_enough" : delta >= RISE_THRESHOLD_C ? "rising" : "steady";
  return { latest, baseline, delta, state, points };
}

// ---------------------------------------------------------------- what a logged value means
export const MUCUS_META: Record<Mucus, { description: string; badge: string }> = {
  Dry: { description: "Little to no mucus", badge: "Lower fertility" },
  Sticky: { description: "Tacky, crumbly consistency", badge: "Lower fertility" },
  Creamy: { description: "Lotion-like consistency", badge: "Fertility rising" },
  Watery: { description: "Clear and wet", badge: "High fertility" },
  "Egg white": { description: "Stretchy, clear consistency", badge: "Peak fertility" },
};

export const LH_META: Record<LhTest, string> = {
  Negative: "No LH surge detected",
  Low: "Low LH level",
  High: "LH is rising, ovulation may be near",
  Peak: "Surge detected, ovulation usually follows in 24 to 36 hours",
};

export const LIBIDO_META: Record<Libido, string> = {
  Low: "Logged as low today",
  Medium: "Logged as moderate today",
  High: "Libido often rises around ovulation",
};

/** Filled segments (out of 7) for the Energy / Mood meters on the default screen. */
export const ENERGY_LEVEL: Record<string, number> = { Low: 2, Moderate: 4, High: 6 };
export const MOOD_LEVEL: Record<string, number> = { Happy: 6, Calm: 5, Neutral: 4, Irritable: 2, Sad: 1 };