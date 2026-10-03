$root = (Get-Location).Path

$path = Join-Path $root "App.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { Dashboard } from "./components/Dashboard";', 'import { Dashboard } from "./Features/dashboard/Dashboard";')
$content = $content.Replace('import { OnboardingLayout, PrivacyPill } from "./components/OnboardingLayout";', 'import { OnboardingLayout, PrivacyPill } from "./Composites/onboardingLayout/OnboardingLayout";')
$content = $content.Replace('import { WelcomePage } from "./components/WelcomePage";', 'import { WelcomePage } from "./Features/welcomePage/WelcomePage";')
$content = $content.Replace('import { OnboardingFlow } from "./OnboardingFlow";', 'import { OnboardingFlow } from "./Features/onboardingFlow/OnboardingFlow";')
$content = $content.Replace('import { api } from "./services/api";', 'import { submitOnboardingProfile } from "./services/onboarding";')
$content = $content.Replace('await api.submitOnboardingProfile(data);', 'await submitOnboardingProfile(data);')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: App.tsx"

$path = Join-Path $root "Elements\icon3D\Icon3D.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/icon3D/Icon3D.tsx"

$path = Join-Path $root "Elements\dateWheel\DateWheel.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { parseISODate, toISODate } from "../lib/health";', 'import { parseISODate, toISODate } from "../../lib/health";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/dateWheel/DateWheel.tsx"

$path = Join-Path $root "Elements\toggleCard\ToggleCard.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { Icon3D } from "./Icon3D";', 'import { Icon3D } from "../icon3D/Icon3D";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/toggleCard/ToggleCard.tsx"

$path = Join-Path $root "Elements\navigationButtons\NavigationButtons.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/navigationButtons/NavigationButtons.tsx"

$path = Join-Path $root "Elements\sliderInput\SliderInput.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { useCountUp } from "../hooks/useCountUp";', 'import { useCountUp } from "../../hooks/useCountUp";')
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { pluralDays } from "../lib/health";', 'import { pluralDays } from "../../lib/health";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/sliderInput/SliderInput.tsx"

$path = Join-Path $root "Elements\mobileProgress\MobileProgress.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { STEPS, TOTAL_STEPS } from "../constants";', 'import { STEPS, TOTAL_STEPS } from "../../constants";')
$content = $content.Replace('import type { StepId } from "../types";', 'import type { StepId } from "../../types";')
$content = $content.Replace('import { progressPercent } from "./ProgressStepper";', 'import { progressPercent } from "../progressStepper/ProgressStepper";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/mobileProgress/MobileProgress.tsx"

$path = Join-Path $root "Elements\manualDateInput\ManualDateInput.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { parseISODate, toISODate } from "../lib/health";', 'import { parseISODate, toISODate } from "../../lib/health";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/manualDateInput/ManualDateInput.tsx"

$path = Join-Path $root "Elements\feedbackBadge\FeedbackBadge.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import type { FeedbackTone } from "../types";', 'import type { FeedbackTone } from "../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/feedbackBadge/FeedbackBadge.tsx"

$path = Join-Path $root "Elements\stepHeader\StepHeader.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { STEPS, TOTAL_STEPS } from "../constants";', 'import { STEPS, TOTAL_STEPS } from "../../constants";')
$content = $content.Replace('import type { StepId } from "../types";', 'import type { StepId } from "../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/stepHeader/StepHeader.tsx"

$path = Join-Path $root "Elements\selectChip\SelectChip.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/selectChip/SelectChip.tsx"

$path = Join-Path $root "Elements\optionCard\OptionCard.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { Icon3D } from "./Icon3D";', 'import { Icon3D } from "../icon3D/Icon3D";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/optionCard/OptionCard.tsx"

$path = Join-Path $root "Elements\datePicker\DatePicker.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { parseISODate, toISODate } from "../lib/health";', 'import { parseISODate, toISODate } from "../../lib/health";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/datePicker/DatePicker.tsx"

$path = Join-Path $root "Elements\fields\Fields.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn, ui } from "../lib/cn";', 'import { cn, ui } from "../../lib/cn";')
$content = $content.Replace('import { Icon3D } from "./Icon3D";', 'import { Icon3D } from "../icon3D/Icon3D";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/fields/Fields.tsx"

$path = Join-Path $root "Elements\progressStepper\ProgressStepper.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { STEPS, TOTAL_STEPS } from "../constants";', 'import { STEPS, TOTAL_STEPS } from "../../constants";')
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import type { StepId } from "../types";', 'import type { StepId } from "../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/progressStepper/ProgressStepper.tsx"

$path = Join-Path $root "Elements\infoCard\InfoCard.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/infoCard/InfoCard.tsx"

$path = Join-Path $root "Elements\calendarDialog\CalendarDialog.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { todayISO } from "../lib/health";', 'import { todayISO } from "../../lib/health";')
$content = $content.Replace('import { DatePicker } from "./DatePicker";', 'import { DatePicker } from "../datePicker/DatePicker";')
$content = $content.Replace('import { primaryBtn, secondaryBtn } from "./NavigationButtons";', 'import { primaryBtn, secondaryBtn } from "../navigationButtons/NavigationButtons";')
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Elements/calendarDialog/CalendarDialog.tsx"

$path = Join-Path $root "Composites\visuals\glassWellnessDecor\GlassWellnessDecor.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../../lib/cn";', 'import { cn } from "../../../lib/cn";')
$content = $content.Replace('import type { StepId } from "../../types";', 'import type { StepId } from "../../../types";')
$content = $content.Replace('import { useSceneLayout, type SceneLayout } from "./primitives";', 'import { useSceneLayout, type SceneLayout } from "../primitives/primitives";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/visuals/glassWellnessDecor/GlassWellnessDecor.tsx"

$path = Join-Path $root "Composites\visuals\primitives\primitives.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../../lib/cn";', 'import { cn } from "../../../lib/cn";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/visuals/primitives/primitives.tsx"

$path = Join-Path $root "Composites\visuals\cycleOrb\CycleOrb.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { GirlCharacter } from "./GirlCharacter";', 'import { GirlCharacter } from "../girlCharacter/GirlCharacter";')
$content = $content.Replace('import { HoloRing, Orb, Sparkle } from "./primitives";', 'import { HoloRing, Orb, Sparkle } from "../primitives/primitives";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/visuals/cycleOrb/CycleOrb.tsx"

$path = Join-Path $root "Composites\visuals\girlCharacter\GirlCharacter.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { GENERIC_GIRL } from "../../assets/cycle-tracker/stepVisuals";', 'import { GENERIC_GIRL } from "../../../assets/cycle-tracker/stepVisuals";')
$content = $content.Replace('import { cn } from "../../lib/cn";', 'import { cn } from "../../../lib/cn";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/visuals/girlCharacter/GirlCharacter.tsx"

$path = Join-Path $root "Composites\visuals\guidePlacement\guidePlacement.ts"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import type { StepId } from "../../types";', 'import type { StepId } from "../../../types";')
$content = $content.Replace('import type { SceneLayout } from "./primitives";', 'import type { SceneLayout } from "../primitives/primitives";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/visuals/guidePlacement/guidePlacement.ts"

$path = Join-Path $root "Composites\visuals\stepVisualPanel\StepVisualPanel.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../../lib/cn";', 'import { cn } from "../../../lib/cn";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/visuals/stepVisualPanel/StepVisualPanel.tsx"

$path = Join-Path $root "Composites\cycleStepVisual\CycleStepVisual.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { BMI_VISUALS, STEP_VISUALS, stepVisual, type StepVisual } from "../assets/cycle-tracker/stepVisuals";', 'import { BMI_VISUALS, STEP_VISUALS, stepVisual, type StepVisual } from "../../assets/cycle-tracker/stepVisuals";')
$content = $content.Replace('import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";', 'import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";')
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { bmiVisualKey } from "../lib/health";', 'import { bmiVisualKey } from "../../lib/health";')
$content = $content.Replace('import { nextStepId, prevStepId } from "../constants";', 'import { nextStepId, prevStepId } from "../../constants";')
$content = $content.Replace('import type { OnboardingData, StepId } from "../types";', 'import type { OnboardingData, StepId } from "../../types";')
$content = $content.Replace('import { StepScene } from "./StepScenes";', 'import { StepScene } from "../stepScenes/StepScenes";')
$content = $content.Replace('import { GlassWellnessDecor } from "./visuals/GlassWellnessDecor";', 'import { GlassWellnessDecor } from "../visuals/glassWellnessDecor/GlassWellnessDecor";')
$content = $content.Replace('import { StepVisualPanel } from "./visuals/StepVisualPanel";', 'import { StepVisualPanel } from "../visuals/stepVisualPanel/StepVisualPanel";')
$content = $content.Replace('import { guideBox } from "./visuals/guidePlacement";', 'import { guideBox } from "../visuals/guidePlacement/guidePlacement";')
$content = $content.Replace('import { SceneCanvas, useSceneLayout } from "./visuals/primitives";', 'import { SceneCanvas, useSceneLayout } from "../visuals/primitives/primitives";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/cycleStepVisual/CycleStepVisual.tsx"

$path = Join-Path $root "Composites\confirmationModal\ConfirmationModal.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { primaryBtn, secondaryBtn } from "./NavigationButtons";', 'import { primaryBtn, secondaryBtn } from "../../Elements/navigationButtons/NavigationButtons";')
$content = $content.Replace('import { CycleOrb } from "./visuals/CycleOrb";', 'import { CycleOrb } from "../visuals/cycleOrb/CycleOrb";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/confirmationModal/ConfirmationModal.tsx"

$path = Join-Path $root "Composites\loadingState\LoadingState.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { CycleOrb } from "./visuals/CycleOrb";', 'import { CycleOrb } from "../visuals/cycleOrb/CycleOrb";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/loadingState/LoadingState.tsx"

$path = Join-Path $root "Composites\stepScenes\StepScenes.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { BIRTH_CONTROL_METHODS_BY_CATEGORY, FERTILITY_GOAL_OPTIONS, GOAL_TRACKING, TRACKING_KEYS } from "../constants";', 'import { BIRTH_CONTROL_METHODS_BY_CATEGORY, FERTILITY_GOAL_OPTIONS, GOAL_TRACKING, TRACKING_KEYS } from "../../constants";')
$content = $content.Replace('import { useCountUp } from "../hooks/useCountUp";', 'import { useCountUp } from "../../hooks/useCountUp";')
$content = $content.Replace('import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";', 'import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";')
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { bmiCategory, daysAgo, effectiveDuration, parseISODate, reminderPhrase, trackingLabel, validBmi } from "../lib/health";', 'import { bmiCategory, daysAgo, effectiveDuration, parseISODate, reminderPhrase, trackingLabel, validBmi } from "../../lib/health";')
$content = $content.Replace('import type { OnboardingData, PeriodRegularity, StepId, TrackingKey } from "../types";', 'import type { OnboardingData, PeriodRegularity, StepId, TrackingKey } from "../../types";')
$content = $content.Replace('import { Icon3D, MethodGlyph } from "./Icon3D";', 'import { Icon3D, MethodGlyph } from "../../Elements/icon3D/Icon3D";')
$content = $content.Replace('import { guideBox } from "./visuals/guidePlacement";', 'import { guideBox } from "../visuals/guidePlacement/guidePlacement";')
$content = $content.Replace('} from "./visuals/primitives";', '} from "../visuals/primitives/primitives";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/stepScenes/StepScenes.tsx"

$path = Join-Path $root "Composites\startOverDialog\StartOverDialog.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { primaryBtn, secondaryBtn } from "./NavigationButtons";', 'import { primaryBtn, secondaryBtn } from "../../Elements/navigationButtons/NavigationButtons";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/startOverDialog/StartOverDialog.tsx"

$path = Join-Path $root "Composites\successState\SuccessState.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { FERTILITY_GOAL_OPTIONS } from "../constants";', 'import { FERTILITY_GOAL_OPTIONS } from "../../constants";')
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { effectiveDuration, formatLongDate } from "../lib/health";', 'import { effectiveDuration, formatLongDate } from "../../lib/health";')
$content = $content.Replace('import type { OnboardingData } from "../types";', 'import type { OnboardingData } from "../../types";')
$content = $content.Replace('import { primaryBtn } from "./NavigationButtons";', 'import { primaryBtn } from "../../Elements/navigationButtons/NavigationButtons";')
$content = $content.Replace('import { SuccessVisual } from "./visuals/CycleOrb";', 'import { SuccessVisual } from "../visuals/cycleOrb/CycleOrb";')
$content = $content.Replace('import { Particles } from "./visuals/primitives";', 'import { Particles } from "../visuals/primitives/primitives";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/successState/SuccessState.tsx"

$path = Join-Path $root "Composites\onboardingLayout\OnboardingLayout.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/onboardingLayout/OnboardingLayout.tsx"

$path = Join-Path $root "Composites\reviewSection\ReviewSection.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import type { StepId } from "../types";', 'import type { StepId } from "../../types";')
$content = $content.Replace('import { EditButton } from "./EditButton";', 'import { EditButton } from "../../Elements/editButton/EditButton";')
$content = $content.Replace('import { Icon3D } from "./Icon3D";', 'import { Icon3D } from "../../Elements/icon3D/Icon3D";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Composites/reviewSection/ReviewSection.tsx"

$path = Join-Path $root "Features\onboardingFlow\OnboardingFlow.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { ConfirmationModal } from "./components/ConfirmationModal";', 'import { ConfirmationModal } from "../../Composites/confirmationModal/ConfirmationModal";')
$content = $content.Replace('import { LoadingState } from "./components/LoadingState";', 'import { LoadingState } from "../../Composites/loadingState/LoadingState";')
$content = $content.Replace('import { MobileProgress } from "./components/MobileProgress";', 'import { MobileProgress } from "../../Elements/mobileProgress/MobileProgress";')
$content = $content.Replace('import { NavigationButtons } from "./components/NavigationButtons";', 'import { NavigationButtons } from "../../Elements/navigationButtons/NavigationButtons";')
$content = $content.Replace('import { ProgressStepper } from "./components/ProgressStepper";', 'import { ProgressStepper } from "../../Elements/progressStepper/ProgressStepper";')
$content = $content.Replace('import { SuccessState } from "./components/SuccessState";', 'import { SuccessState } from "../../Composites/successState/SuccessState";')
$content = $content.Replace('import { CycleStepVisual } from "./components/CycleStepVisual";', 'import { CycleStepVisual } from "../../Composites/cycleStepVisual/CycleStepVisual";')
$content = $content.Replace('import { INITIAL_DATA, STEP_IDS, TOTAL_STEPS, nextStepId, prevStepId } from "./constants";', 'import { INITIAL_DATA, STEP_IDS, TOTAL_STEPS, nextStepId, prevStepId } from "../../constants";')
$content = $content.Replace('import { useElementHeight } from "./hooks/useElementHeight";', 'import { useElementHeight } from "../../hooks/useElementHeight";')
$content = $content.Replace('import { markOnboardingCompleted, saveProgress } from "./lib/progress";', 'import { markOnboardingCompleted, saveProgress } from "../../lib/progress";')
$content = $content.Replace('import { useStepSpacing } from "./hooks/useStepSpacing";', 'import { useStepSpacing } from "../../hooks/useStepSpacing";')
$content = $content.Replace('import { cn } from "./lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { hasErrors, validateStep } from "./lib/validation";', 'import { hasErrors, validateStep } from "../../lib/validation";')
$content = $content.Replace('import { StepBirthControl } from "./steps/StepBirthControl";', 'import { StepBirthControl } from "./steps/stepBirthControl/StepBirthControl";')
$content = $content.Replace('import { StepCycleLength } from "./steps/StepCycleLength";', 'import { StepCycleLength } from "./steps/stepCycleLength/StepCycleLength";')
$content = $content.Replace('import { StepFertilityGoals } from "./steps/StepFertilityGoals";', 'import { StepFertilityGoals } from "./steps/stepFertilityGoals/StepFertilityGoals";')
$content = $content.Replace('import { StepHealthDetails } from "./steps/StepHealthDetails";', 'import { StepHealthDetails } from "./steps/stepHealthDetails/StepHealthDetails";')
$content = $content.Replace('import { StepLastPeriod } from "./steps/StepLastPeriod";', 'import { StepLastPeriod } from "./steps/stepLastPeriod/StepLastPeriod";')
$content = $content.Replace('import { StepMedicalInfo } from "./steps/StepMedicalInfo";', 'import { StepMedicalInfo } from "./steps/stepMedicalInfo/StepMedicalInfo";')
$content = $content.Replace('import { StepNotifications } from "./steps/StepNotifications";', 'import { StepNotifications } from "./steps/stepNotifications/StepNotifications";')
$content = $content.Replace('import { StepPeriodDuration } from "./steps/StepPeriodDuration";', 'import { StepPeriodDuration } from "./steps/stepPeriodDuration/StepPeriodDuration";')
$content = $content.Replace('import { StepPeriodRegularity } from "./steps/StepPeriodRegularity";', 'import { StepPeriodRegularity } from "./steps/stepPeriodRegularity/StepPeriodRegularity";')
$content = $content.Replace('import { StepReview } from "./steps/StepReview";', 'import { StepReview } from "./steps/stepReview/StepReview";')
$content = $content.Replace('import { StepSymptoms } from "./steps/StepSymptoms";', 'import { StepSymptoms } from "./steps/stepSymptoms/StepSymptoms";')
$content = $content.Replace('import type { FlowPhase, OnboardingData, StepId, StepProps } from "./types";', 'import type { FlowPhase, OnboardingData, StepId, StepProps } from "../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/OnboardingFlow.tsx"

$path = Join-Path $root "Features\onboardingFlow\steps\stepNotifications\StepNotifications.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { handleRadioKeys } from "../components/OptionCard";', 'import { handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";')
$content = $content.Replace('import { StepHeader } from "../components/StepHeader";', 'import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";')
$content = $content.Replace('import { ToggleCard } from "../components/ToggleCard";', 'import { ToggleCard } from "../../../../Elements/toggleCard/ToggleCard";')
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../../../lib/cn";')
$content = $content.Replace('import { reminderPhrase } from "../lib/health";', 'import { reminderPhrase } from "../../../../lib/health";')
$content = $content.Replace('import type { ReminderDays, StepProps } from "../types";', 'import type { ReminderDays, StepProps } from "../../../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/steps/stepNotifications/StepNotifications.tsx"

$path = Join-Path $root "Features\onboardingFlow\steps\stepSymptoms\StepSymptoms.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { FieldGroup, TextField } from "../components/Fields";', 'import { FieldGroup, TextField } from "../../../../Elements/fields/Fields";')
$content = $content.Replace('import { SelectChip } from "../components/SelectChip";', 'import { SelectChip } from "../../../../Elements/selectChip/SelectChip";')
$content = $content.Replace('import { StepHeader } from "../components/StepHeader";', 'import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";')
$content = $content.Replace('import { MOODS, SYMPTOMS } from "../constants";', 'import { MOODS, SYMPTOMS } from "../../../../constants";')
$content = $content.Replace('import type { StepProps } from "../types";', 'import type { StepProps } from "../../../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/steps/stepSymptoms/StepSymptoms.tsx"

$path = Join-Path $root "Features\onboardingFlow\steps\stepPeriodDuration\StepPeriodDuration.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { FeedbackBadge } from "../components/FeedbackBadge";', 'import { FeedbackBadge } from "../../../../Elements/feedbackBadge/FeedbackBadge";')
$content = $content.Replace('import { FieldError, NumberField } from "../components/Fields";', 'import { FieldError, NumberField } from "../../../../Elements/fields/Fields";')
$content = $content.Replace('import { InfoCard } from "../components/InfoCard";', 'import { InfoCard } from "../../../../Elements/infoCard/InfoCard";')
$content = $content.Replace('import { SliderInput } from "../components/SliderInput";', 'import { SliderInput } from "../../../../Elements/sliderInput/SliderInput";')
$content = $content.Replace('import { StepHeader } from "../components/StepHeader";', 'import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";')
$content = $content.Replace('import { DURATION_RANGE } from "../constants";', 'import { DURATION_RANGE } from "../../../../constants";')
$content = $content.Replace('import { effectiveDuration, getDurationFeedback } from "../lib/health";', 'import { effectiveDuration, getDurationFeedback } from "../../../../lib/health";')
$content = $content.Replace('import type { StepProps } from "../types";', 'import type { StepProps } from "../../../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/steps/stepPeriodDuration/StepPeriodDuration.tsx"

$path = Join-Path $root "Features\onboardingFlow\steps\stepHealthDetails\StepHealthDetails.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { Icon3D } from "../components/Icon3D";', 'import { Icon3D } from "../../../../Elements/icon3D/Icon3D";')
$content = $content.Replace('import { NumberField } from "../components/Fields";', 'import { NumberField } from "../../../../Elements/fields/Fields";')
$content = $content.Replace('import { InfoCard } from "../components/InfoCard";', 'import { InfoCard } from "../../../../Elements/infoCard/InfoCard";')
$content = $content.Replace('import { StepHeader } from "../components/StepHeader";', 'import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";')
$content = $content.Replace('import { useCountUp } from "../hooks/useCountUp";', 'import { useCountUp } from "../../../../hooks/useCountUp";')
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../../../lib/cn";')
$content = $content.Replace('import { BMI_CATEGORY_NOTES, bmiCategory, validBmi } from "../lib/health";', 'import { BMI_CATEGORY_NOTES, bmiCategory, validBmi } from "../../../../lib/health";')
$content = $content.Replace('import type { StepProps } from "../types";', 'import type { StepProps } from "../../../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/steps/stepHealthDetails/StepHealthDetails.tsx"

$path = Join-Path $root "Features\onboardingFlow\steps\stepLastPeriod\StepLastPeriod.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { CalendarDialog } from "../components/CalendarDialog";', 'import { CalendarDialog } from "../../../../Elements/calendarDialog/CalendarDialog";')
$content = $content.Replace('import { ManualDateInput } from "../components/ManualDateInput";', 'import { ManualDateInput } from "../../../../Elements/manualDateInput/ManualDateInput";')
$content = $content.Replace('import { FieldError, NumberField, TextField } from "../components/Fields";', 'import { FieldError, NumberField, TextField } from "../../../../Elements/fields/Fields";')
$content = $content.Replace('import { StepHeader } from "../components/StepHeader";', 'import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";')
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../../../lib/cn";')
$content = $content.Replace('import { formatLongDate, initials, profileCompletion, toISODate } from "../lib/health";', 'import { formatLongDate, initials, profileCompletion, toISODate } from "../../../../lib/health";')
$content = $content.Replace('import type { StepProps } from "../types";', 'import type { StepProps } from "../../../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/steps/stepLastPeriod/StepLastPeriod.tsx"

$path = Join-Path $root "Features\onboardingFlow\steps\stepReview\StepReview.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { ReviewSection, ValueList, type ReviewRow } from "../components/ReviewSection";', 'import { ReviewSection, ValueList, type ReviewRow } from "../../../../Composites/reviewSection/ReviewSection";')
$content = $content.Replace('import { StepHeader } from "../components/StepHeader";', 'import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";')
$content = $content.Replace('} from "../constants";', '} from "../../../../constants";')
$content = $content.Replace('import { bmiCategory, validBmi, effectiveDuration, formatLongDate, pluralDays, trackingLabel } from "../lib/health";', 'import { bmiCategory, validBmi, effectiveDuration, formatLongDate, pluralDays, trackingLabel } from "../../../../lib/health";')
$content = $content.Replace('import type { OnboardingData, StepId } from "../types";', 'import type { OnboardingData, StepId } from "../../../../types";')
$content = $content.Replace('import { resolvedList } from "./StepSymptoms";', 'import { resolvedList } from "../stepSymptoms/StepSymptoms";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/steps/stepReview/StepReview.tsx"

$path = Join-Path $root "Features\onboardingFlow\steps\stepBirthControl\StepBirthControl.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { FieldError, FieldGroup, TextField } from "../components/Fields";', 'import { FieldError, FieldGroup, TextField } from "../../../../Elements/fields/Fields";')
$content = $content.Replace('import { InfoCard } from "../components/InfoCard";', 'import { InfoCard } from "../../../../Elements/infoCard/InfoCard";')
$content = $content.Replace('import { OptionCard, handleRadioKeys } from "../components/OptionCard";', 'import { OptionCard, handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";')
$content = $content.Replace('import { StepHeader } from "../components/StepHeader";', 'import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";')
$content = $content.Replace('import { BIRTH_CONTROL_CATEGORIES, BIRTH_CONTROL_MESSAGES, BIRTH_CONTROL_METHODS_BY_CATEGORY, BIRTH_CONTROL_OPTIONS } from "../constants";', 'import { BIRTH_CONTROL_CATEGORIES, BIRTH_CONTROL_MESSAGES, BIRTH_CONTROL_METHODS_BY_CATEGORY, BIRTH_CONTROL_OPTIONS } from "../../../../constants";')
$content = $content.Replace('import type { BirthControlAnswer, BirthControlCategory, StepProps } from "../types";', 'import type { BirthControlAnswer, BirthControlCategory, StepProps } from "../../../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/steps/stepBirthControl/StepBirthControl.tsx"

$path = Join-Path $root "Features\onboardingFlow\steps\stepMedicalInfo\StepMedicalInfo.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { FieldError, FieldGroup, TextField } from "../components/Fields";', 'import { FieldError, FieldGroup, TextField } from "../../../../Elements/fields/Fields";')
$content = $content.Replace('import { OptionCard, handleRadioKeys } from "../components/OptionCard";', 'import { OptionCard, handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";')
$content = $content.Replace('import { StepHeader } from "../components/StepHeader";', 'import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";')
$content = $content.Replace('import { MEDICAL_CONDITIONS } from "../constants";', 'import { MEDICAL_CONDITIONS } from "../../../../constants";')
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../../../lib/cn";')
$content = $content.Replace('import type { StepProps } from "../types";', 'import type { StepProps } from "../../../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/steps/stepMedicalInfo/StepMedicalInfo.tsx"

$path = Join-Path $root "Features\onboardingFlow\steps\stepFertilityGoals\StepFertilityGoals.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { FieldError } from "../components/Fields";', 'import { FieldError } from "../../../../Elements/fields/Fields";')
$content = $content.Replace('import { InfoCard } from "../components/InfoCard";', 'import { InfoCard } from "../../../../Elements/infoCard/InfoCard";')
$content = $content.Replace('import { OptionCard, handleRadioKeys } from "../components/OptionCard";', 'import { OptionCard, handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";')
$content = $content.Replace('import { StepHeader } from "../components/StepHeader";', 'import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";')
$content = $content.Replace('import { ToggleCard } from "../components/ToggleCard";', 'import { ToggleCard } from "../../../../Elements/toggleCard/ToggleCard";')
$content = $content.Replace('import { FERTILITY_GOAL_OPTIONS, GOAL_TRACKING, TRACKING_DESCRIPTIONS } from "../constants";', 'import { FERTILITY_GOAL_OPTIONS, GOAL_TRACKING, TRACKING_DESCRIPTIONS } from "../../../../constants";')
$content = $content.Replace('import { trackingForGoal, trackingLabel } from "../lib/health";', 'import { trackingForGoal, trackingLabel } from "../../../../lib/health";')
$content = $content.Replace('import type { FertilityGoal, StepProps, TrackingKey } from "../types";', 'import type { FertilityGoal, StepProps, TrackingKey } from "../../../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/steps/stepFertilityGoals/StepFertilityGoals.tsx"

$path = Join-Path $root "Features\onboardingFlow\steps\stepPeriodRegularity\StepPeriodRegularity.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { FieldError } from "../components/Fields";', 'import { FieldError } from "../../../../Elements/fields/Fields";')
$content = $content.Replace('import { InfoCard } from "../components/InfoCard";', 'import { InfoCard } from "../../../../Elements/infoCard/InfoCard";')
$content = $content.Replace('import { OptionCard, handleRadioKeys } from "../components/OptionCard";', 'import { OptionCard, handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";')
$content = $content.Replace('import { StepHeader } from "../components/StepHeader";', 'import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";')
$content = $content.Replace('import { REGULARITY_MESSAGES, REGULARITY_OPTIONS } from "../constants";', 'import { REGULARITY_MESSAGES, REGULARITY_OPTIONS } from "../../../../constants";')
$content = $content.Replace('import type { StepProps } from "../types";', 'import type { StepProps } from "../../../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/steps/stepPeriodRegularity/StepPeriodRegularity.tsx"

$path = Join-Path $root "Features\onboardingFlow\steps\stepCycleLength\StepCycleLength.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { FeedbackBadge } from "../components/FeedbackBadge";', 'import { FeedbackBadge } from "../../../../Elements/feedbackBadge/FeedbackBadge";')
$content = $content.Replace('import { FieldError, NumberField } from "../components/Fields";', 'import { FieldError, NumberField } from "../../../../Elements/fields/Fields";')
$content = $content.Replace('import { InfoCard } from "../components/InfoCard";', 'import { InfoCard } from "../../../../Elements/infoCard/InfoCard";')
$content = $content.Replace('import { OptionCard, handleRadioKeys } from "../components/OptionCard";', 'import { OptionCard, handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";')
$content = $content.Replace('import { SliderInput } from "../components/SliderInput";', 'import { SliderInput } from "../../../../Elements/sliderInput/SliderInput";')
$content = $content.Replace('import { StepHeader } from "../components/StepHeader";', 'import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";')
$content = $content.Replace('import { CYCLE_LENGTH_OPTIONS, CYCLE_RANGE } from "../constants";', 'import { CYCLE_LENGTH_OPTIONS, CYCLE_RANGE } from "../../../../constants";')
$content = $content.Replace('import { getCycleFeedback } from "../lib/health";', 'import { getCycleFeedback } from "../../../../lib/health";')
$content = $content.Replace('import type { StepProps } from "../types";', 'import type { StepProps } from "../../../../types";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/onboardingFlow/steps/stepCycleLength/StepCycleLength.tsx"

$path = Join-Path $root "Features\welcomePage\WelcomePage.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { STEPS, TOTAL_STEPS } from "../constants";', 'import { STEPS, TOTAL_STEPS } from "../../constants";')
$content = $content.Replace('import { cn } from "../lib/cn";', 'import { cn } from "../../lib/cn";')
$content = $content.Replace('import { progressPercentOf, type OnboardingProgress } from "../lib/progress";', 'import { progressPercentOf, type OnboardingProgress } from "../../lib/progress";')
$content = $content.Replace('import { primaryBtn } from "./NavigationButtons";', 'import { primaryBtn } from "../../Elements/navigationButtons/NavigationButtons";')
$content = $content.Replace('import { OnboardingLayout } from "./OnboardingLayout";', 'import { OnboardingLayout } from "../../Composites/onboardingLayout/OnboardingLayout";')
$content = $content.Replace('import { StartOverDialog } from "./StartOverDialog";', 'import { StartOverDialog } from "../../Composites/startOverDialog/StartOverDialog";')
$content = $content.Replace('import { GirlCharacter } from "./visuals/GirlCharacter";', 'import { GirlCharacter } from "../../Composites/visuals/girlCharacter/GirlCharacter";')
$content = $content.Replace('import { SceneCanvas } from "./visuals/primitives";', 'import { SceneCanvas } from "../../Composites/visuals/primitives/primitives";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/welcomePage/WelcomePage.tsx"

$path = Join-Path $root "Features\dashboard\Dashboard.tsx"
$content = Get-Content -Raw -Encoding utf8 $path
$content = $content.Replace('import { FERTILITY_GOAL_OPTIONS } from "../constants";', 'import { FERTILITY_GOAL_OPTIONS } from "../../constants";')
$content = $content.Replace('import { effectiveDuration, parseISODate } from "../lib/health";', 'import { effectiveDuration, parseISODate } from "../../lib/health";')
$content = $content.Replace('import type { OnboardingData } from "../types";', 'import type { OnboardingData } from "../../types";')
$content = $content.Replace('import { Icon3D } from "./Icon3D";', 'import { Icon3D } from "../../Elements/icon3D/Icon3D";')
$content = $content.Replace('import { InfoCard } from "./InfoCard";', 'import { InfoCard } from "../../Elements/infoCard/InfoCard";')
$content = $content.Replace('import { secondaryBtn } from "./NavigationButtons";', 'import { secondaryBtn } from "../../Elements/navigationButtons/NavigationButtons";')
$content = $content.Replace('import { GirlCharacter } from "./visuals/GirlCharacter";', 'import { GirlCharacter } from "../../Composites/visuals/girlCharacter/GirlCharacter";')
Set-Content -Path $path -Value $content -Encoding utf8 -NoNewline
Write-Host "Fixed: Features/dashboard/Dashboard.tsx"