import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../services/api/client";
import { getCycleHistory, type PeriodEntry } from "../services/cycle";

export interface UseCycleHistoryResult {
  status: "loading" | "ready" | "error";
  data: PeriodEntry[] | null;
  error: ApiError | null;
  refetch: () => void;
}

/** Logged periods, newest first. Re-fetch after anything that changes period data. */
export function useCycleHistory(): UseCycleHistoryResult {
  const [status, setStatus] = useState<UseCycleHistoryResult["status"]>("loading");
  const [data, setData] = useState<PeriodEntry[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    getCycleHistory(controller.signal)
      .then((r) => {
        setData(r.periods);
        setError(null);
        setStatus("ready");
      })
      .catch((err: ApiError) => {
        if (err.code === "ABORTED") return;
        setError(err);
        setStatus("error");
      });
    return () => controller.abort();
  }, [nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  return { status, data, error, refetch };
}