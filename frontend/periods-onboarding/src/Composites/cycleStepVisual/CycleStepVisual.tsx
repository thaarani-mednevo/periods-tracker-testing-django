import { useCallback, useEffect, useRef, useState, type AnimationEvent, type TransitionEvent } from "react";
import { BMI_VISUALS, STEP_VISUALS, stepVisual, type StepVisual } from "../../assets/cycle-tracker/stepVisuals";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { cn } from "../../lib/cn";
import { bmiVisualKey } from "../../lib/health";
import { nextStepId, prevStepId } from "../../constants";
import type { OnboardingData, StepId } from "../../types";
import { StepScene } from "../stepScenes/StepScenes";
import { GlassWellnessDecor } from "../visuals/glassWellnessDecor/GlassWellnessDecor";
import { StepVisualPanel } from "../visuals/stepVisualPanel/StepVisualPanel";
import { guideBox } from "../visuals/guidePlacement/guidePlacement";
import { SceneCanvas, useSceneLayout } from "../visuals/primitives/primitives";

type Phase = "idle" | "exit" | "enter";

/** Safety net in case a transitionend never fires (e.g. the element was hidden mid-transition). */
const EXIT_FALLBACK_MS = 700;
/** How long the outgoing artwork keeps fading under the incoming one. */
const CROSSFADE_MS = 260;
/** Changing body state within a step (BMI) is a slower, calmer blend. */
const VARIANT_CROSSFADE_MS = 650;

interface CycleStepVisualProps {
  step: StepId;
  /** Drives both the contextual scene and which artwork variant is shown. */
  data: OnboardingData;
  className?: string;
}

/** Warms the neighbouring steps so moving on never shows a half-loaded character. */
function usePreloadNeighbours(step: StepId) {
  useEffect(() => {
    for (const id of [nextStepId(step), prevStepId(step)]) {
      if (id === undefined) continue;
      const img = new Image();
      img.src = STEP_VISUALS[id].src;
    }
    // On and next to Step 5, warm every BMI variant so a category change crossfades without a blank frame.
    if (Math.abs(step - 5) <= 1) {
      for (const variant of Object.values(BMI_VISUALS)) {
        const img = new Image();
        img.src = variant.src;
      }
    }
  }, [step]);
}

/**
 * The right-hand visual for every onboarding step: the animated contextual scene (calendar, cycle
 * wheel, phone, charts, floating data chips, particles) with the step's own character artwork in
 * front of it.
 *
 * The composition is layered inside this panel only — the panel is `relative` + `overflow-hidden` and
 * everything inside is absolutely positioned — so nothing can reach the question card, the stepper,
 * the navigation or the page edge.
 *
 * A step change is choreographed: the guide eases aside while the old scene fades, the new step swaps
 * in, then she returns with a small "over here" nudge. Phases advance on real transition/animation end
 * events, so the sequence never drifts from what is on screen.
 */
export function CycleStepVisual({ step, data, className }: CycleStepVisualProps) {
  const reduce = usePrefersReducedMotion();
  const [animatedStep, setShownStep] = useState<StepId>(step);
  const [animatedPhase, setPhase] = useState<Phase>("idle");
  // With reduced motion there is no choreography: the panel simply shows the current step.
  const shownStep = reduce ? step : animatedStep;
  const phase: Phase = reduce ? "idle" : animatedPhase;
  const phaseRef = useRef<Phase>("idle");
  const stepRef = useRef(step);
  /** Mirrors shownStep for the effect below, which must only react to a new *target* step. */
  const shownStepRef = useRef<StepId>(step);

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const finishExit = useCallback(() => {
    if (phaseRef.current !== "exit") return;
    shownStepRef.current = stepRef.current;
    setShownStep(stepRef.current);
    go("enter");
  }, [go]);

  useEffect(() => {
    stepRef.current = step;
    // Reduced motion renders the target step directly (see visibleStep), so there is nothing to run.
    if (reduce) return;
    if (step === shownStepRef.current && phaseRef.current !== "exit") return;
    go("exit");
    const fallback = window.setTimeout(finishExit, EXIT_FALLBACK_MS);
    return () => window.clearTimeout(fallback);
  }, [step, reduce, go, finishExit]);

  usePreloadNeighbours(step);

  const onExitTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.propertyName === "transform") finishExit();
  };
  const onPointEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && phaseRef.current === "enter") go("idle");
  };

  const bmiKey = bmiVisualKey(data.height, data.weight);
  const visual = stepVisual(shownStep, { bmiKey });

  return (
    <StepVisualPanel
      caption={visual.caption}
      className={cn("h-full min-h-0 w-full", className)}
    >
      <div role="img" aria-label={visual.alt} className="absolute inset-0">
        <SceneCanvas>
          {/* Glass atmosphere — behind everything, contextual to the step */}
          <div
            className={cn(
              "absolute inset-0 z-0 transition-opacity duration-[240ms] ease-out",
              phase === "exit" ? "opacity-0" : "opacity-100",
            )}
          >
            <div key={shownStep} className="absolute inset-0 animate-scene-in">
              <GlassWellnessDecor step={shownStep} />
            </div>
          </div>

          {/* Contextual animated scene — behind the character */}
          <div
            className={cn(
              "absolute inset-0 z-20 transition-[transform,opacity] duration-[240ms] ease-out",
              phase === "exit" ? "translate-x-3 opacity-0" : "translate-x-0 opacity-100",
            )}
          >
            <div key={shownStep} className="absolute inset-0 animate-scene-in [animation-delay:120ms]">
              <StepScene step={shownStep} data={data} />
            </div>
          </div>

          {/* The step's own character artwork — in front of the scene */}
          <GuideSlot step={shownStep} visual={visual} phase={phase} onExitTransitionEnd={onExitTransitionEnd} onPointEnd={onPointEnd} />
        </SceneCanvas>
      </div>
    </StepVisualPanel>
  );
}

/**
 * The character layer: bottom-left of the panel, so the contextual scene keeps the centre, top and
 * right to itself and she never covers a card. She sits 10px below the panel edge (clipped) so the
 * idle lift never reveals the image's bottom crop line, and 8px in from the left so the sway never
 * clips her hair. Three nested transforms keep exit, point and idle float from fighting each other;
 * the artwork itself is only ever contained — never cropped, stretched, rotated or recoloured.
 */
function GuideSlot({
  step,
  visual,
  phase,
  onExitTransitionEnd,
  onPointEnd,
}: {
  step: StepId;
  visual: StepVisual;
  phase: Phase;
  onExitTransitionEnd: (e: TransitionEvent<HTMLDivElement>) => void;
  onPointEnd: (e: AnimationEvent<HTMLDivElement>) => void;
}) {
  // Her box comes from the layout (size) and the step's placement (where the scene leaves room).
  const layout = useSceneLayout();
  const box = guideBox(step, layout);

  // Keep the previous artwork mounted just long enough to fade it out under the new one.
  // A new src on the same step is a variant (the BMI state on Step 5): it gets a slower, opacity-only
  // crossfade so the change reads as deliberate. A new step keeps the quicker hand-off.
  const [outgoing, setOutgoing] = useState<StepVisual | null>(null);
  const [variantSwap, setVariantSwap] = useState(false);
  const shownRef = useRef<{ step: StepId; visual: StepVisual }>({ step, visual });
  useEffect(() => {
    const shown = shownRef.current;
    if (shown.visual.src === visual.src) return;
    const isVariant = shown.step === step;
    shownRef.current = { step, visual };
    setOutgoing(shown.visual);
    setVariantSwap(isVariant);
    const timer = window.setTimeout(() => setOutgoing(null), isVariant ? VARIANT_CROSSFADE_MS : CROSSFADE_MS);
    return () => window.clearTimeout(timer);
  }, [step, visual]);

  return (
    <div
      onTransitionEnd={onExitTransitionEnd}
      style={{ height: box.height, width: box.width, left: box.left, bottom: box.bottom }}
      className={cn(
        "absolute z-30 transition-[transform,opacity] duration-[260ms] ease-out will-change-transform",
        phase === "exit" ? "translate-x-6 opacity-90" : "translate-x-0 opacity-100",
      )}
    >
      <div onAnimationEnd={onPointEnd} className={cn("h-full origin-bottom", phase === "enter" && "animate-character-point")}>
        <div className="relative h-full origin-bottom animate-character-float">
          {outgoing && <StepArtwork key={outgoing.src} visual={outgoing} state="leaving" slow={variantSwap} />}
          <StepArtwork key={visual.src} visual={visual} state="entering" slow={variantSwap} />
        </div>
      </div>
    </div>
  );
}

function StepArtwork({ visual, state, slow }: { visual: StepVisual; state: "entering" | "leaving"; slow: boolean }) {
  return (
    <img
      src={visual.src}
      alt=""
      aria-hidden="true"
      decoding="async"
      draggable={false}
      className={cn(
        "size-full select-none object-contain object-bottom",
        state === "leaving"
          ? cn("absolute inset-0", slow ? "animate-artwork-fade-out" : "animate-artwork-out")
          : slow
            ? "animate-artwork-fade-in"
            : "animate-artwork-in",
      )}
    />
  );
}
