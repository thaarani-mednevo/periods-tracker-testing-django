import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConfirmationModal } from "../../Composites/confirmationModal/ConfirmationModal";

import { LoadingState } from "../../Composites/loadingState/LoadingState";

import { MobileProgress } from "../../Elements/mobileProgress/MobileProgress";

import { NavigationButtons } from "../../Elements/navigationButtons/NavigationButtons";

import { ProgressStepper } from "../../Elements/progressStepper/ProgressStepper";

import { SuccessState } from "../../Composites/successState/SuccessState";

import { CycleStepVisual } from "../../Composites/cycleStepVisual/CycleStepVisual";

import { INITIAL_DATA, STEP_IDS, TOTAL_STEPS, nextStepId, prevStepId } from "../../constants";

import { useElementHeight } from "../../hooks/useElementHeight";

import { markOnboardingCompleted, saveProgress } from "../../lib/progress";

import { useStepSpacing } from "../../hooks/useStepSpacing";

import { cn } from "../../lib/cn";

import { hasErrors, validateStep } from "../../lib/validation";

import { StepBirthControl } from "./steps/stepBirthControl/StepBirthControl";

import { StepCycleLength } from "./steps/stepCycleLength/StepCycleLength";

import { StepFertilityGoals } from "./steps/stepFertilityGoals/StepFertilityGoals";

import { StepHealthDetails } from "./steps/stepHealthDetails/StepHealthDetails";

import { StepLastPeriod } from "./steps/stepLastPeriod/StepLastPeriod";

import { StepMedicalInfo } from "./steps/stepMedicalInfo/StepMedicalInfo";

import { StepNotifications } from "./steps/stepNotifications/StepNotifications";

import { StepPeriodDuration } from "./steps/stepPeriodDuration/StepPeriodDuration";

import { StepPeriodRegularity } from "./steps/stepPeriodRegularity/StepPeriodRegularity";

import { StepReview } from "./steps/stepReview/StepReview";

import { StepSymptoms } from "./steps/stepSymptoms/StepSymptoms";
import type { FlowPhase, OnboardingData, StepId, StepProps } from "../../types";
const MIN_STRIP = 100;

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onStepChange?: (step: StepId, data: OnboardingData) => void;
  /** Resume an existing setup (e.g. "Edit setup" from the dashboard, or saved progress). */
  initialData?: OnboardingData;
  initialStep?: StepId;
  /** Steps already finished, restored from saved progress. */
  initialCompleted?: readonly StepId[];
}


function scrollToFirstError() {
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]');
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
  });
}

/** The question for one step. A component (not a render helper) so its props are plain inputs. */
function FormStep({ step, onEdit, ...props }: StepProps & { step: StepId; onEdit: (s: StepId) => void }) {
  switch (step) {
    case 1:
      return <StepLastPeriod {...props} />;
    case 2:
      return <StepCycleLength {...props} />;
    case 3:
      return <StepPeriodRegularity {...props} />;
    case 4:
      return <StepPeriodDuration {...props} />;
    case 5:
      return <StepHealthDetails {...props} />;
    case 6:
      return <StepMedicalInfo {...props} />;
    case 7:
      return <StepSymptoms {...props} />;
    case 8:
      return <StepNotifications {...props} />;
    case 9:
      return <StepBirthControl {...props} />;
    case 10:
      return <StepFertilityGoals {...props} />;
    case 11:
      return <StepReview data={props.data} onEdit={onEdit} />;
  }
}

export function OnboardingFlow({ onComplete, onStepChange, initialData = INITIAL_DATA, initialStep = 1, initialCompleted = [] }: OnboardingFlowProps) {
  const [data, setData] = useState<OnboardingData>(initialData);
  const [step, setStep] = useState<StepId>(initialStep);
  const [maxReached, setMaxReached] = useState<StepId>(initialStep);
  const [completed, setCompleted] = useState<ReadonlySet<StepId>>(() => new Set(initialCompleted));
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  /** Steps where the user has tried to continue — errors show live from then on. */
  const [attempted, setAttempted] = useState<ReadonlySet<StepId>>(() => new Set());
  const [editingFromReview, setEditingFromReview] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [phase, setPhase] = useState<FlowPhase>("form");

  const update = useCallback((patch: Partial<OnboardingData>) => setData((d) => ({ ...d, ...patch })), []);

  // Persist whenever an answer or the current step changes, so nothing is lost if the user leaves
  // mid-step (the Continue button is not the only save point). An untouched Step 1 is not progress —
  // saving it would offer to "resume" a journey with no answers in it.
  useEffect(() => {
    if (phase !== "form") return;
    const untouched = step === 1 && completed.size === 0 && data === INITIAL_DATA;
    if (untouched) return;
    saveProgress(step, [...completed], data);
  }, [step, completed, data, phase]);

  const errors = useMemo(() => (attempted.has(step) ? validateStep(step, data) : {}), [attempted, step, data]);

  const formScrollRef = useRef<HTMLDivElement>(null);
  useStepSpacing(formScrollRef, step);
  // Phones: show the guide strip only when at least MIN_STRIP px are left under the question.
  const [stripRef, stripHeight] = useElementHeight<HTMLDivElement>();
  const stripShown = stripHeight >= MIN_STRIP;

  const goTo = useCallback(
    (target: StepId) => {
      setDirection(target >= step ? "forward" : "back");
      setStep(target);
      setMaxReached((m) => (target > m ? target : m));
      onStepChange?.(target, data);
      // The page never scrolls; only reset the question card in case it had to scroll internally.
      formScrollRef.current?.scrollTo({ top: 0 });
    },
    [step, data, onStepChange],
  );

  const markAttempted = (s: StepId) => setAttempted((prev) => new Set(prev).add(s));

  /** Validates the current step; on failure reveals inline errors and returns false. */
  const ensureValid = (s: StepId): boolean => {
    if (!hasErrors(validateStep(s, data))) return true;
    markAttempted(s);
    scrollToFirstError();
    return false;
  };

  const handleNext = () => {
    if (step === TOTAL_STEPS) {
      // Final safety net: every step must still be valid before finishing.
      const firstInvalid = STEP_IDS.find((s) => s !== TOTAL_STEPS && hasErrors(validateStep(s, data)));
      if (firstInvalid) {
        markAttempted(firstInvalid);
        goTo(firstInvalid);
        return;
      }
      setModalOpen(true);
      return;
    }
    if (!ensureValid(step)) return;
    setCompleted((prev) => new Set(prev).add(step));
    const next = nextStepId(step);
    if (next) goTo(next);
  };

  const handleBack = () => {
    const prev = prevStepId(step);
    if (prev) goTo(prev);
  };

  /** Stepper jumps: going back is free (like Back); going forward must pass the current step (like Continue). */
  const handleStepClick = (target: StepId) => {
    if (target > step) {
      if (!ensureValid(step)) return;
      setCompleted((prev) => new Set(prev).add(step));
    }
    goTo(target);
  };

  const handleReturnToReview = () => {
    if (!ensureValid(step)) return;
    setCompleted((prev) => new Set(prev).add(step));
    setEditingFromReview(false);
    goTo(TOTAL_STEPS);
  };

  const handleEdit = useCallback(
    (target: StepId) => {
      setEditingFromReview(true);
      goTo(target);
    },
    [goTo],
  );

  const finishLoading = useCallback(() => {
    // Setup is done: drop the resume state so the welcome page stops offering it.
    markOnboardingCompleted();
    setPhase("success");
  }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  if (phase === "loading") {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto py-4">
        <LoadingState onDone={finishLoading} />
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        <SuccessState data={data} onGoToDashboard={onComplete} />
      </div>
    );
  }

  return (
    // One step = one viewport — but not one fixed height. The page never scrolls; the question card and the
    // visual are each sized by their own content and the whole group (cards + navigation) is centred in the
    // space left under the progress bar, so Continue always sits right beneath the content.
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 hidden shrink-0 lg:block short:mb-2">
        <ProgressStepper current={step} maxReached={maxReached} onStepClick={handleStepClick} />
      </div>
      <div className="mb-2.5 shrink-0 lg:hidden">
        <MobileProgress current={step} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:justify-center">
        <div
          className={cn(
            // Desktop/tablet: one row that fills the space between stepper and navigation (capped on very tall
            // screens and centred), with BOTH panels stretched to the same height. Phones: content-driven.
            // Two equal columns that stretch to the same height, filling the space under the stepper.
            "grid min-h-0 grid-rows-[minmax(0,1fr)] gap-3 md:grid-cols-2 md:flex-1 md:items-stretch md:gap-6 lg:gap-8 2xl:max-h-[860px]",
          )}
        >
          {/* Question card — shares the row height with the visual; content is distributed inside it */}
          <section
            aria-label="Setup question"
            className="flex max-h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-panel border border-card-border bg-white shadow-glass md:h-full"
          >
            <div ref={formScrollRef} data-form-scroll className="@container scroll-cue min-h-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain p-4 sm:p-5 lg:px-7 lg:py-6 short:lg:px-6 short:lg:py-3.5 xshort:lg:py-3">
              {/* The card fills its half of the viewport; the content keeps a readable measure inside it. */}
              <div
                key={step}
                className={cn("step-flow mx-auto w-full max-w-[660px]", direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left")}
              >
                <FormStep step={step} data={data} update={update} errors={errors} onEdit={handleEdit} />
              </div>
            </div>
          </section>

          {/* Guide + contextual visual — same height as the question card; the scene recomposes to fill it */}
          <div className="hidden h-full min-h-0 min-w-0 md:block">
            <CycleStepVisual step={step} data={data} className="h-full" />
          </div>
        </div>

        {/* Phones: a compact contextual strip that only appears when the step leaves room for it */}
        <div ref={stripRef} className="min-h-0 max-h-[200px] flex-1 md:hidden">
          {stripShown && (
            <div className="h-full pt-3">
              <CycleStepVisual step={step} data={data} className="h-full" />
            </div>
          )}
        </div>

        <NavigationButtons
          isFirst={step === 1}
          isLast={step === TOTAL_STEPS}
          onBack={handleBack}
          onNext={handleNext}
          onReturnToReview={editingFromReview && step !== TOTAL_STEPS ? handleReturnToReview : undefined}
          errorSummary={hasErrors(errors) ? "Please review the highlighted fields to continue." : undefined}
        />
      </div>

      <ConfirmationModal
        open={modalOpen}
        onCancel={closeModal}
        onConfirm={() => {
          setModalOpen(false);
          setPhase("loading");
        }}
      />
    </div>
  );
}
