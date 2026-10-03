import { type LucideIcon, Bell, CalendarHeart, HeartPulse, ListChecks, Repeat, Scale, ShieldCheck, Target } from "lucide-react";
import { ReviewSection, ValueList, type ReviewRow } from "../../../../Composites/reviewSection/ReviewSection";
import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";
import {
  BIRTH_CONTROL_OPTIONS,
  CYCLE_LENGTH_OPTIONS,
  FERTILITY_GOAL_OPTIONS,
  GOAL_TRACKING,
  BIRTH_CONTROL_CATEGORIES,
  REGULARITY_OPTIONS,
} from "../../../../constants";
import { bmiCategory, validBmi, effectiveDuration, formatLongDate, pluralDays, trackingLabel } from "../../../../lib/health";
import type { OnboardingData, StepId } from "../../../../types";
import { resolvedList } from "../stepSymptoms/StepSymptoms";

interface StepReviewProps {
  data: OnboardingData;
  onEdit: (step: StepId) => void;
}

const dash = <span className="font-medium text-ink-placeholder">Not provided</span>;

function reminderText(on: boolean, days?: number) {
  return on ? `On · ${days ?? 1} ${days === 1 || !days ? "day" : "days"} before` : "Off";
}

export function StepReview({ data, onEdit }: StepReviewProps) {
  const cycle =
    data.cycleLengthOption === "known" && data.cycleLength
      ? pluralDays(data.cycleLength)
      : CYCLE_LENGTH_OPTIONS.find((o) => o.value === data.cycleLengthOption)?.label;

  const duration = effectiveDuration(data);
  const bmi = validBmi(data.height, data.weight);

  const conditions = data.medicalConditions.flatMap((c) =>
    c === "Other" ? [data.otherMedicalCondition.trim() || "Other"] : [c],
  );
  const meds = data.takingMedication ? data.medications.map((m) => m.trim()).filter(Boolean) : [];

  const goal = data.fertilityGoal;
  const cfg = goal ? GOAL_TRACKING[goal] : undefined;
  const required = cfg ? cfg.required.map((k) => trackingLabel(goal, k)) : [];
  const optional = cfg ? cfg.optional.filter((k) => data.fertilityTracking[k]).map((k) => trackingLabel(goal, k)) : [];

  const bcCategory = BIRTH_CONTROL_CATEGORIES.find((c) => c.value === data.birthControlCategory)?.label;
  const bcMethod =
    data.birthControlCategory === "other" || data.birthControlMethod === "Other"
      ? data.birthControlCustomMethod.trim() || "Other"
      : data.birthControlMethod;

  const customTracking = [
    data.symptoms.includes("Other") && data.customSymptom.trim(),
    data.moods.includes("Other") && data.customMood.trim(),
  ].filter((x): x is string => !!x);

  const sections: { title: string; icon: LucideIcon; editStep: StepId; rows: ReviewRow[] }[] = [
    {
      title: "Last period",
      icon: CalendarHeart,
      editStep: 1,
      rows: [
        { label: "Date", value: data.lastPeriod ? formatLongDate(data.lastPeriod) : dash },
        ...(data.name.trim() || data.age
          ? [{ label: "Profile", value: [data.name.trim(), data.age && `${data.age} years`].filter(Boolean).join(" · ") }]
          : []),
      ],
    },
    {
      title: "Cycle pattern",
      icon: Repeat,
      editStep: 2,
      rows: [
        { label: "Cycle length", value: cycle ?? dash, editStep: 2 },
        {
          label: "Regularity",
          value: REGULARITY_OPTIONS.find((o) => o.value === data.periodRegularity)?.label ?? dash,
          editStep: 3,
        },
        { label: "Duration", value: duration ? pluralDays(duration) : dash, editStep: 4 },
      ],
    },
    {
      title: "Health",
      icon: Scale,
      editStep: 5,
      rows: [
        { label: "Height", value: data.height ? `${data.height} cm` : dash },
        { label: "Weight", value: data.weight ? `${data.weight} kg` : dash },
        { label: "BMI", value: bmi ? `${bmi.toFixed(1)} · ${bmiCategory(bmi)}` : dash },
      ],
    },
    {
      title: "Medical information",
      icon: HeartPulse,
      editStep: 6,
      rows: [
        { label: "Conditions", value: <ValueList items={conditions} /> },
        {
          label: "Medications",
          value: data.takingMedication === false ? "None" : <ValueList items={meds} empty="Not provided" />,
        },
      ],
    },
    {
      title: "Tracking preferences",
      icon: ListChecks,
      editStep: 7,
      rows: [
        { label: "Symptoms", value: <ValueList items={resolvedList(data.symptoms, "").filter(Boolean)} /> },
        { label: "Mood", value: <ValueList items={resolvedList(data.moods, "").filter(Boolean)} /> },
        { label: "Custom", value: <ValueList items={customTracking} empty="None" /> },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      editStep: 8,
      rows: [
        { label: "Period", value: reminderText(data.periodReminder, data.periodReminderDays) },
        { label: "Ovulation", value: reminderText(data.ovulationReminder, data.ovulationReminderDays) },
      ],
    },
    {
      title: "Birth control",
      icon: ShieldCheck,
      editStep: 9,
      rows: [
        { label: "Preference", value: BIRTH_CONTROL_OPTIONS.find((o) => o.value === data.birthControl)?.label ?? dash },
        ...(data.birthControl === "yes" && bcCategory ? [{ label: "Type", value: bcCategory }] : []),
        ...(data.birthControl === "yes" && bcMethod ? [{ label: "Method", value: bcMethod }] : []),
      ],
    },
    {
      title: "Fertility goal",
      icon: Target,
      editStep: 10,
      rows: [
        { label: "Goal", value: FERTILITY_GOAL_OPTIONS.find((o) => o.value === goal)?.label ?? dash },
        ...(cfg && cfg.required.length ? [{ label: "Required", value: <ValueList items={required} /> }] : []),
        ...(cfg ? [{ label: "Optional", value: <ValueList items={optional} empty="None enabled" /> }] : []),
      ],
    },
  ];

  return (
    <div>
      <StepHeader
        step={11}
        title="Review your tracker setup"
        subtitle="Everything looks good? You can edit any section before finishing."
      />
      <div className="grid gap-2 @md:grid-cols-2">
        {sections.map((s, i) => (
          <ReviewSection key={s.title} index={i} title={s.title} icon={s.icon} rows={s.rows} editStep={s.editStep} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}
