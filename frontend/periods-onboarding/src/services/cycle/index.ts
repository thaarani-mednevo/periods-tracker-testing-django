import { apiRequest } from "../api/client";

export type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal" | "unknown";
export type ConfidenceLevel = "high" | "medium" | "low";
export type DataType = "observed" | "estimated";

/** Shape of GET /api/v1/cycle/current. The backend owns every calculation; the UI only displays it. */
export interface CycleState {
  date: string;
  cycleDay: number | null;
  phase: CyclePhase;
  period: { start: string; end: string; type: DataType; startType: DataType } | null;
  nextPeriod: { date: string; type: DataType; rangeStart: string | null; rangeEnd: string | null } | null;
  ovulation: { date: string; type: "estimated"; windowStart: string; windowEnd: string } | null;
  nextPhase: { phase: Exclude<CyclePhase, "unknown">; startDate: string; daysUntil: number } | null;
  phases: { phase: Exclude<CyclePhase, "unknown">; start: string; end: string | null; isCurrent: boolean }[];
  daysUntilNextPeriod: number | null;
  isOverdue: boolean;
  overdueDays: number;
  confidence: { level: ConfidenceLevel; reasons: string[] };
  cycleProfile: {
    sampleSize: number;
    medianCycleLength: number | null;
    variability: number | null;
    typicalPeriodLength: number | null;
    lengthSource: "history" | "history+onboarding" | "onboarding" | "none";
  };
}

export interface PredictedDay {
  date: string;
  phase: CyclePhase;
  type: DataType;
  cycleDay: number | null;
  isOvulationDay: boolean;
  inOvulationWindow: boolean;
}

export interface PeriodEntry {
  id: number;
  startDate: string;
  endDate: string | null;
  periodLength: number | null;
  cycleLength: number | null;
  source: "onboarding" | "user";
}

/** The user's LOCAL calendar date (the server runs in UTC, so it must not guess "today"). */
export function localISODate(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const getCurrentCycle = (
  dateOrSignal?: string | AbortSignal,
  signal?: AbortSignal,
) => {
  const date =
    typeof dateOrSignal === "string"
      ? dateOrSignal
      : localISODate();

  const requestSignal =
    typeof dateOrSignal === "string"
      ? signal
      : dateOrSignal;

  return apiRequest<CycleState>(
    "/api/v1/cycle/current",
    {
      query: { date },
      signal: requestSignal,
    },
  );
};

export const getPredictions = (start: string, end: string, signal?: AbortSignal) =>
  apiRequest<{ start: string; end: string; days: PredictedDay[] }>("/api/v1/cycle/predictions", {
    query: { start, end, date: localISODate() },
    signal,
  });

export const getCycleHistory = (signal?: AbortSignal) =>
  apiRequest<{ periods: PeriodEntry[] }>("/api/v1/cycles/history", { query: { date: localISODate() }, signal });

export const logPeriod = (startDate: string, endDate?: string | null) =>
  apiRequest<{ id: number }>("/api/v1/cycles/periods", {
    method: "POST",
    query: { date: localISODate() },
    body: { startDate, endDate: endDate ?? null },
  });