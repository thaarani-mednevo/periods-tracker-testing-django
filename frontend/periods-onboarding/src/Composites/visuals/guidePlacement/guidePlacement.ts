import type { StepId } from "../../../types";
import type { SceneLayout } from "../primitives/primitives";

/**
 * Scene-aware placement for the guide.
 *
 * The contextual animation has priority: each step declares how much room its scene needs on the
 * left, and the guide takes the bottom-left space that is left over. `left` is a share of the canvas
 * width (the 4–8% band), `scale` trims her box where a scene reaches further left or lower than
 * usual, so she stays fully recognisable without ever sitting on top of animated content.
 */
export interface GuidePlacement {
  /** Share of the canvas width between the left edge and the guide. */
  left: number;
  /** Multiplier on her measured box for this scene. */
  scale: number;
  /** Extra lift off the floor, in design px, where a scene puts content along the bottom. */
  lift: number;
}

const DEFAULT: GuidePlacement = { left: 0.05, scale: 1, lift: 0 };

export const GUIDE_PLACEMENT: Record<StepId, GuidePlacement> = {
  // Calendar floats centre-right; the drifting day numbers reach the left edge, so she starts inside them.
  1: { left: 0.06, scale: 1, lift: 0 },
  // Cycle wheel is centred in the scene box with phase chips on its left — keep clear of them.
  2: { left: 0.05, scale: 0.96, lift: 0 },
  // The three pattern cards sit centre-right; the floor shadow spans the bottom.
  3: { left: 0.06, scale: 1, lift: 0 },
  // Hourglass is centred; the "Typical 3–7 days" chip sits bottom-left, so she lifts slightly above it.
  4: { left: 0.05, scale: 0.96, lift: 10 },
  // The height ruler and scan line stand immediately to her right — narrower box, tight to the edge.
  5: { left: 0.04, scale: 0.9, lift: 0 },
  // Health record card is on the left of the scene box; capsule and shield are right.
  6: { left: 0.05, scale: 0.96, lift: 0 },
  // The symptom orbit swings wide and low — smaller box so the orbiting chips stay readable.
  7: { left: 0.04, scale: 0.92, lift: 0 },
  // Phone is centred in the scene box with reminder chips right; she has the full left column.
  8: { left: 0.06, scale: 1, lift: 0 },
  // Shield is centred; method icons orbit it, and flowers sit along the bottom.
  9: { left: 0.06, scale: 1, lift: 0 },
  // Richest scene: wheel centre, tracking chips both sides, BBT/LH panels across the bottom.
  10: { left: 0.04, scale: 0.9, lift: 12 },
  // Dashboard panel spans the scene box; flowers and particles fill the lower right.
  11: { left: 0.05, scale: 0.94, lift: 0 },
};

export interface GuideBox {
  left: number;
  bottom: number;
  width: number;
  height: number;
}

/** The guide's box for a step, in canvas design pixels. */
export function guideBox(step: StepId, layout: SceneLayout): GuideBox {
  const placement = GUIDE_PLACEMENT[step] ?? DEFAULT;
  return {
    left: Math.round(layout.w * placement.left),
    bottom: placement.lift,
    width: Math.round(layout.girlW * placement.scale),
    height: Math.round(layout.girlH * placement.scale),
  };
}
