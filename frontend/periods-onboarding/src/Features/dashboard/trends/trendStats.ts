import type { PeriodEntry } from "../../../services/cycle";

export type RangeId = "3" | "6" | "12" | "all";

export const RANGES: { id: RangeId; label: string }[] = [
  { id: "3", label: "Last 3 cycles" },
  { id: "6", label: "Last 6 cycles" },
  { id: "12", label: "Last 12 cycles" },
  { id: "all", label: "All" },
];

export interface TrendPoint {
  id: number;
  startDate: string;
  value: number;
}

export interface Stats {
  count: number;
  mean: number | null;
  min: number | null;
  max: number | null;
  /** Sample standard deviation; null with fewer than 2 values. */
  sd: number | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** History arrives newest first; charts read oldest to newest, so reverse, filter, then keep the last N. */
function pick(history: PeriodEntry[], range: RangeId, value: (p: PeriodEntry) => number | null): TrendPoint[] {
  const points = [...history].reverse().flatMap((p) => {
    const v = value(p);
    return v === null ? [] : [{ id: p.id, startDate: p.startDate, value: v }];
  });
  return range === "all" ? points : points.slice(Math.max(points.length - Number(range), 0));
}

export const cyclePoints = (history: PeriodEntry[], range: RangeId) => pick(history, range, (p) => p.cycleLength);
export const periodPoints = (history: PeriodEntry[], range: RangeId) => pick(history, range, (p) => p.periodLength);

export function stats(points: TrendPoint[]): Stats {
  const values = points.map((p) => p.value);
  if (values.length === 0) return { count: 0, mean: null, min: null, max: null, sd: null };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = values.length < 2 ? null : Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1));
  return { count: values.length, mean: round1(mean), min: Math.min(...values), max: Math.max(...values), sd: sd === null ? null : round1(sd) };
}

/** Same cut-offs the backend's confidence engine uses (stdev <= 2 days, <= 5 days). */
export function consistencyLabel(sd: number | null): string {
  if (sd === null) return "—";
  if (sd <= 2) return "Very consistent";
  if (sd <= 5) return "Some variation";
  return "Varies a lot";
}

/** Plain descriptions of the numbers on screen. No new calculations, no diagnosis. */
export function cycleInsights(s: Stats): string[] {
  if (s.count === 0 || s.mean === null || s.min === null || s.max === null) return [];
  const out = [`Your logged cycles range from ${s.min} to ${s.max} days and average ${s.mean} days.`];
  if (s.sd !== null) {
    out.push(
      s.sd <= 2
        ? "Your cycle length has been very consistent, which makes your predictions more reliable."
        : s.sd <= 5
          ? "Your cycle length varies by a few days, so predictions are shown as ranges."
          : "Your cycle length varies quite a bit, so predicted dates are rough estimates.",
    );
  }
  if (s.min < 21 || s.max > 35) {
    out.push("Cycles shorter than 21 or longer than 35 days are worth mentioning to a healthcare professional. This is general guidance, not a diagnosis.");
  }
  return out;
}