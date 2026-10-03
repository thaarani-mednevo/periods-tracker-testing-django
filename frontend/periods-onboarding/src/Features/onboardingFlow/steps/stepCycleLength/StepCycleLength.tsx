import { ArrowLeft, ArrowRight, CalendarClock, CircleHelp, Shuffle } from "lucide-react";
import { useState } from "react";
import { FeedbackBadge } from "../../../../Elements/feedbackBadge/FeedbackBadge";
import { FieldError, NumberField } from "../../../../Elements/fields/Fields";
import { InfoCard } from "../../../../Elements/infoCard/InfoCard";
import { OptionCard, handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";
import { SliderInput } from "../../../../Elements/sliderInput/SliderInput";
import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";
import { CYCLE_LENGTH_OPTIONS, CYCLE_RANGE } from "../../../../constants";
import { getCycleFeedback } from "../../../../lib/health";
import type { StepProps } from "../../../../types";

const ICONS = { known: CalendarClock, unsure: CircleHelp, varies: Shuffle } as const;

export function StepCycleLength({ data, update, errors }: StepProps) {
  const [manual, setManual] = useState(() => (data.cycleLength !== undefined && data.cycleLength > 60));
  const sliderValue = data.cycleLength !== undefined ? Math.min(60, Math.max(15, data.cycleLength)) : CYCLE_RANGE.default;
  const current = data.cycleLength ?? (manual ? 75 : CYCLE_RANGE.default);
  const feedback = getCycleFeedback(current);

  const belowSliderMax = data.cycleLength !== undefined && data.cycleLength <= 60;

  return (
    <div>
      <StepHeader
        step={2}
        title="How long is your menstrual cycle?"
        subtitle="A cycle is counted from the first day of one period to the first day of the next."
      />

      <div role="radiogroup" tabIndex={-1} onKeyDown={handleRadioKeys} aria-label="Cycle length" className="grid gap-2">
        {CYCLE_LENGTH_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            label={o.label}
            description={o.description}
            icon={ICONS[o.value]}
            selected={data.cycleLengthOption === o.value}
            inTabOrder={!data.cycleLengthOption || data.cycleLengthOption === o.value}
            onSelect={() =>
              update({
                cycleLengthOption: o.value,
                ...(o.value === "known" && data.cycleLength === undefined ? { cycleLength: CYCLE_RANGE.default } : {}),
              })
            }
          />
        ))}
      </div>
      <FieldError message={errors.cycleLengthOption} />

      <div className="mt-3 space-y-2.5">
        {data.cycleLengthOption === "known" && (
          <div className="animate-expand space-y-2.5">
            <SliderInput
              id="cycle-length"
              label="Usual cycle length"
              value={manual ? 60 : sliderValue}
              displayValue={current}
              min={15}
              max={60}
              ticks={[15, 21, 28, 35, 45, 60]}
              disabled={manual}
              onChange={(cycleLength) => {
                setManual(false);
                update({ cycleLength });
              }}
              aside={<FeedbackBadge tone={feedback.tone} label={feedback.label} />}
            >
              <div className="mt-2 animate-expand border-t border-line pt-2.5">
                {!manual ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-body-sm font-medium text-ink-soft">Cycle longer than 60 days?</p>
                    <button
                      type="button"
                      onClick={() => {
                        setManual(true);
                        if (!data.cycleLength || data.cycleLength <= 60) {
                          update({ cycleLength: 75 });
                        }
                      }}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 pointer-fine:min-h-9 text-body-sm font-semibold text-rose-ink transition-colors duration-200 hover:bg-hover-bg focus-ring"
                    >
                      Enter manually
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="animate-expand">
                    <NumberField
                      id="manual-cycle-length"
                      label="Enter exact cycle length"
                      value={data.cycleLength}
                      onChange={(cycleLength) => update({ cycleLength })}
                      placeholder="e.g. 75"
                      unit="days"
                      hint={belowSliderMax ? "For 60 days or fewer, you can use the slider above." : "Use a whole number of days."}
                      error={errors.cycleLength}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setManual(false);
                        if (data.cycleLength && data.cycleLength > 60) {
                          update({ cycleLength: 60 });
                        }
                      }}
                      className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 pointer-fine:min-h-9 text-body-sm font-semibold text-rose-ink transition-colors duration-200 hover:bg-hover-bg focus-ring"
                    >
                      <ArrowLeft className="size-3.5" aria-hidden="true" />
                      Use slider instead
                    </button>
                  </div>
                )}
              </div>
            </SliderInput>
            <FieldError message={errors.cycleLength} />
            <InfoCard>
              Cycle length naturally varies. If yours is consistently outside the typical range, consider
              discussing it with a healthcare professional.
            </InfoCard>
          </div>
        )}
        {data.cycleLengthOption === "unsure" && (
          <InfoCard live>That's okay. We can estimate your cycle over time as you log more periods.</InfoCard>
        )}
        {data.cycleLengthOption === "varies" && (
          <InfoCard live title="Your cycle may not follow the same number of days every month.">
            Tracking several cycles can help reveal your personal pattern.
          </InfoCard>
        )}
      </div>
    </div>
  );
}
