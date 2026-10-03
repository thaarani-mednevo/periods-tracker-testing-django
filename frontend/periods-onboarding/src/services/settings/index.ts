import type { FertilityGoal, OnboardingData } from "../../types";
import { apiRequest } from "../api/client";

/** Exactly one journey is active. It is stored as the onboarding `fertilityGoal`. */
export type Journey = "cycle_tracking" | "trying_to_conceive" | "pregnancy_prevention";

const FROM_GOAL: Record<Exclude<FertilityGoal, "">, Journey> = {
  "understand-cycle": "cycle_tracking",
  "trying-to-conceive": "trying_to_conceive",
  "pregnancy-prevention": "pregnancy_prevention",
};
const TO_GOAL: Record<Journey, Exclude<FertilityGoal, "">> = {
  cycle_tracking: "understand-cycle",
  trying_to_conceive: "trying-to-conceive",
  pregnancy_prevention: "pregnancy-prevention",
};

export const journeyFromGoal = (goal: FertilityGoal): Journey => (goal ? FROM_GOAL[goal] : "cycle_tracking");
export const goalFromJourney = (journey: Journey): FertilityGoal => TO_GOAL[journey];

/** GET /api/v1/onboarding/profile. Name and age live on the patient record, so they are not returned. */
export type ServerProfile = Omit<OnboardingData, "name" | "age"> & { id: string; bmi: number | null };

export const getProfile = (signal?: AbortSignal) =>
  apiRequest<ServerProfile>("/api/v1/onboarding/profile", { signal });