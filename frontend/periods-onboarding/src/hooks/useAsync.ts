import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "../services/api/client";

export interface AsyncState<T> {
  status: "loading" | "ready" | "error";
  data: T | null;
  error: ApiError | null;
  refetch: () => void;
}

/** Runs `load` (wrap it in useCallback so it only changes when its inputs do) and re-runs on refetch(). */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<{ status: AsyncState<T>["status"]; data: T | null; error: ApiError | null }>({
    status: "loading",
    data: null,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, status: "loading" }));
    load(controller.signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((err: ApiError) => {
        if (err.code === "ABORTED") return;
        setState((s) => ({ ...s, status: "error", error: err }));
      });
    return () => controller.abort();
  }, [load, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, refetch };
}
