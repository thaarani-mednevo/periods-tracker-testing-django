import { Check } from "lucide-react";
import { STEPS, TOTAL_STEPS } from "../../constants";
import { cn } from "../../lib/cn";
import type { StepId } from "../../types";

interface ProgressStepperProps {
  current: StepId;
  /** Highest step the user has reached — earlier steps are clickable. */
  maxReached: StepId;
  onStepClick: (step: StepId) => void;
}

export function progressPercent(step: number): number {
  return Math.round((step / TOTAL_STEPS) * 100);
}

/**
 * Desktop 11-step stepper — one compact white row so the step always fits the viewport. Labels stay
 * visible on every desktop (≥1280px wide); only short, narrower screens fall back to numbers alone.
 */
export function ProgressStepper({ current, maxReached, onStepClick }: ProgressStepperProps) {
  const pct = progressPercent(current);

  return (
    <nav aria-label="Onboarding progress" className="flex items-center gap-5 rounded-card border border-line bg-white px-5 py-2.5 shadow-glass short:py-2 xl:px-6">
      <div className="w-[108px] shrink-0">
        <p className="text-body-sm font-semibold text-ink-soft short:sr-only">
          Step <span className="tabular-nums text-rose-ink">{current}</span> of {TOTAL_STEPS}
        </p>
        <div className="mt-1.5 flex items-center gap-2 short:mt-0">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-step" aria-hidden="true">
            <div className="h-full origin-left rounded-full bg-rose transition-transform duration-700 ease-out" style={{ transform: `scaleX(${pct / 100})` }} />
          </div>
          <span className="text-caption font-bold tabular-nums text-rose-ink">{pct}%</span>
        </div>
      </div>

      <ol className="flex min-w-0 flex-1 items-start">
        {STEPS.map((s, i) => {
          const done = s.id < current;
          const active = s.id === current;
          const reachable = s.id <= maxReached && !active;
          return (
            <li key={s.id} className="relative flex min-w-0 flex-1 flex-col items-center">
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="absolute left-[calc(50%+16px)] right-[calc(-50%+16px)] top-[13px] h-[2px] short:top-[11px] overflow-hidden rounded-full bg-line-step">
                  <span className={cn("block h-full origin-left bg-rose transition-transform duration-700 ease-out", done ? "scale-x-100" : "scale-x-0")} />
                </span>
              )}
              <button
                type="button"
                onClick={() => reachable && onStepClick(s.id)}
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${s.id}: ${s.label}${done ? " (completed)" : active ? " (current)" : ""}`}
                className={cn("group flex min-w-0 max-w-full flex-col items-center gap-1 rounded-xl short:gap-0.5 px-0.5 focus-ring", reachable ? "cursor-pointer" : "cursor-default")}
              >
                <span
                  className={cn(
                    "relative grid size-7 place-items-center rounded-full short:size-6 text-caption font-bold tabular-nums transition-[transform,background-color,box-shadow] duration-300",
                    done && "bg-rose text-white group-hover:scale-105",
                    active && "bg-rose text-white shadow-[0_0_0_4px_rgb(243_79_151/0.12)]",
                    !done && !active && "border border-blush-300 bg-white text-ink-small",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : s.id}
                </span>
                <span
                  className={cn(
                    "max-w-full text-center text-eyebrow leading-tight xl:whitespace-nowrap short:max-xl:sr-only",
                    active ? "font-semibold text-rose-ink" : "font-medium text-ink-muted",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
