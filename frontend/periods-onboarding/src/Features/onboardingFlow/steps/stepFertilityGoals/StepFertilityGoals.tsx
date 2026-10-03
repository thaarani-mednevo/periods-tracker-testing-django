import { Orbit, RefreshCcw, ShieldPlus } from "lucide-react";
import { FieldError } from "../../../../Elements/fields/Fields";
import { InfoCard } from "../../../../Elements/infoCard/InfoCard";
import { OptionCard, handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";
import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";
import { ToggleCard } from "../../../../Elements/toggleCard/ToggleCard";
import { FERTILITY_GOAL_OPTIONS, GOAL_TRACKING, TRACKING_DESCRIPTIONS } from "../../../../constants";
import { trackingForGoal, trackingLabel } from "../../../../lib/health";
import type { FertilityGoal, StepProps, TrackingKey } from "../../../../types";

const ICONS = { "trying-to-conceive": Orbit, "pregnancy-prevention": ShieldPlus, "understand-cycle": RefreshCcw } as const;

export function StepFertilityGoals({ data, update, errors }: StepProps) {
  const goal = data.fertilityGoal;
  const config = goal ? GOAL_TRACKING[goal] : undefined;

  const selectGoal = (g: Exclude<FertilityGoal, "">) => {
    if (g === goal) return;
    // Each goal has its own recommended set: required items on, optional items off.
    update({ fertilityGoal: g, fertilityTracking: trackingForGoal(g) });
  };

  const setTracking = (key: TrackingKey, on: boolean) =>
    update({ fertilityTracking: { ...data.fertilityTracking, [key]: on } });

  return (
    <div>
      <StepHeader
        step={10}
        title="What are you focusing on right now?"
        subtitle="Choose what you'd like your cycle tracker to help you understand."
      />

      <div role="radiogroup" tabIndex={-1} onKeyDown={handleRadioKeys} aria-label="Primary goal" className="grid gap-2">
        {FERTILITY_GOAL_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            label={o.label}
            description={o.description}
            icon={ICONS[o.value]}
            selected={goal === o.value}
            inTabOrder={!goal || goal === o.value}
            onSelect={() => selectGoal(o.value)}
          />
        ))}
      </div>
      <FieldError message={errors.fertilityGoal} />

      {config && goal && config.explanation && <InfoCard key={`why-${goal}`}>{config.explanation}</InfoCard>}

      {config && goal && config.required.length > 0 && (
        <section key={`req-${goal}`} aria-labelledby="required-tracking" className="animate-expand">
          <h2 id="required-tracking" className="mb-1.5 text-body font-semibold text-ink">
            Required tracking
          </h2>
          <div className="grid gap-1.5 @lg:grid-cols-2">
            {config.required.map((k) => (
              <ToggleCard key={k} dense title={trackingLabel(goal, k)} description={TRACKING_DESCRIPTIONS[k]} checked required onChange={() => undefined} />
            ))}
          </div>
        </section>
      )}

      {config && goal && (
        <section key={`opt-${goal}`} aria-labelledby="optional-tracking" className="animate-expand">
          <h2 id="optional-tracking" className="mb-1.5 text-body font-semibold text-ink">
            {config.required.length ? "Optional tracking" : config.heading}
          </h2>
          <div className="grid gap-1.5 @lg:grid-cols-2">
            {config.optional.map((k) => (
              <ToggleCard
                key={k}
                dense
                title={trackingLabel(goal, k)}
                description={TRACKING_DESCRIPTIONS[k]}
                checked={data.fertilityTracking[k]}
                onChange={(on) => setTracking(k, on)}
              />
            ))}
          </div>
        </section>
      )}

      {config && goal && config.safety && (
        <InfoCard key={`safety-${goal}`} variant="disclaimer" title="Important safety information">
          {config.safety}
        </InfoCard>
      )}
    </div>
  );
}
