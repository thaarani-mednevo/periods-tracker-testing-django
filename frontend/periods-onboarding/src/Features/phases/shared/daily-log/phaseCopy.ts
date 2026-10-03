import type { CyclePhase } from "../../../../services/cycle";

export interface CycleInfo {
  cycleDay: number | null;
  phase: CyclePhase;
}

export const PHASE_LABEL: Record<CyclePhase, string> = {
  menstrual: "Menstruation",
  follicular: "Follicular phase",
  ovulation: "Ovulation",
  luteal: "Luteal phase",
  unknown: "Cycle",
};

export const PHASE_SHORT: Record<CyclePhase, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
  unknown: "Cycle",
};

export const PHASE_TITLE: Record<CyclePhase, string> = {
  menstrual: "Menstruation",
  follicular: "Follicular Phase",
  ovulation: "Ovulation",
  luteal: "Luteal Phase",
  unknown: "Daily Log",
};