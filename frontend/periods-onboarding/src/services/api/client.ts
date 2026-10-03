import { clearAuth, getToken } from "../../lib/auth";

const DEFAULT_TIMEOUT_MS = 10_000;

/** Mirrors the backend error shape: { message, error: { code, fieldErrors? } }. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, status: number, code: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function getBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, string | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

/** The logged-in user is identified by the auth token sent in the Authorization header. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) throw new ApiError("API base URL is not configured (VITE_API_BASE_URL).", 0, "CONFIG");

  const url = new URL(`${baseUrl}${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  const token = getToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  options.signal?.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (response.status === 204) return undefined as T;

    const json: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && token) {
        clearAuth();
        window.dispatchEvent(new Event("mednevo:unauthorized"));
      }
      const body = json as { message?: string; error?: { code?: string; fieldErrors?: Record<string, string[]> } } | null;
      throw new ApiError(
        body?.message ?? `Server returned status ${response.status}`,
        response.status,
        body?.error?.code ?? "HTTP_ERROR",
        body?.error?.fieldErrors,
      );
    }
    return json as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(options.signal?.aborted ? "Request cancelled." : "Request timed out. Please try again.", 0, options.signal?.aborted ? "ABORTED" : "TIMEOUT");
    }
    throw new ApiError((err as Error)?.message || "Network error", 0, "NETWORK");
  } finally {
    clearTimeout(timeoutId);
  }
}