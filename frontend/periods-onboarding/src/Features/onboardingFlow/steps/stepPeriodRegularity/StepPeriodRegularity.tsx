import { CircleDashed, CircleHelp, HeartHandshake, RefreshCw } from "lucide-react";
import { FieldError } from "../../../../Elements/fields/Fields";
import { InfoCard } from "../../../../Elements/infoCard/InfoCard";
import { OptionCard, handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";
import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";
import { REGULARITY_MESSAGES, REGULARITY_OPTIONS } from "../../../../constants";
import type { StepProps } from "../../../../types";

const ICONS = { regular: RefreshCw, irregular: CircleDashed, unknown: CircleHelp } as const;

export function StepPeriodRegularity({ data, update, errors }: StepProps) {
  const selected = data.periodRegularity;
  return (
    <div>
      <StepHeader
        step={3}
        title="How regular are your periods?"
        subtitle="Choose the option that best describes your usual cycle pattern."
      />
      <div role="radiogroup" tabIndex={-1} onKeyDown={handleRadioKeys} aria-label="Period regularity" className="grid gap-2">
        {REGULARITY_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            label={o.label}
            description={o.description}
            icon={ICONS[o.value]}
            selected={selected === o.value}
            inTabOrder={!selected || selected === o.value}
            onSelect={() => update({ periodRegularity: o.value })}
          />
        ))}
      </div>
      <FieldError message={errors.periodRegularity} />

      {/* Fills the space under the options: an open reassurance before choosing, the contextual
          message after. Deliberately light — a note, not another content card. */}
      {selected ? (
        <InfoCard key={selected} live className="rounded-[14px]">
          {REGULARITY_MESSAGES[selected]}
        </InfoCard>
      ) : (
        <InfoCard icon={HeartHandshake} title="Not sure which one fits?" className="rounded-[14px]">
          That&apos;s completely okay. Your cycle can change from month to month, and you can update this later as you
          track.
        </InfoCard>
      )}
    </div>
  );
}
