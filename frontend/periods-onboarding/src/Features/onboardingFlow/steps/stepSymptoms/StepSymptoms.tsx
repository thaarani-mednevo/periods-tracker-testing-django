import { ListChecks, PersonStanding, Smile } from "lucide-react";
import { FieldGroup, TextField } from "../../../../Elements/fields/Fields";

import { SelectChip } from "../../../../Elements/selectChip/SelectChip";

import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";

import { MOODS, SYMPTOMS } from "../../../../constants";

import type { StepProps } from "../../../../types";

/** Resolve "Other" to the user's custom text for display. */
export function resolvedList(items: string[], custom: string): string[] {
  return items.flatMap((i) => (i === "Other" ? (custom.trim() ? [custom.trim()] : []) : [i]));
}

export function StepSymptoms({ data, update, errors }: StepProps) {
  const toggle = (key: "symptoms" | "moods", value: string) => {
    const list = data[key];
    const isRemoving = list.includes(value);
    const next = isRemoving ? list.filter((x) => x !== value) : [...list, value];
    if (key === "symptoms") {
      update({
        symptoms: next,
        ...(isRemoving && value === "Other" ? { customSymptom: "" } : {}),
      });
    } else {
      update({
        moods: next,
        ...(isRemoving && value === "Other" ? { customMood: "" } : {}),
      });
    }
  };

  const tracked = [...resolvedList(data.symptoms, data.customSymptom), ...resolvedList(data.moods, data.customMood)];

  return (
    <div>
      <StepHeader
        step={7}
        title="What would you like to track?"
        subtitle="Choose the symptoms and feelings you want to monitor throughout your cycle."
      />

      <FieldGroup icon={PersonStanding} title="Symptoms" helper="Optional — select as many as you like.">
        <div className="flex flex-wrap gap-1.5">
          {SYMPTOMS.map((s) => (
            <SelectChip key={s} label={s} selected={data.symptoms.includes(s)} onToggle={() => toggle("symptoms", s)} />
          ))}
        </div>
      </FieldGroup>
      {data.symptoms.includes("Other") && (
        <TextField
          id="custom-symptom"
          label="Tell us what you'd like to track"
          srOnlyLabel
          className="mt-2 animate-expand"
          value={data.customSymptom}
          onChange={(customSymptom) => update({ customSymptom })}
          placeholder="Tell us what you'd like to track, e.g. Joint pain"
          error={errors.customSymptom}
        />
      )}

      <FieldGroup icon={Smile} title="Mood" helper="Optional — select as many as you like." className="mt-3.5">
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((m) => (
            <SelectChip key={m} label={m} selected={data.moods.includes(m)} onToggle={() => toggle("moods", m)} />
          ))}
        </div>
      </FieldGroup>
      {data.moods.includes("Other") && (
        <TextField
          id="custom-mood"
          label="Tell us what you'd like to track"
          srOnlyLabel
          className="mt-2 animate-expand"
          value={data.customMood}
          onChange={(customMood) => update({ customMood })}
          placeholder="Tell us what you'd like to track, e.g. Motivated"
          error={errors.customMood}
        />
      )}

      {/* Your tracking list — a compact live summary (the chips above are the editable source). */}
      <section aria-labelledby="tracking-list" className="mt-3.5 flex items-start gap-2.5 rounded-[16px] border border-line bg-gradient-to-br from-white to-blush-50 px-3 py-2.5">
        <ListChecks className="mt-0.5 size-4 shrink-0 text-rose" aria-hidden="true" />
        <div className="min-w-0 flex-1" aria-live="polite">
          <h2 id="tracking-list" className="text-body-sm font-semibold text-ink">
            Your tracking list <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-micro font-bold tabular-nums text-rose-ink">{tracked.length} selected</span>
          </h2>
          <p className="mt-0.5 text-body-sm leading-snug text-ink-soft">
            {tracked.length ? tracked.join(" · ") : "Nothing selected yet — you can always add items later."}
          </p>
        </div>
      </section>
    </div>
  );
}
