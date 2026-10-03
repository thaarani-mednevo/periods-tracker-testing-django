import { ArrowLeft, ArrowRight } from "lucide-react";
import { FeedbackBadge } from "../../../../Elements/feedbackBadge/FeedbackBadge";

import { FieldError, NumberField } from "../../../../Elements/fields/Fields";

import { InfoCard } from "../../../../Elements/infoCard/InfoCard";

import { SliderInput } from "../../../../Elements/sliderInput/SliderInput";

import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";

import { DURATION_RANGE } from "../../../../constants";

import { effectiveDuration, getDurationFeedback } from "../../../../lib/health";

import type { StepProps } from "../../../../types";

export function StepPeriodDuration({ data, update, errors }: StepProps) {
  const sliderValue = data.periodDuration ?? DURATION_RANGE.default;
  // One source of truth for the label, the disclaimer and the right-hand visual.
  const current = effectiveDuration(data);
  const feedback = current !== undefined && current >= 1 ? getDurationFeedback(current) : undefined;

  const manual = data.useManualDuration;
  const atMax = sliderValue >= DURATION_RANGE.max;
  const manualValue = data.manualPeriodDuration;
  // Manual entry is meant for periods longer than the slider can express.
  const belowSliderMax = manualValue !== undefined && manualValue <= DURATION_RANGE.max;

  return (
    <div>
      <StepHeader
        step={4}
        title="How many days does your period usually last?"
        subtitle="Tell us approximately how long your menstrual bleeding usually continues."
      />

      <div>
        {/* One card: value, slider, and — only when it is needed — the manual entry. */}
        <SliderInput
          id="period-duration"
          label="Period duration"
          value={manual ? DURATION_RANGE.max : sliderValue}
          displayValue={current}
          min={DURATION_RANGE.min}
          max={DURATION_RANGE.max}
          ticks={[1, 7, 14, 21, 30]}
          onChange={(periodDuration) => update({ periodDuration, useManualDuration: false })}
          aside={feedback && <FeedbackBadge tone={feedback.tone} label={feedback.label} />}
        >
          {(atMax || manual) && (
            <div className="mt-2 animate-expand border-t border-line pt-2.5">
              {!manual ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-body-sm font-medium text-ink-soft">Period longer than {DURATION_RANGE.max} days?</p>
                  <button
                    type="button"
                    onClick={() => update({ useManualDuration: true })}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 pointer-fine:min-h-9 text-body-sm font-semibold text-rose-ink transition-colors duration-200 hover:bg-hover-bg focus-ring"
                  >
                    Enter manually
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="animate-expand">
                  <NumberField
                    id="manual-duration"
                    label="Enter exact duration"
                    value={manualValue}
                    onChange={(manualPeriodDuration) => update({ manualPeriodDuration })}
                    placeholder="e.g. 50"
                    unit="days"
                    hint={belowSliderMax ? undefined : "Use a whole number of days."}
                    error={errors.manualPeriodDuration}
                  />
                  {belowSliderMax && (
                    <p className="mt-1.5 text-caption text-ink-muted">For {DURATION_RANGE.max} days or fewer, you can use the slider above.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => update({ useManualDuration: false })}
                    className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 pointer-fine:min-h-9 text-body-sm font-semibold text-rose-ink transition-colors duration-200 hover:bg-hover-bg focus-ring"
                  >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Use slider instead
                  </button>
                </div>
              )}
            </div>
          )}
        </SliderInput>
        <FieldError message={errors.periodDuration} />
      </div>

      {/* Health information stays outside the control card. */}
      {feedback?.message && (
        <InfoCard key={feedback.tone} live variant={feedback.tone === "typical" ? "info" : "disclaimer"}>
          {feedback.message}
        </InfoCard>
      )}
    </div>
  );
}
