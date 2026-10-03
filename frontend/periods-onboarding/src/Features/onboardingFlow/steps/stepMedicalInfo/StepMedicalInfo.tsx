import { ClipboardPlus, Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FieldError, FieldGroup, TextField } from "../../../../Elements/fields/Fields";
import { OptionCard, handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";
import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";
import { MEDICAL_CONDITIONS } from "../../../../constants";
import { cn } from "../../../../lib/cn";
import type { StepProps } from "../../../../types";

export function StepMedicalInfo({ data, update, errors }: StepProps) {
  const [rowIds, setRowIds] = useState<string[]>(() =>
    data.medications.map(() => Math.random().toString(36).slice(2, 9)),
  );

  const toggleCondition = (c: string) => {
    const has = data.medicalConditions.includes(c);
    if (c === "None") {
      update({
        medicalConditions: has ? [] : ["None"],
        otherMedicalCondition: "",
      });
      return;
    }
    const withoutNone = data.medicalConditions.filter((x) => x !== "None");
    const nextConditions = has ? withoutNone.filter((x) => x !== c) : [...withoutNone, c];
    update({
      medicalConditions: nextConditions,
      ...(has && c === "Other" ? { otherMedicalCondition: "" } : {}),
    });
  };

  const setMedication = (i: number, value: string) => {
    const next = [...data.medications];
    next[i] = value;
    update({ medications: next });
  };

  const removeMedication = (i: number) => {
    const next = data.medications.filter((_, idx) => idx !== i);
    const ids = rowIds.filter((_, idx) => idx !== i);
    const finalNext = next.length ? next : [""];
    const finalIds = next.length ? ids : [Math.random().toString(36).slice(2, 9)];
    update({ medications: finalNext });
    setRowIds(finalIds);
    // The pressed button is gone — keep keyboard users in the list instead of dropping focus to <body>.
    requestAnimationFrame(() => document.getElementById(`med-${Math.max(0, i - 1)}`)?.focus());
  };

  const addMedication = () => {
    update({ medications: [...data.medications, ""] });
    setRowIds((ids) => [...ids, Math.random().toString(36).slice(2, 9)]);
    requestAnimationFrame(() => document.getElementById(`med-${data.medications.length}`)?.focus());
  };

  const handleTakingMedication = (taking: boolean) => {
    if (taking === data.takingMedication) return;
    if (taking) {
      const initialMeds = data.medications.length ? data.medications : [""];
      update({ takingMedication: true, medications: initialMeds });
      if (!rowIds.length) {
        setRowIds([Math.random().toString(36).slice(2, 9)]);
      }
    } else {
      update({ takingMedication: false, medications: [] });
    }
  };

  return (
    <div>
      <StepHeader
        step={6}
        title="Do you have any medical conditions or take any medications?"
        subtitle="Select anything relevant so we can personalize your tracking experience."
        badge={
          <span className="inline-flex items-center gap-1 text-micro font-medium text-ink-muted" title="Your health information is used only to personalize your experience.">
            <Lock className="size-3 text-rose" aria-hidden="true" />
            Used only to personalize
          </span>
        }
      />

      <FieldGroup icon={ClipboardPlus} title="Medical conditions" helper="Select all that apply." error={errors.medicalConditions}>
        {/* Full-width checkbox cards; two per row only when the card is wide enough to keep them roomy. */}
        <div className="grid gap-1.5 @xs:grid-cols-2">
          {MEDICAL_CONDITIONS.map((c) => (
            <OptionCard key={c} mode="checkbox" size="sm" label={c} selected={data.medicalConditions.includes(c)} onSelect={() => toggleCondition(c)} />
          ))}
        </div>
      </FieldGroup>

      {data.medicalConditions.includes("Other") && (
        <TextField
          id="other-condition"
          label="Please specify"
          className="mt-2 animate-expand"
          value={data.otherMedicalCondition}
          onChange={(otherMedicalCondition) => update({ otherMedicalCondition })}
          placeholder="Please specify, e.g. Hypertension"
          error={errors.otherMedicalCondition}
          srOnlyLabel
        />
      )}

      {/* Medication question, then a full-width Yes / No */}
      <div className="flex flex-col gap-2">
        <p id="meds-q" className="text-body font-semibold text-ink">
          Are you currently taking any medications?
        </p>
        <div role="radiogroup" tabIndex={-1} aria-labelledby="meds-q" onKeyDown={handleRadioKeys} className="grid w-full grid-cols-2 gap-1 rounded-[14px] border border-line bg-blush-50 p-1">
          {[
            { label: "Yes", value: true },
            { label: "No", value: false },
          ].map((o) => {
            const on = data.takingMedication === o.value;
            return (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={data.takingMedication === null || on ? 0 : -1}
                onClick={() => handleTakingMedication(o.value)}
                className={cn(
                  "min-h-11 rounded-[10px] text-body-sm font-semibold transition-[background-color,color,box-shadow] duration-200 focus-ring pointer-fine:min-h-9",
                  on ? "bg-white text-rose-ink shadow-[0_1px_4px_rgb(40_20_30/0.06)] ring-1 ring-select-border" : "text-ink-soft hover:bg-hover-bg",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
      <FieldError message={errors.takingMedication} />

      {data.takingMedication && (
        <div className="animate-expand">
          <ul className="grid gap-2" aria-label="Medications">
            {data.medications.map((m, i) => (
              <li key={rowIds[i] ?? `row-${i}`} className="min-w-0 animate-expand">
                <TextField
                  id={`med-${i}`}
                  label={`Medication ${i + 1}`}
                  srOnlyLabel
                  value={m}
                  onChange={(v) => setMedication(i, v)}
                  placeholder="e.g. Levothyroxine"
                  trailing={
                    data.medications.length > 1 || m ? (
                      <button
                        type="button"
                        onClick={() => removeMedication(i)}
                        aria-label={`Remove medication ${i + 1}`}
                        className="grid size-11 shrink-0 place-items-center rounded-[12px] border border-line bg-white/80 text-ink-muted transition hover:border-rose/30 hover:text-rose-ink focus-ring"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null
                  }
                />
              </li>
            ))}
          </ul>
          <FieldError message={errors.medications} />
          <button
            type="button"
            onClick={addMedication}
            className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-1.5 text-body-sm font-semibold text-rose-ink transition hover:bg-blush-50 focus-ring pointer-fine:min-h-8"
          >
            <Plus className="size-4" aria-hidden="true" /> Add another medication
          </button>
        </div>
      )}

    </div>
  );
}
