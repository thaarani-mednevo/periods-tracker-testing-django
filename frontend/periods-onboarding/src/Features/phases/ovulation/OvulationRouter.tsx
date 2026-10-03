import { useCallback } from "react";
import { useAsync } from "../../../hooks/useAsync";
import { getProfile, journeyFromGoal } from "../../../services/settings";
import type { PhaseViewProps } from "../types";
import { OvulationFertility } from "./OvulationFertility";
import { OvulationOverview } from "./OvulationOverview";

/**
 * Picks the ovulation screen from the saved journey and tracking toggles (Settings).
 *  - Trying to Conceive    -> fertility screen, conception wording
 *  - Pregnancy Prevention  -> fertility screen, prevention wording + protection reminder
 *  - Track my cycle        -> default ovulation overview
 */
export function OvulationRouter(props: PhaseViewProps) {
  const profile = useAsync(useCallback((s: AbortSignal) => getProfile(s), []));

  if (profile.status === "loading" && !profile.data) {
    return <p className="text-lu-body text-lu-ink-muted">Loading…</p>;
  }

  // If the profile can't be read, the default screen is the safe fallback.
  const journey = journeyFromGoal(profile.data?.fertilityGoal ?? "");
  if (journey === "trying_to_conceive" || journey === "pregnancy_prevention") {
    return <OvulationFertility {...props} journey={journey} tracking={profile.data?.fertilityTracking ?? {}} />;
  }
  return <OvulationOverview {...props} />;
}