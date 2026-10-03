import type { ComponentType } from "react";
import type { PhaseId } from "../dashboard/phases";
import { FollicularOverview } from "./follicular/FollicularOverview";
import { LutealOverview } from "./luteal/LutealOverview";
import { MenstrualOverview } from "./menstrual/MenstrualOverview";
import { OvulationRouter } from "./ovulation/OvulationRouter";
import type { PhaseViewProps } from "./types";

/** One entry per ported phase. A phase with no entry falls back to the generic page. */
export const PHASE_VIEWS: Partial<Record<PhaseId, ComponentType<PhaseViewProps>>> = {
  menstrual: MenstrualOverview,
  follicular: FollicularOverview,
  ovulation: OvulationRouter, // picks the default, Trying to Conceive or Pregnancy Prevention screen from Settings
  luteal: LutealOverview,
};