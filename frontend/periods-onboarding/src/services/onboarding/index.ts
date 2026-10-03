
import type { OnboardingData } from "../../types";
import { getToken } from "../../lib/auth";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface ProfileSubmissionResult {
  id: string;
  createdAt: string;
  savedAt: number;
}

const DEFAULT_TIMEOUT_MS = 10000;

function getBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
}

/**
 * Submit complete onboarding profile payload to Mednevo backend.
 */
export async function submitOnboardingProfile(
  data: OnboardingData
): Promise<ApiResponse<ProfileSubmissionResult>> {
  const baseUrl = getBaseUrl();

   if (!baseUrl) {
    return { success: false, error: "API base URL is not configured (VITE_API_BASE_URL).", statusCode: 0 };
  }

  const token = getToken();  

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/api/v1/onboarding/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}), 
      },
      credentials: "include",
      body: JSON.stringify({
        profile: data,
        submittedAt: new Date().toISOString(),
        version: 1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `Server returned status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.message) errorMsg = errorJson.message;
      } catch {
        // ignore json parse errors on error responses
      }
      return { success: false, error: errorMsg, statusCode: response.status };
    }

    const responseData = (await response.json()) as ProfileSubmissionResult;
    return { success: true, data: responseData, statusCode: response.status };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    const errorMsg = isAbort
      ? "Request timed out. Please try again."
      : (err as Error)?.message || "Network error";
    return { success: false, error: errorMsg, statusCode: isAbort ? 408 : 0 };
  }
}
