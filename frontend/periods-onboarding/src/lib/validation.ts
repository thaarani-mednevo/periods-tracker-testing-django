import {
  AGE_RANGE,
  CYCLE_RANGE,
  DURATION_RANGE,
  HEIGHT_RANGE,
  WEIGHT_RANGE,
} from "../constants";
import type { OnboardingData, StepErrors, StepId } from "../types";
import { parseISODate } from "./health";

function inRange(v: number | undefined, min: number, max: number): boolean {
  return v !== undefined && Number.isFinite(v) && v >= min && v <= max;
}

export function validateStep(step: StepId, data: OnboardingData): StepErrors {
  const e: StepErrors = {};

  switch (step) {
    case 1: {
      const date = parseISODate(data.lastPeriod);
      if (!date) {
        e.lastPeriod = "Please choose the first day of your last period.";
      } else {
        const now = new Date();
        const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        if (date.getTime() > todayUtc) e.lastPeriod = "The date can't be in the future.";
      }
      if (data.age !== undefined && !inRange(data.age, AGE_RANGE.min, AGE_RANGE.max)) {
        e.age = `Age should be between ${AGE_RANGE.min} and ${AGE_RANGE.max}.`;
      }
      break;
    }
    case 2:
      if (!data.cycleLengthOption) e.cycleLengthOption = "Please choose the option that fits you best.";
      if (data.cycleLengthOption === "known") {
        if (data.cycleLength === undefined || data.cycleLength === null || isNaN(data.cycleLength)) {
          e.cycleLength = "Please enter your usual cycle length.";
        } else if (!Number.isInteger(data.cycleLength) || data.cycleLength < CYCLE_RANGE.min) {
          e.cycleLength = `Cycle length must be at least ${CYCLE_RANGE.min} days.`;
        } else if (data.cycleLength > CYCLE_RANGE.max) {
          e.cycleLength = `Cycle length cannot exceed ${CYCLE_RANGE.max} days.`;
        }
      }
      break;
    case 3:
      if (!data.periodRegularity) e.periodRegularity = "Please choose how regular your periods are.";
      break;
    case 4:
      if (data.useManualDuration) {
        if (data.manualPeriodDuration === undefined) {
          e.manualPeriodDuration = "Please enter the number of days.";
        } else if (
          !Number.isInteger(data.manualPeriodDuration) ||
          !inRange(data.manualPeriodDuration, DURATION_RANGE.min, DURATION_RANGE.manualMax)
        ) {
          e.manualPeriodDuration = `Please enter a whole number between ${DURATION_RANGE.min} and ${DURATION_RANGE.manualMax}.`;
        }
      } else if (!inRange(data.periodDuration, DURATION_RANGE.min, DURATION_RANGE.max)) {
        e.periodDuration = "Please set how many days your period usually lasts.";
      }
      break;
    case 5:
      if (data.height === undefined) e.height = "Please enter your height.";
      else if (!inRange(data.height, HEIGHT_RANGE.min, HEIGHT_RANGE.max))
        e.height = `Height should be between ${HEIGHT_RANGE.min} and ${HEIGHT_RANGE.max} cm.`;
      if (data.weight === undefined) e.weight = "Please enter your weight.";
      else if (!inRange(data.weight, WEIGHT_RANGE.min, WEIGHT_RANGE.max))
        e.weight = `Weight should be between ${WEIGHT_RANGE.min} and ${WEIGHT_RANGE.max} kg.`;
      break;
    case 6:
      if (data.medicalConditions.length === 0)
        e.medicalConditions = "Select any that apply, or choose None.";
      if (data.medicalConditions.includes("Other") && !data.otherMedicalCondition.trim())
        e.otherMedicalCondition = "Please specify your condition.";
      if (data.takingMedication === null) e.takingMedication = "Please let us know if you take any medications.";
      if (data.takingMedication && !data.medications.some((m) => m.trim()))
        e.medications = "Please add at least one medication.";
      break;
    case 7:
      if (data.symptoms.includes("Other") && !data.customSymptom.trim())
        e.customSymptom = "Tell us which symptom you'd like to track.";
      if (data.moods.includes("Other") && !data.customMood.trim())
        e.customMood = "Tell us which feeling you'd like to track.";
      break;
    case 8:
      break;
    case 9:
      if (!data.birthControl) e.birthControl = "Please choose an option to continue.";
      if (data.birthControl === "yes") {
        if (!data.birthControlCategory) {
          e.birthControlCategory = "Please choose the type you're using.";
        } else if (data.birthControlCategory !== "other" && !data.birthControlMethod) {
          e.birthControlMethod = "Please choose a method.";
        } else if (
          (data.birthControlCategory === "other" || data.birthControlMethod === "Other") &&
          !data.birthControlCustomMethod.trim()
        ) {
          e.birthControlCustomMethod = "Please specify your method.";
        }
      }
      break;
    case 10:
      if (!data.fertilityGoal) e.fertilityGoal = "Please choose what you're focusing on right now.";
      break;
    case 11:
      break;
  }

  return e;
}

export function hasErrors(errors: StepErrors): boolean {
  return Object.values(errors).some(Boolean);
}
