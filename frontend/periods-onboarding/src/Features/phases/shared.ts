import { fmtDate } from "../dashboard/phases";

/** Building blocks every phase overview shares, so a new phase view stays small. */
export const card = "rounded-[24px] border border-blush-300 bg-white p-5 shadow-glass sm:p-6";
export const CONFIDENCE_LABEL = { high: "High confidence", medium: "Medium confidence", low: "Low confidence (estimate)" } as const;
export const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;
export const span = (a?: string | null, b?: string | null) => (a && b && a !== b ? `${fmtDate(a)} – ${fmtDate(b)}` : "");