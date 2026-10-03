import type { CycleState } from "../../services/cycle";

/** The only contract a phase view has with the rest of the app: engine state in, navigation callbacks out. */
export interface PhaseViewProps {
  state: CycleState;
  onLogPeriod: () => void;
  onOpenTrends: () => void;
  /** Optional: only phases that render their own Ava / log-period UI use these. */
  onAskAva?: () => void;
  onOpenDailyLog?: () => void;
  onChanged?: () => void;
}