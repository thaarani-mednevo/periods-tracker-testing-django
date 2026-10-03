/**
 * Central map: one supplied character image per onboarding step.
 *
 * The delivered PNGs live beside these imports in `girl/` and stay the source of truth. What is
 * imported here are the WebP twins generated from them (same basename, long edge capped at 1200px):
 * the panel never renders her wider than ~600 CSS px, and the PNG set is ~27 MB versus ~1 MB of WebP.
 * Regenerate the twins after replacing any PNG with `python scripts/optimize-girl-assets.py`.
 *
 * Nothing here is recoloured, cropped or filtered — the artwork is rendered exactly as supplied.
 */
import type { BmiVisualKey } from "../../lib/health";
import type { StepId } from "../../types";

import genericGirl from "./girl/cycle-tracker-girl.webp";
import lastPeriodGirl from "./girl/last period.webp";
import cycleLengthGirl from "./girl/cycle length.webp";
import periodRegularityGirl from "./girl/period regularity.webp";
import periodDurationGirl from "./girl/period duration.webp";
import healthDetailsGirl from "./girl/health detail.webp";
import heightWeightGirl from "./girl/hieght weight.webp";
import notificationGirl from "./girl/notification.webp";
import birthControlGirl from "./girl/birth control.webp";
import fertilityGoalGirl from "./girl/fertility goal.webp";
import reviewGirl from "./girl/review.webp";

/** The shared character, used where no step context applies (progress avatar, welcome, success). */
export const GENERIC_GIRL = genericGirl;

export interface StepVisual {
  src: string;
  /** Describes what the artwork shows, for assistive tech. */
  alt: string;
  /** Short line shown under the artwork. */
  caption: string;
}

/**
 * Step → artwork. Steps 6 and 7 have no dedicated image yet and fall back to the shared character;
 * drop `medical info.png` / `symptoms mood.png` into `girl/`, regenerate the WebP twins and swap the
 * two entries below.
 */
export const STEP_VISUALS: Record<StepId, StepVisual> = {
  1: { src: lastPeriodGirl, alt: "Guide holding a phone beside a calendar, asking when your last period was", caption: "Your cycle begins on day one" },
  2: { src: cycleLengthGirl, alt: "Guide holding a cycle calendar, wondering how long your cycle is", caption: "Four phases of your menstrual cycle" },
  3: { src: periodRegularityGirl, alt: "Guide holding a calendar, asking whether your period is regular", caption: "Pattern recognition improves as you log" },
  4: { src: periodDurationGirl, alt: "Guide holding a calendar of period days, asking how long your period lasts", caption: "Typical bleeding lasts around 3–7 days" },
  5: { src: healthDetailsGirl, alt: "Guide holding a health details card listing height, weight and medications", caption: "Measurements personalise your insights" },
  6: { src: genericGirl, alt: "Guide pointing towards the medical information question", caption: "Context for more relevant tracking" },
  7: { src: genericGirl, alt: "Guide pointing towards the symptoms and mood question", caption: "Your personal wellness signals" },
  8: { src: notificationGirl, alt: "Guide setting period and ovulation reminders on a phone", caption: "Gentle reminders, on your terms" },
  9: { src: birthControlGirl, alt: "Guide holding a birth control tracking card", caption: "Sensitive answers stay optional" },
  10: { src: fertilityGoalGirl, alt: "Guide considering fertility goal options", caption: "Tracking focused on your goal" },
  11: { src: reviewGirl, alt: "Guide reviewing the finished tracker setup", caption: "Your personalised tracker, assembled" },
};

/** Step 5 switches to the girl on the scale once a BMI can be calculated. */
export const HEIGHT_WEIGHT_VISUAL: StepVisual = {
  src: heightWeightGirl,
  alt: "Guide standing on a weighing scale",
  caption: "Measurements personalise your insights",
};

/**
 * Optional per-BMI artwork. Drop any of these into `girl/` and it is picked up automatically:
 *
 *   girl-underweight.png   girl-normal.png   girl-overweight.png   girl-obesity.png
 *
 * (a same-name .webp twin is preferred when present). A state without its own file falls back to the
 * single scale artwork above — the image is never stretched or squeezed to fake a body type.
 */
const BMI_ASSET_FILES = import.meta.glob<string>("./girl/girl-{underweight,normal,overweight,obesity}.{webp,png}", {
  eager: true,
  query: "?url",
  import: "default",
});

function bmiAsset(key: BmiVisualKey): string | undefined {
  return BMI_ASSET_FILES[`./girl/girl-${key}.webp`] ?? BMI_ASSET_FILES[`./girl/girl-${key}.png`];
}

const BMI_ALT: Record<BmiVisualKey, string> = {
  underweight: "Guide standing on a weighing scale — BMI category: underweight",
  normal: "Guide standing on a weighing scale — BMI category: normal",
  overweight: "Guide standing on a weighing scale — BMI category: overweight",
  obesity: "Guide standing on a weighing scale — BMI category: obesity",
};

export const BMI_VISUALS: Record<BmiVisualKey, StepVisual> = {
  underweight: { ...HEIGHT_WEIGHT_VISUAL, src: bmiAsset("underweight") ?? HEIGHT_WEIGHT_VISUAL.src, alt: BMI_ALT.underweight },
  normal: { ...HEIGHT_WEIGHT_VISUAL, src: bmiAsset("normal") ?? HEIGHT_WEIGHT_VISUAL.src, alt: BMI_ALT.normal },
  overweight: { ...HEIGHT_WEIGHT_VISUAL, src: bmiAsset("overweight") ?? HEIGHT_WEIGHT_VISUAL.src, alt: BMI_ALT.overweight },
  obesity: { ...HEIGHT_WEIGHT_VISUAL, src: bmiAsset("obesity") ?? HEIGHT_WEIGHT_VISUAL.src, alt: BMI_ALT.obesity },
};

/** The artwork for a step, given what the user has answered so far. */
export function stepVisual(step: StepId, opts?: { bmiKey?: BmiVisualKey }): StepVisual {
  if (step === 5 && opts?.bmiKey) return BMI_VISUALS[opts.bmiKey];
  return STEP_VISUALS[step];
}
