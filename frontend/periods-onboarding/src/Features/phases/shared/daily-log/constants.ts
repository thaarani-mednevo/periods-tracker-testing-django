export const WATER_TARGET_ML = 2500;
export const GLASS_ML = 250;
export const STEP_GOALS = [3000, 5000, 7000] as const;
export const DEFAULT_STEP_GOAL = 5000;

export const MEDICATION_TYPES = ["Capsule", "Tablet", "Syrup", "Drops", "Injection", "Cream", "Other"] as const;
export const MEDICATION_FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Every other day", "Once weekly", "As needed"] as const;