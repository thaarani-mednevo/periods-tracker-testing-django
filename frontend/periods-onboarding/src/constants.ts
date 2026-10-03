import type {
  BirthControlAnswer,
  CycleLengthOption,
  FertilityGoal,
  FertilityTracking,
  OnboardingData,
  Option,
  PeriodRegularity,
  StepId,
  StepMeta,
  TrackingKey,
} from "./types";

export const TOTAL_STEPS = 11;

export const STEPS: StepMeta[] = [
  { id: 1, label: "Last Period" },
  { id: 2, label: "Cycle Length" },
  { id: 3, label: "Period Regularity" },
  { id: 4, label: "Period Duration" },
  { id: 5, label: "Health Details" },
  { id: 6, label: "Medical Info" },
  { id: 7, label: "Symptom & Mood" },
  { id: 8, label: "Notifications" },
  { id: 9, label: "Birth Control" },
  { id: 10, label: "Fertility Goals" },
  { id: 11, label: "Review" },
];

export const STEP_IDS: readonly StepId[] = STEPS.map((s) => s.id);

/** Next / previous step without numeric casts; undefined at the ends. */
export function nextStepId(step: StepId): StepId | undefined {
  return STEP_IDS[STEP_IDS.indexOf(step) + 1];
}
export function prevStepId(step: StepId): StepId | undefined {
  const i = STEP_IDS.indexOf(step);
  return i > 0 ? STEP_IDS[i - 1] : undefined;
}

export const CYCLE_LENGTH_OPTIONS: Option<Exclude<CycleLengthOption, "">>[] = [
  { value: "known", label: "I know my cycle", description: "Set your usual number of days" },
  { value: "unsure", label: "I'm not sure", description: "We'll estimate it over time" },
  { value: "varies", label: "My cycle varies a lot", description: "Length changes month to month" },
];

export const REGULARITY_OPTIONS: Option<Exclude<PeriodRegularity, "">>[] = [
  {
    value: "regular",
    label: "Regular",
    description: "Your periods usually arrive around the same time each cycle.",
  },
  {
    value: "irregular",
    label: "Irregular",
    description: "Your period timing or cycle length changes significantly.",
  },
  {
    value: "unknown",
    label: "I don't know",
    description: "I'm not sure about my cycle pattern yet.",
  },
];

export const REGULARITY_MESSAGES: Record<Exclude<PeriodRegularity, "">, string> = {
  regular: "Great — tracking consistently can help you understand your usual cycle pattern.",
  irregular: "That's okay. Tracking your cycles over time can help you notice changes and patterns.",
  unknown: "No problem. You don't need to know yet. Tracking will help build a clearer picture over time.",
};

export const MEDICAL_CONDITIONS = [
  "PCOS",
  "Endometriosis",
  "Thyroid condition",
  "Anemia",
  "Diabetes",
  "Migraine",
  "Fibroids",
  "Other",
  "None",
] as const;

export const SYMPTOMS = [
  "Cramps",
  "Headache",
  "Back pain",
  "Bloating",
  "Breast tenderness",
  "Fatigue",
  "Nausea",
  "Acne",
  "Discharge",
  "Other",
] as const;

export const MOODS = [
  "Happy",
  "Calm",
  "Neutral",
  "Irritable",
  "Sad",
  "Anxious",
  "Low energy",
  "Other",
] as const;

export const BIRTH_CONTROL_OPTIONS: Option<Exclude<BirthControlAnswer, "">>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "prefer-not-to-say", label: "I prefer not to say" },
];

export const BIRTH_CONTROL_MESSAGES: Record<Exclude<BirthControlAnswer, "">, string> = {
  yes: "Birth control can influence bleeding patterns and cycle-related symptoms. Your tracker will take your selection into account when presenting cycle information.",
  no: "Your cycle insights will be based on the information you log.",
  "prefer-not-to-say": "That's completely okay. You can continue without sharing this information.",
};

export const BIRTH_CONTROL_CATEGORIES = [
  { value: "natural", label: "Calendar / Natural", description: "Cycle-based or barrier-free approaches" },
  { value: "hormonal", label: "Hormonal", description: "Pill, patch, implant and similar" },
  { value: "other", label: "Other", description: "Something not listed here" },
] as const;

/** Methods shown once a category is chosen. "Other" always defers to the free-text field. */
export const BIRTH_CONTROL_METHODS_BY_CATEGORY = {
  natural: ["Fertility awareness", "Cycle tracking", "Withdrawal", "Other"],
  hormonal: ["Pill", "Patch", "Ring", "Injection", "Implant", "Hormonal IUD", "Other"],
  other: [],
} as const;

export const FERTILITY_GOAL_OPTIONS: Option<Exclude<FertilityGoal, "">>[] = [
  {
    value: "trying-to-conceive",
    label: "Trying to conceive",
    description: "Understand your fertile window",
  },
  {
    value: "pregnancy-prevention",
    label: "Pregnancy prevention",
    description: "Compare logs with fertile-window patterns",
  },
  {
    value: "understand-cycle",
    label: "Understand my cycle",
    description: "Learn your body's rhythm",
  },
];

export interface GoalTrackingConfig {
  heading: string;
  required: TrackingKey[];
  optional: TrackingKey[];
  explanation?: string;
  safety?: string;
  /** Per-goal label overrides (e.g. "Ovulation symptoms" when trying to conceive). */
  labels?: Partial<Record<TrackingKey, string>>;
}

export const TRACKING_LABELS: Record<TrackingKey, string> = {
  intercourse: "Intercourse tracking",
  cervicalMucus: "Cervical mucus",
  bbt: "BBT",
  lhTest: "LH test",
  symptoms: "Symptoms",
  mood: "Mood",
  libido: "Libido",
};

export const TRACKING_DESCRIPTIONS: Record<TrackingKey, string> = {
  intercourse: "Log intimate activity dates",
  cervicalMucus: "Note changes in consistency",
  bbt: "Basal body temperature each morning",
  lhTest: "Record ovulation test results",
  symptoms: "Physical signs through your cycle",
  mood: "Emotional changes across phases",
  libido: "Changes in desire",
};

export const GOAL_TRACKING: Record<Exclude<FertilityGoal, "">, GoalTrackingConfig> = {
  "trying-to-conceive": {
    heading: "Recommended fertility tracking",
    required: ["cervicalMucus", "intercourse"],
    optional: ["bbt", "lhTest", "symptoms", "libido"],
    explanation:
      "Cervical mucus and intercourse tracking can provide additional context around your fertile window.",
    labels: { lhTest: "LH ovulation test", symptoms: "Ovulation symptoms" },
  },
  "pregnancy-prevention": {
    heading: "Recommended tracking",
    required: ["intercourse"],
    optional: ["cervicalMucus", "bbt", "lhTest", "symptoms"],
    explanation:
      "Intercourse tracking helps you compare logged dates with your cycle and fertile-window patterns.",
    safety:
      "Cycle tracking alone is not a guaranteed method of pregnancy prevention. Fertility estimates can be inaccurate, especially when cycles vary.",
    labels: { lhTest: "LH tests" },
  },
  "understand-cycle": {
    heading: "Optional tracking",
    required: [],
    optional: ["intercourse", "cervicalMucus", "bbt", "lhTest", "mood", "symptoms", "libido"],
  },
};

export const TRACKING_KEYS: readonly TrackingKey[] = [
  "intercourse",
  "cervicalMucus",
  "bbt",
  "lhTest",
  "symptoms",
  "mood",
  "libido",
];

export const EMPTY_TRACKING: FertilityTracking = {
  intercourse: false,
  cervicalMucus: false,
  bbt: false,
  lhTest: false,
  symptoms: false,
  mood: false,
  libido: false,
};

export const CYCLE_RANGE = { min: 15, max: 365, default: 28, sliderMax: 120 } as const;
export const DURATION_RANGE = { min: 1, max: 30, default: 5, manualMax: 90 } as const;
export const HEIGHT_RANGE = { min: 100, max: 250 } as const;
export const WEIGHT_RANGE = { min: 25, max: 300 } as const;
export const AGE_RANGE = { min: 9, max: 70 } as const;

export const INITIAL_DATA: OnboardingData = {
  lastPeriod: "",
  name: "",
  age: undefined,
  cycleLengthOption: "",
  cycleLength: undefined,
  periodRegularity: "",
  periodDuration: DURATION_RANGE.default,
  useManualDuration: false,
  manualPeriodDuration: undefined,
  height: undefined,
  weight: undefined,
  medicalConditions: [],
  otherMedicalCondition: "",
  takingMedication: null,
  medications: [""],
  symptoms: [],
  customSymptom: "",
  moods: [],
  customMood: "",
  periodReminder: false,
  periodReminderDays: undefined,
  ovulationReminder: false,
  ovulationReminderDays: undefined,
  birthControl: "",
  birthControlCategory: "",
  birthControlMethod: "",
  birthControlCustomMethod: "",
  fertilityGoal: "",
  fertilityTracking: EMPTY_TRACKING,
};
