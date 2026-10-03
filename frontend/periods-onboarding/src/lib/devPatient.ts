import { getAuth } from "./auth";

/** Kept so progress.ts keeps working: scopes saved onboarding progress per logged-in user. */
export function getDevPatient(): string | null {
  return getAuth()?.user.email ?? null;
}

/** No longer needed (real login now). Kept as a no-op so App.tsx callers still compile. */
export function startNewDevPatient(): void {}