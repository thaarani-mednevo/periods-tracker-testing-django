import { GOAL_TRACKING, TRACKING_LABELS, HEIGHT_RANGE, WEIGHT_RANGE } from "../constants";
import type { FeedbackTone, FertilityGoal, OnboardingData, TrackingKey } from "../types";

export interface Feedback {
  tone: FeedbackTone;
  label: string;
  message?: string;
}

export function getCycleFeedback(days: number): Feedback {
  if (days < 21) return { tone: "short", label: "Shorter than the typical range" };
  if (days <= 35) return { tone: "typical", label: "Within the typical range" };
  return { tone: "long", label: "Longer than the typical range" };
}

export function getDurationFeedback(days: number): Feedback {
  if (days <= 1) {
    return {
      tone: "short",
      label: "Shorter than the typical range",
      message:
        "Period length can vary from person to person. If your bleeding pattern has changed significantly, consider discussing it with a healthcare professional.",
    };
  }
  if (days <= 7) {
    return {
      tone: "typical",
      label: "Within the typical range",
      message: "Many periods last around 2–7 days, though your personal pattern may be different.",
    };
  }
  return {
    tone: "long",
    label: "Longer than the typical range",
    message:
      "Bleeding that regularly lasts longer than 7 days may be worth discussing with a healthcare professional.",
  };
}

/** The duration the user actually committed to (manual entry wins when active). */
export function effectiveDuration(data: OnboardingData): number | undefined {
  return data.useManualDuration ? data.manualPeriodDuration : data.periodDuration;
}

export function calcBmi(heightCm?: number, weightKg?: number): number | undefined {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return undefined;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/**
 * BMI only when both measurements are within the accepted ranges. The step card, the BMI dial and the
 * guide artwork all read this, so the number, the label and the picture can never disagree.
 */
export function validBmi(heightCm?: number, weightKg?: number): number | undefined {
  const heightOk = heightCm !== undefined && heightCm >= HEIGHT_RANGE.min && heightCm <= HEIGHT_RANGE.max;
  const weightOk = weightKg !== undefined && weightKg >= WEIGHT_RANGE.min && weightKg <= WEIGHT_RANGE.max;
  return heightOk && weightOk ? calcBmi(heightCm, weightKg) : undefined;
}

export type BmiCategory = "Underweight" | "Normal" | "Overweight" | "Obesity";

/** Key used to pick the matching guide artwork for a BMI category. */
export type BmiVisualKey = "underweight" | "normal" | "overweight" | "obesity";

export const BMI_VISUAL_KEY: Record<BmiCategory, BmiVisualKey> = {
  Underweight: "underweight",
  Normal: "normal",
  Overweight: "overweight",
  Obesity: "obesity",
};

/**
 * The single place that turns measurements into an artwork key. Everything that shows the Step 5 guide
 * reads this, so the picture can never disagree with the BMI card. Undefined until both values are valid.
 */
export function bmiVisualKey(heightCm?: number, weightKg?: number): BmiVisualKey | undefined {
  const bmi = validBmi(heightCm, weightKg);
  return bmi === undefined ? undefined : BMI_VISUAL_KEY[bmiCategory(bmi)];
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obesity";
}

export const BMI_CATEGORY_NOTES: Record<BmiCategory, string> = {
  Underweight: "Below the general reference range of 18.5–24.9.",
  Normal: "Within the general reference range of 18.5–24.9.",
  Overweight: "Above the general reference range of 18.5–24.9.",
  Obesity: "Well above the general reference range of 18.5–24.9.",
};

/** Parse "YYYY-MM-DD" safely into a UTC Date object (eliminates timezone and DST shift bugs). */
export function parseISODate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return undefined;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  // Verify day is valid for the given month and year (including leap years)
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > maxDay) return undefined;
  return new Date(Date.UTC(year, month - 1, day));
}

export function toISODate(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${mm}-${dd}`;
}

export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLongDate(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return "";
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function daysAgo(iso: string): number | undefined {
  const d = parseISODate(iso);
  if (!d) return undefined;
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((todayUtc - d.getTime()) / 86_400_000);
}

export function pluralDays(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

export function reminderPhrase(days: number): string {
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

/** Default tracking toggles for a goal: required items on, everything else off. */
export function trackingForGoal(goal: FertilityGoal): OnboardingData["fertilityTracking"] {
  const base: OnboardingData["fertilityTracking"] = {
    intercourse: false,
    cervicalMucus: false,
    bbt: false,
    lhTest: false,
    symptoms: false,
    mood: false,
    libido: false,
  };
  if (!goal) return base;
  for (const key of GOAL_TRACKING[goal].required) base[key] = true;
  return base;
}

export function trackingLabel(goal: FertilityGoal, key: TrackingKey): string {
  if (!goal) return TRACKING_LABELS[key];
  return GOAL_TRACKING[goal].labels?.[key] ?? TRACKING_LABELS[key];
}

/** Rough completion percentage of the user's profile across all inputs. */
export function profileCompletion(data: OnboardingData): number {
  const checks = [
    !!data.name.trim(),
    !!data.age,
    !!data.lastPeriod,
    !!data.cycleLengthOption,
    !!data.periodRegularity,
    effectiveDuration(data) !== undefined,
    !!data.height && !!data.weight,
    data.medicalConditions.length > 0,
    data.takingMedication !== null,
    data.symptoms.length + data.moods.length > 0,
    !!data.birthControl,
    !!data.fertilityGoal,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
