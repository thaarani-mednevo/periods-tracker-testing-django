import { STEPS, TOTAL_STEPS } from "../../constants";
import type { StepId } from "../../types";
import { progressPercent } from "../progressStepper/ProgressStepper";

/**
 * Compact progress for phones and tablets (the 11-step stepper takes over at lg):
 *
 *   STEP 5 OF 11                 45%
 *   Health Details
 *   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * The counter and the step name sit on separate lines so neither has to share width with the other.
 */
export function MobileProgress({ current }: { current: StepId }) {
  const pct = progressPercent(current);
  const label = STEPS[current - 1].label;
  return (
    <div className="w-full rounded-card border border-line bg-white px-4 py-3.5 shadow-glass" aria-label="Onboarding progress">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-eyebrow font-bold uppercase leading-none tracking-[0.14em] text-rose-ink/80">
          Step {current} of {TOTAL_STEPS}
        </p>
        <p className="shrink-0 text-caption font-bold leading-none tabular-nums text-rose-ink">{pct}%</p>
      </div>
      <p className="mt-1.5 truncate text-lead font-semibold leading-tight text-ink">{label}</p>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-blush-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`Step ${current} of ${TOTAL_STEPS}, ${label}`}
      >
        <div className="relative h-full origin-left rounded-full bg-brand transition-transform duration-700 ease-out" style={{ transform: `scaleX(${pct / 100})` }}>
          <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.55),transparent)] bg-[length:200%_100%]" />
        </div>
      </div>
    </div>
  );
}
