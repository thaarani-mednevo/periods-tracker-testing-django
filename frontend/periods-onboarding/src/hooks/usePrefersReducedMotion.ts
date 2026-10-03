import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia?.(QUERY);
  mql?.addEventListener("change", onChange);
  return () => mql?.removeEventListener("change", onChange);
}

/**
 * CSS already neutralises keyframe animations under reduced motion; this hook
 * covers SVG SMIL animations, which CSS media queries cannot pause.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(QUERY).matches ?? false,
    () => false,
  );
}
