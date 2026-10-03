import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

/**
 * The right-hand visual panel: soft white/blush surface, hairline border, barely-there shadow.
 *
 * It is the only positioning context for the composition — `relative` + `overflow-hidden` — so the
 * girl, the step artwork and every floating card stay inside it and can never reach the question card,
 * the stepper, the navigation or the page edge.
 */
export function StepVisualPanel({
  children,
  caption,
  className,
}: {
  children: ReactNode;
  caption?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-panel border border-[#F5DCE7] bg-[linear-gradient(145deg,#FFFFFF_0%,#FFF7FA_100%)]",
        "shadow-glass",
        className,
      )}
    >
      {children}
      {caption && (
        <div className="absolute bottom-0 right-0 z-30 hidden max-w-[52%] justify-end p-2.5 sm:p-4 md:flex">
          <div className="max-w-full text-balance rounded-full border border-card-border bg-white/90 px-3.5 py-1.5 text-center text-caption font-semibold leading-snug text-ink-soft backdrop-blur-sm">
            {caption}
          </div>
        </div>
      )}
    </div>
  );
}
