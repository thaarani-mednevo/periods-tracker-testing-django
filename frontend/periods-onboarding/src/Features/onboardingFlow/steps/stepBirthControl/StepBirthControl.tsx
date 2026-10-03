import { CalendarHeart, CircleX, EyeOff, Lock, Pill, ShieldCheck, Sparkles } from "lucide-react";
import { FieldError, FieldGroup, TextField } from "../../../../Elements/fields/Fields";
import { InfoCard } from "../../../../Elements/infoCard/InfoCard";
import { OptionCard, handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";
import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";
import { BIRTH_CONTROL_CATEGORIES, BIRTH_CONTROL_MESSAGES, BIRTH_CONTROL_METHODS_BY_CATEGORY, BIRTH_CONTROL_OPTIONS } from "../../../../constants";
import type { BirthControlAnswer, BirthControlCategory, StepProps } from "../../../../types";

const ANSWER_ICONS = { yes: ShieldCheck, no: CircleX, "prefer-not-to-say": EyeOff } as const;
const CATEGORY_ICONS = { natural: CalendarHeart, hormonal: Pill, other: Sparkles } as const;

/**
 * Progressive disclosure: the type question only appears after "Yes", and the method list only after
 * a type. Changing an earlier answer clears the later ones, so nothing stale is ever submitted.
 */
export function StepBirthControl({ data, update, errors }: StepProps) {
  const setAnswer = (birthControl: BirthControlAnswer) => {
    if (birthControl === data.birthControl) return;
    update(
      birthControl === "yes"
        ? { birthControl }
        : { birthControl, birthControlCategory: "", birthControlMethod: "", birthControlCustomMethod: "" },
    );
  };

  const setCategory = (birthControlCategory: BirthControlCategory) => {
    if (birthControlCategory === data.birthControlCategory) return;
    // A new type invalidates the method chosen under the previous one.
    update({ birthControlCategory, birthControlMethod: "", birthControlCustomMethod: "" });
  };

  const setMethod = (birthControlMethod: string) => {
    update({ birthControlMethod, ...(birthControlMethod === "Other" ? {} : { birthControlCustomMethod: "" }) });
  };

  const category = data.birthControlCategory;
  const methods: readonly string[] = category && category !== "other" ? BIRTH_CONTROL_METHODS_BY_CATEGORY[category] : [];
  const needsCustom = category === "other" || data.birthControlMethod === "Other";
  // Answered questions shrink as the user goes deeper, so the deepest state still fits the card.
  const answerSize = category ? "sm" : "md";
  const categorySize = methods.length ? "sm" : "md";

  return (
    <div>
      <StepHeader
        step={9}
        title="Are you currently using birth control?"
        subtitle="Your answer helps us provide more relevant cycle information."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-0.5 text-caption font-semibold text-ink-soft">
            <Lock className="size-3 text-rose" aria-hidden="true" />
            Private &amp; optional
          </span>
        }
      />

      <div role="radiogroup" tabIndex={-1} onKeyDown={handleRadioKeys} aria-label="Birth control use" className="grid gap-2">
        {BIRTH_CONTROL_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            label={o.label}
            size={answerSize}
            icon={ANSWER_ICONS[o.value]}
            selected={data.birthControl === o.value}
            inTabOrder={!data.birthControl || data.birthControl === o.value}
            onSelect={() => setAnswer(o.value)}
          />
        ))}
      </div>
      <FieldError message={errors.birthControl} />

      {data.birthControl === "yes" && (
        <FieldGroup title="What type of birth control are you using?" className="animate-expand" error={errors.birthControlCategory}>
          <div role="radiogroup" tabIndex={-1} onKeyDown={handleRadioKeys} aria-label="Birth control type" className="grid gap-2">
            {BIRTH_CONTROL_CATEGORIES.map((c) => (
              <OptionCard
                key={c.value}
                label={c.label}
                size={categorySize}
                description={categorySize === "md" ? c.description : undefined}
                icon={CATEGORY_ICONS[c.value]}
                selected={category === c.value}
                inTabOrder={!category || category === c.value}
                onSelect={() => setCategory(c.value)}
              />
            ))}
          </div>
        </FieldGroup>
      )}

      {methods.length > 0 && (
        <FieldGroup title="Which method?" className="animate-expand" error={errors.birthControlMethod}>
          <div role="radiogroup" tabIndex={-1} onKeyDown={handleRadioKeys} aria-label="Birth control method" className="grid gap-1.5 @xs:grid-cols-2 @md:grid-cols-3">
            {methods.map((m) => (
              <OptionCard
                key={m}
                size="sm"
                label={m}
                selected={data.birthControlMethod === m}
                inTabOrder={!data.birthControlMethod || data.birthControlMethod === m}
                onSelect={() => setMethod(m)}
              />
            ))}
          </div>
        </FieldGroup>
      )}

      {data.birthControl === "yes" && needsCustom && (
        <TextField
          id="custom-bc"
          label="Please specify"
          className="animate-expand"
          value={data.birthControlCustomMethod}
          onChange={(birthControlCustomMethod) => update({ birthControlCustomMethod })}
          placeholder="Enter method"
          error={errors.birthControlCustomMethod}
        />
      )}

      {/* The reassurance belongs to the first answer; once the user is picking a method it only adds height. */}
      {data.birthControl && !methods.length && (
        <InfoCard key={data.birthControl} live>
          {BIRTH_CONTROL_MESSAGES[data.birthControl]}
        </InfoCard>
      )}
    </div>
  );
}
