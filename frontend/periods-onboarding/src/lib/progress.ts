import {
  BIRTH_CONTROL_CATEGORIES,
  BIRTH_CONTROL_OPTIONS,
  CYCLE_LENGTH_OPTIONS,
  FERTILITY_GOAL_OPTIONS,
  INITIAL_DATA,
  REGULARITY_OPTIONS,
  STEP_IDS,
  TOTAL_STEPS,
} from "../constants";
import type {
  BirthControlAnswer,
  BirthControlCategory,
  CycleLengthOption,
  FertilityGoal,
  OnboardingData,
  PeriodRegularity,
  ReminderDays,
  StepId,
} from "../types";

/**
 * Saved setup progress.
 *
 * One structured object holds everything needed to put the user back exactly where they were: the
 * step they were on, the steps they finished, and the full answer set (which already covers the
 * date, cycle, duration — including the manual value — health, medical, symptom, notification,
 * birth-control, fertility and profile fields).
 */
export interface OnboardingProgress {
  currentStep: StepId;
  completedSteps: StepId[];
  data: OnboardingData;
  updatedAt: string;
}

import { getDevPatient } from "./devPatient";

// Saved per patient, so one patient's answers (medications included) never show up for another.
const scope = () => {
  const who = getDevPatient();
  return who ? `.${who}` : "";
};
const progressKey = () => `mednevo.onboarding.progress${scope()}`;
const completedKey = () => `mednevo.onboarding.completed${scope()}`;

/** localStorage is unavailable in private modes and blocked-cookie setups; never let that throw. */
function safeStorage(): Storage | null {
  try {
    const probe = "__mednevo_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrows `value` to one of `allowed` without a cast — the match itself proves the type. */
function oneOf<T extends string | number>(allowed: readonly T[], value: unknown): T | undefined {
  return allowed.find((a) => a === value);
}

function isStepId(value: unknown): value is StepId {
  return oneOf(STEP_IDS, value) !== undefined;
}

const str = (v: unknown, fallback: string): string => (typeof v === "string" ? v : fallback);
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === "boolean" ? v : fallback);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const strList = (v: unknown, fallback: string[]): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : fallback);

const REMINDER_DAYS: readonly ReminderDays[] = [1, 3, 5];
const CYCLE_OPTIONS: readonly CycleLengthOption[] = ["", ...CYCLE_LENGTH_OPTIONS.map((o) => o.value)];
const REGULARITY: readonly PeriodRegularity[] = ["", ...REGULARITY_OPTIONS.map((o) => o.value)];
const BC_ANSWERS: readonly BirthControlAnswer[] = ["", ...BIRTH_CONTROL_OPTIONS.map((o) => o.value)];
const BC_CATEGORIES: readonly BirthControlCategory[] = ["", ...BIRTH_CONTROL_CATEGORIES.map((c) => c.value)];
const GOALS: readonly FertilityGoal[] = ["", ...FERTILITY_GOAL_OPTIONS.map((o) => o.value)];

/**
 * Field-by-field restore. Every value is checked against its real type (and unions against their
 * allowed members), so an outdated or tampered payload — e.g. a reminder of 7 days saved before the
 * 1/3/5 options, or a height stored as text — falls back to the default instead of entering state.
 */
function sanitizeData(saved: Json): OnboardingData {
  const d = INITIAL_DATA;
  const tracking = isRecord(saved.fertilityTracking) ? saved.fertilityTracking : {};
  const medications = strList(saved.medications, d.medications);
  return {
    lastPeriod: str(saved.lastPeriod, d.lastPeriod),
    name: str(saved.name, d.name),
    age: num(saved.age),
    cycleLengthOption: oneOf(CYCLE_OPTIONS, saved.cycleLengthOption) ?? d.cycleLengthOption,
    cycleLength: num(saved.cycleLength),
    periodRegularity: oneOf(REGULARITY, saved.periodRegularity) ?? d.periodRegularity,
    periodDuration: num(saved.periodDuration) ?? d.periodDuration,
    useManualDuration: bool(saved.useManualDuration, d.useManualDuration),
    manualPeriodDuration: num(saved.manualPeriodDuration),
    height: num(saved.height),
    weight: num(saved.weight),
    medicalConditions: strList(saved.medicalConditions, d.medicalConditions),
    otherMedicalCondition: str(saved.otherMedicalCondition, d.otherMedicalCondition),
    takingMedication: typeof saved.takingMedication === "boolean" ? saved.takingMedication : null,
    medications: medications.length ? medications : [""],
    symptoms: strList(saved.symptoms, d.symptoms),
    customSymptom: str(saved.customSymptom, d.customSymptom),
    moods: strList(saved.moods, d.moods),
    customMood: str(saved.customMood, d.customMood),
    periodReminder: bool(saved.periodReminder, d.periodReminder),
    periodReminderDays: oneOf(REMINDER_DAYS, saved.periodReminderDays),
    ovulationReminder: bool(saved.ovulationReminder, d.ovulationReminder),
    ovulationReminderDays: oneOf(REMINDER_DAYS, saved.ovulationReminderDays),
    birthControl: oneOf(BC_ANSWERS, saved.birthControl) ?? d.birthControl,
    birthControlCategory: oneOf(BC_CATEGORIES, saved.birthControlCategory) ?? d.birthControlCategory,
    birthControlMethod: str(saved.birthControlMethod, d.birthControlMethod),
    birthControlCustomMethod: str(saved.birthControlCustomMethod, d.birthControlCustomMethod),
    fertilityGoal: oneOf(GOALS, saved.fertilityGoal) ?? d.fertilityGoal,
    fertilityTracking: {
      intercourse: bool(tracking.intercourse, d.fertilityTracking.intercourse),
      cervicalMucus: bool(tracking.cervicalMucus, d.fertilityTracking.cervicalMucus),
      bbt: bool(tracking.bbt, d.fertilityTracking.bbt),
      lhTest: bool(tracking.lhTest, d.fertilityTracking.lhTest),
      symptoms: bool(tracking.symptoms, d.fertilityTracking.symptoms),
      mood: bool(tracking.mood, d.fertilityTracking.mood),
      libido: bool(tracking.libido, d.fertilityTracking.libido),
    },
  };
}

/**
 * Accepts only what we recognise and fills the rest from INITIAL_DATA, so a partial or outdated
 * payload still restores cleanly instead of crashing the flow.
 */
function parseProgress(raw: string): OnboardingProgress | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !isRecord(parsed.data)) return null;
  const currentStep = oneOf(STEP_IDS, parsed.currentStep);
  if (currentStep === undefined) return null;

  const completedSteps = Array.isArray(parsed.completedSteps) ? parsed.completedSteps.filter(isStepId) : [];
  return {
    currentStep,
    completedSteps,
    data: sanitizeData(parsed.data),
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
  };
}

/** Saved progress, or null when there is none (or it could not be trusted — that is cleared). */
export function loadProgress(): OnboardingProgress | null {
  const storage = safeStorage();
  if (!storage) return null;
  const raw = storage.getItem(progressKey());
  if (!raw) return null;
  const progress = parseProgress(raw);
  if (!progress) {
    // Corrupt or foreign payload: drop only our own key and carry on.
    storage.removeItem(progressKey());
    return null;
  }
  return progress;
}

export function saveProgress(currentStep: StepId, completedSteps: readonly StepId[], data: OnboardingData): void {
  const storage = safeStorage();
  if (!storage) return;
  const payload: OnboardingProgress = {
    currentStep,
    completedSteps: [...completedSteps].sort((a, b) => a - b),
    data,
    updatedAt: new Date().toISOString(),
  };
  try {
    storage.setItem(progressKey(), JSON.stringify(payload));
  } catch {
    // Quota or a locked-down browser — the flow keeps working in memory.
  }
}

/** Clears in-progress setup only; unrelated application data is untouched. */
export function clearProgress(): void {
  safeStorage()?.removeItem(progressKey());
}

export function markOnboardingCompleted(): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(completedKey(), new Date().toISOString());
  } catch {
    /* ignore */
  }
  storage.removeItem(progressKey());
}

/** How far through the 11 steps the saved progress is. */
export function progressPercentOf(progress: OnboardingProgress): number {
  const done = new Set(progress.completedSteps);
  return Math.round((done.size / TOTAL_STEPS) * 100);
}