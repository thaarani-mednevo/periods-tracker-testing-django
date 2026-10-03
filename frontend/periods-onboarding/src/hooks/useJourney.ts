import { useCallback } from "react";
import { getProfile, journeyFromGoal, type Journey } from "../services/settings";
import { useAsync } from "./useAsync";

/** The saved journey, read from the backend so every phase agrees with Settings. */
export function useJourney(): { journey: Journey; ready: boolean; refetch: () => void } {
  const load = useCallback((s: AbortSignal) => getProfile(s), []);
  const { data, refetch } = useAsync(load);
  return { journey: journeyFromGoal(data?.fertilityGoal ?? ""), ready: data !== null, refetch };
}