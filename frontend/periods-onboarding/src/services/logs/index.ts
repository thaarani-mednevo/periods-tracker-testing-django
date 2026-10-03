import { apiRequest } from "../api/client";
import { localISODate } from "../cycle";

// Mirrors backend/apps/logs/schema.py - keep the two in sync.
export const FLOWS = ["Spotting", "Light", "Medium", "Heavy"] as const;
export const BLOOD_COLORS = ["Bright Red", "Dark Red", "Brown", "Pink"] as const;
export const CLOT_SIZES = ["Small", "Medium", "Large"] as const;
export const CRAMPS = ["None", "Mild", "Moderate", "Severe"] as const;
export const MOODS = ["Happy", "Calm", "Neutral", "Irritable", "Sad"] as const;
export const ENERGIES = ["Low", "Moderate", "High"] as const;
export const LIBIDOS = ["Low", "Medium", "High"] as const;
export const MUCUS = ["Dry", "Sticky", "Creamy", "Watery", "Egg white"] as const;
export const LH_TESTS = ["Negative", "Low", "High", "Peak"] as const;
export const SLEEPS = ["Poor", "Fair", "Good", "Excellent"] as const;
export const LEVELS = ["None", "Mild", "Moderate", "High"] as const;
export const SYMPTOMS = [
  { id: "headache", label: "Headache" },
  { id: "bloating", label: "Bloating" },
  { id: "fatigue", label: "Fatigue" },
  { id: "backPain", label: "Back pain" },
  { id: "breastTenderness", label: "Breast tenderness" },
  { id: "acne", label: "Acne" },
  { id: "nausea", label: "Nausea" },
  { id: "cravings", label: "Cravings" },
  { id: "insomnia", label: "Insomnia" },
  { id: "anxiety", label: "Anxiety" },
] as const;
export const PRODUCT_TYPES = ["Pad", "Tampon", "Menstrual cup", "Other"] as const;

export type Flow = (typeof FLOWS)[number];
export type BloodColor = (typeof BLOOD_COLORS)[number];
export type ClotSize = (typeof CLOT_SIZES)[number];
export type Cramps = (typeof CRAMPS)[number];
export type Mood = (typeof MOODS)[number];
export type Energy = (typeof ENERGIES)[number];
export type Libido = (typeof LIBIDOS)[number];
export type Mucus = (typeof MUCUS)[number];
export type LhTest = (typeof LH_TESTS)[number];
export type Sleep = (typeof SLEEPS)[number];
export type Level = (typeof LEVELS)[number];
export type SymptomKey = (typeof SYMPTOMS)[number]["id"];
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_SIZES: Record<ProductType, readonly string[]> = {
  Pad: ["Small", "Medium", "Large", "Overnight"],
  Tampon: ["Light", "Regular", "Super"],
  "Menstrual cup": ["Small", "Medium", "Large"],
  Other: [],
};

export interface Product {
  type: ProductType;
  label: string;
  size: string | null;
  quantity: number;
}

/** One day of self-reported data. `null` / [] means "not recorded"; nothing is ever pre-filled. */
export interface DailyLog {
  date: string;
  flow: Flow | null;
  bloodColor: BloodColor | null;
  clotsPresent: boolean | null;
  clotSize: ClotSize | null;
  cramps: Cramps | null;
  painScore: number | null;
  symptoms: SymptomKey[];
  mood: Mood | null;
  energy: Energy | null;
  libido: Libido | null;
  cervicalMucus: Mucus | null;
  bbtCelsius: number | null;
  bbtTime: string | null;
  lhTest: LhTest | null;
  intercourse: boolean | null;
  sleep: Sleep | null;
  fatigue: Level | null;
  cravings: Level | null;
  waterMl: number | null;
  steps: number | null;
  weightKg: number | null;
  products: Product[];
  notes: string | null;
}

export function emptyLog(date: string): DailyLog {
  return {
    date, flow: null, bloodColor: null, clotsPresent: null, clotSize: null, cramps: null, painScore: null,
    symptoms: [], mood: null, energy: null, libido: null, cervicalMucus: null, bbtCelsius: null, bbtTime: null,
    lhTest: null, intercourse: null, sleep: null, fatigue: null, cravings: null, waterMl: null, steps: null,
    weightKg: null, products: [], notes: null,
  };
}

const q = () => ({ date: localISODate() });

export const getDailyLog = (day: string, signal?: AbortSignal) =>
  apiRequest<DailyLog>(`/api/v1/logs/${day}`, { query: q(), signal });

export function saveDailyLog(day: string, log: DailyLog) {
  const body: Partial<DailyLog> = { ...log };
  delete body.date;
  return apiRequest<DailyLog>(`/api/v1/logs/${day}`, { method: "PUT", query: q(), body });
}

export const getLogRange = (start: string, end: string, signal?: AbortSignal) =>
  apiRequest<{ logs: DailyLog[] }>("/api/v1/logs", { query: { ...q(), start, end }, signal });

// ---- medications
export type IntakeStatus = "taken" | "skipped" | "pending";

export interface Medication {
  id: number;
  name: string;
  dose: string;
  form: string;
  frequency: string;
  time: string;
  startDate: string | null;
  endDate: string | null;
  reminder: boolean;
  status: IntakeStatus;
}

export interface NewMedication {
  name: string;
  dose: string;
  form: string;
  frequency: string;
  time: string;
  startDate: string | null;
  endDate: string | null;
  reminder: boolean;
}

export const getMedications = (day: string, signal?: AbortSignal) =>
  apiRequest<{ medications: Medication[] }>("/api/v1/medications", { query: { ...q(), day }, signal });

export const addMedication = (m: NewMedication) =>
  apiRequest<Medication>("/api/v1/medications", { method: "POST", query: q(), body: m });

export const updateMedication = (id: number, m: Partial<NewMedication>) =>
  apiRequest<Medication>(`/api/v1/medications/${id}`, { method: "PATCH", query: q(), body: m });

export const removeMedication = (id: number) =>
  apiRequest<void>(`/api/v1/medications/${id}`, { method: "DELETE", query: q() });
export const setIntake = (id: number, day: string, status: "taken" | "skipped" | null) =>
  apiRequest<{ id: number; status: IntakeStatus }>(`/api/v1/medications/${id}/intake/${day}`, {
    method: "PUT",
    query: q(),
    body: { status },
  });

export interface IntakeRecord {
  date: string;
  name: string;
  dose: string;
  /** "pending" = due on the last day of the range but not marked yet */
  status: "taken" | "skipped" | "pending";
}

export const getMedicationHistory = (start: string, end: string, signal?: AbortSignal) =>
  apiRequest<{ intakes: IntakeRecord[] }>("/api/v1/medications/history", { query: { ...q(), start, end }, signal });
