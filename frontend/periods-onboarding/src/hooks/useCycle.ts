import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../services/api/client";
import {
  getCurrentCycle,
  type CycleState,
} from "../services/cycle";

export type CycleStatus =
  | "loading"
  | "ready"
  | "no-setup"
  | "error";

export interface UseCycleResult {
  status: CycleStatus;
  data: CycleState | null;
  error: ApiError | null;
  refetch: () => void;
}

/**
 * Loads cycle state for the selected date.
 *
 * If date is undefined, backend receives today's date.
 */
export function useCycle(date?: string): UseCycleResult {
  const [status, setStatus] =
    useState<CycleStatus>("loading");

  const [data, setData] =
    useState<CycleState | null>(null);

  const [error, setError] =
    useState<ApiError | null>(null);

  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setStatus("loading");

    getCurrentCycle(date, controller.signal)
      .then((state) => {
        setData(state);
        setError(null);
        setStatus("ready");
      })
      .catch((err: ApiError) => {
        if (err.code === "ABORTED") {
          return;
        }

        setError(err);

        setStatus(
          err.code === "UNAUTHENTICATED" ||
            err.code === "ONBOARDING_REQUIRED"
            ? "no-setup"
            : "error",
        );
      });

    return () => controller.abort();
  }, [date, nonce]);

  const refetch = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  return {
    status,
    data,
    error,
    refetch,
  };
}