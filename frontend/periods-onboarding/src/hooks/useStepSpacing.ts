import { useLayoutEffect, type RefObject } from "react";

const MIN_GAP = 10;
const MAX_GAP = 28;

/**
 * Sets --step-gap on the current step so its logical groups spread through the question card:
 * spare height is shared between the gaps (clamped 10–28px) and the space above/below the content.
 * Recomputes when the card resizes or the step's content changes (conditional fields).
 */
export function useStepSpacing(scrollRef: RefObject<HTMLDivElement | null>, step: number) {
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const root = scroller?.querySelector(".step-flow")?.firstElementChild;
    if (!scroller || !(root instanceof HTMLElement)) return;

    const apply = () => {
      const cs = getComputedStyle(scroller);
      const available = scroller.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const groups = Array.from(root.children).filter((c): c is HTMLElement => c instanceof HTMLElement && c.offsetHeight > 0);
      const content = groups.reduce((sum, g) => sum + g.offsetHeight, 0);
      const spare = available - content - MIN_GAP * Math.max(0, groups.length - 1);
      // Share spare space across the inner gaps and the two outer edges.
      const gap = Math.max(MIN_GAP, Math.min(MAX_GAP, MIN_GAP + spare / (groups.length + 1)));
      const value = `${Math.round(gap)}px`;
      if (root.style.getPropertyValue("--step-gap") !== value) root.style.setProperty("--step-gap", value);
    };

    // The first pass runs before paint. Later passes are deferred to the next frame: writing --step-gap
    // resizes the very element the observer watches, and recomputing inline would trip the browser's
    // "ResizeObserver loop" guard.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };

    apply();
    const ro = new ResizeObserver(schedule);
    ro.observe(scroller);
    ro.observe(root);
    const mo = new MutationObserver(schedule);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      mo.disconnect();
    };
  }, [scrollRef, step]);
}
