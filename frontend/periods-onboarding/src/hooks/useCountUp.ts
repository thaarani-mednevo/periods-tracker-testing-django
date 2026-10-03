import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** Smoothly animates a number towards `target` (ease-out cubic). */
export function useCountUp(target: number, duration = 700, decimals = 0): number {
  const reduce = usePrefersReducedMotion();
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    if (reduce) {
      // No animation: the hook returns `target` directly below; just remember where we are.
      fromRef.current = target;
      return;
    }
    const start = performance.now();
    const factor = 10 ** decimals;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round((from + (target - from) * eased) * factor) / factor;
      fromRef.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals, reduce]);

  return reduce ? target : value;
}
