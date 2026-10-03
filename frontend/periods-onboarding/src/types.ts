export type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type CycleLengthOption = "known" | "unsure" | "varies" | "";
export type PeriodRegularity = "regular" | "irregular" | "unknown" | "";
export type BirthControlAnswer = "yes" | "no" | "prefer-not-to-say" | "";
export type BirthControlCategory = "natural" | "hormonal" | "other" | "";
export type FertilityGoal =
  | "trying-to-conceive"
  | "pregnancy-prevention"
  | "understand-cycle"
  | "";
export type ReminderDays = 1 | 3 | 5;

export type TrackingKey =
  | "intercourse"
  | "cervicalMucus"
  | "bbt"
  | "lhTest"
  | "symptoms"
  | "mood"
  | "libido";

export type FertilityTracking = Record<TrackingKey, boolean>;

export interface OnboardingData {
  // Step 1
  lastPeriod: string; // ISO date "YYYY-MM-DD"
  name: string;
  age?: number;
  // Step 2
  cycleLengthOption: CycleLengthOption;
  cycleLength?: number;
  // Step 3
  periodRegularity: PeriodRegularity;
  // Step 4
  periodDuration?: number;
  useManualDuration: boolean;
  manualPeriodDuration?: number;
  // Step 5
  height?: number; // cm
  weight?: number; // kg
  // BMI is derived from height + weight (validBmi) wherever it is shown — never stored, so it cannot go stale.
  // Step 6
  medicalConditions: string[];
  otherMedicalCondition: string;
  takingMedication: boolean | null;
  medications: string[];
  // Step 7
  symptoms: string[];
  customSymptom: string;
  moods: string[];
  customMood: string;
  // Step 8
  periodReminder: boolean;
  periodReminderDays?: ReminderDays;
  ovulationReminder: boolean;
  ovulationReminderDays?: ReminderDays;
  // Step 9
  birthControl: BirthControlAnswer;
  /** Only set when birthControl is "yes". */
  birthControlCategory: BirthControlCategory;
  /** The chosen method inside the category ("Other" defers to birthControlCustomMethod). */
  birthControlMethod: string;
  birthControlCustomMethod: string;
  // Step 10
  fertilityGoal: FertilityGoal;
  fertilityTracking: FertilityTracking;
}

export type UpdateData = (patch: Partial<OnboardingData>) => void;

/** Field-keyed validation messages for a step. */
export type StepErrors = Partial<Record<keyof OnboardingData, string>>;

export interface StepProps {
  data: OnboardingData;
  update: UpdateData;
  /** Errors are only populated after the user attempts to continue. */
  errors: StepErrors;
}

export interface StepMeta {
  id: StepId;
  label: string;
}

export interface Option<V extends string = string> {
  value: V;
  label: string;
  description?: string;
}

export type FeedbackTone = "short" | "typical" | "long";

export type FlowPhase = "form" | "loading" | "success";
