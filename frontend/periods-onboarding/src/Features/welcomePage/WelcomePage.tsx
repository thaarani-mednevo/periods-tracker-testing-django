import { ArrowRight, ChartColumn, Check, Droplet, Droplets, Heart, Smile, Sparkles, Sprout, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { STEPS, TOTAL_STEPS } from "../../constants";
import { cn } from "../../lib/cn";
import { progressPercentOf, type OnboardingProgress } from "../../lib/progress";
import { primaryBtn } from "../../Elements/navigationButtons/NavigationButtons";
import { OnboardingLayout } from "../../Composites/onboardingLayout/OnboardingLayout";
import { StartOverDialog } from "../../Composites/startOverDialog/StartOverDialog";
import { GirlCharacter } from "../../Composites/visuals/girlCharacter/GirlCharacter";
import { SceneCanvas } from "../../Composites/visuals/primitives/primitives";

interface WelcomePageProps {
  /** Opens Step 1 of the existing onboarding flow. */
  onGetStarted: () => void;
  /** Saved setup progress, when the user left part-way through. */
  progress?: OnboardingProgress | null;
  /** Continues from the saved step. */
  onResume?: () => void;
  /** Clears saved progress and starts from Step 1. */
  onStartOver?: () => void;
}

/**
 * Optional hero photo (a realistic adult woman using a smartphone). Add
 * `src/assets/welcome/hero-woman.webp` (or `.png`) and it is bundled and used automatically; until then
 * the approved Mednevo guide is shown in the same spot. Discovered at build time, so a missing photo
 * never costs a failed network request or a flash of the fallback.
 */
const HERO_PHOTO_FILES = import.meta.glob<string>("../assets/welcome/hero-woman.{webp,png}", {
  eager: true,
  query: "?url",
  import: "default",
});
const HERO_PHOTO_SRC: string | undefined =
  HERO_PHOTO_FILES["../assets/welcome/hero-woman.webp"] ?? HERO_PHOTO_FILES["../assets/welcome/hero-woman.png"];

/** Pastel icon tones — soft rose, lavender-pink and lilac */
const TONES = {
  rose: "bg-[#FFF0F5] text-[#E95A94]",
  lavender: "bg-[#F9EEFA] text-[#C567B8]",
  lilac: "bg-[#F3EFFC] text-[#9A7FD6]",
} as const;
type Tone = keyof typeof TONES;

const FEATURES: { icon: LucideIcon; tone: Tone; title: string; text: string }[] = [
  { icon: Droplets, tone: "rose", title: "Track Your Cycle", text: "Follow periods, cycle days and phases." },
  { icon: Smile, tone: "lavender", title: "Log Symptoms & Mood", text: "Record how you feel throughout your cycle." },
  { icon: ChartColumn, tone: "lilac", title: "Understand Your Patterns", text: "See trends and personalized cycle insights." },
  { icon: Heart, tone: "rose", title: "Personalize Your Goals", text: "Choose fertility and wellness tracking that fits you." },
];

/* ------------------------------------------------------------------ */
/* Hero visual — scaled 640×460 composition matching reference        */
/* ------------------------------------------------------------------ */
const floatCard = "absolute rounded-2xl border border-[#F4E4EA] bg-white/95 shadow-[0_4px_16px_rgba(40,20,30,0.06)] backdrop-blur-sm";

function FloatingLabel({
  icon: Icon,
  tone,
  label,
  className,
  delay,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  className: string;
  delay: string;
}) {
  return (
    <div
      className={cn(floatCard, "flex animate-drift items-center gap-2.5 px-3 py-2", className)}
      style={{ animationDelay: delay }}
    >
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-xl", TONES[tone])}>
        <Icon className="size-3.5" strokeWidth={2.2} />
      </span>
      <span className="text-[12px] font-semibold leading-tight text-[#292127] whitespace-nowrap">{label}</span>
    </div>
  );
}

function MyCycleCard() {
  const month = "Sep 2026";
  const kind = (d: number) => (d <= 5 ? "period" : d >= 8 && d <= 13 ? "fertile" : d === 14 ? "ovulation" : "none");
  return (
    <div
      className={cn(floatCard, "left-[415px] top-[32px] w-[190px] animate-drift p-3.5 shadow-[0_6px_20px_rgba(40,20,30,0.07)]")}
      style={{ animationDelay: "0.8s" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-[#292127]">My Cycle</p>
        <span className="text-[10.5px] font-medium text-[#85737B]">{month}</span>
      </div>
      <div className="mt-2.5 grid grid-cols-7 gap-1 text-center text-[8.5px] font-semibold text-[#85737B]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
        {Array.from({ length: 21 }, (_, i) => {
          const d = i + 1;
          const k = kind(d);
          return (
            <span
              key={d}
              className={cn(
                "grid aspect-square place-items-center rounded-[5px] text-[8.5px] font-semibold",
                k === "period" && "bg-[#FFE8F1] text-[#E95A94]",
                k === "fertile" && "bg-[#F1ECFC] text-[#8E72D2]",
                k === "ovulation" && "bg-[#E8F6EE] text-[#4FA67A]",
                k === "none" && "bg-[#F7F3F5] text-[#85737B]",
              )}
            >
              {k === "period" ? (
                <Droplet className="size-2.5 fill-current" strokeWidth={0} />
              ) : k === "ovulation" ? (
                <Sprout className="size-2.5" strokeWidth={2.4} />
              ) : (
                d
              )}
            </span>
          );
        })}
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[9px] font-medium text-[#85737B]">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#E95A94]" />
          Period
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#9A7FD6]" />
          Fertile
        </span>
      </div>
    </div>
  );
}

/** The hero photo when it exists, otherwise the approved guide — same position and scale either way. */
function HeroPortrait() {
  const [photoFailed, setPhotoFailed] = useState(false);
  if (!HERO_PHOTO_SRC || photoFailed) {
    return (
      <div className="absolute bottom-[10px] left-[175px] h-[420px] animate-drift [animation-duration:9s]">
        <GirlCharacter decorative />
      </div>
    );
  }
  return (
    <div className="absolute left-[175px] top-[14px] h-[404px] w-[288px] animate-drift overflow-hidden rounded-b-[4px] [animation-duration:9s]">
      <img src={HERO_PHOTO_SRC} alt="" decoding="async" draggable={false} onError={() => setPhotoFailed(true)} className="size-full select-none object-cover object-top" />
    </div>
  );
}

function HeroVisual() {
  return (
    <div
      className="relative aspect-[640/460] w-full max-w-[620px]"
      role="img"
      aria-label="Cycle tracking preview: period tracking, symptom logging, pattern insights and a monthly cycle calendar"
    >
      <SceneCanvas mode="landscape">
        {/* Soft pink circular gradient behind the portrait */}
        <div className="absolute left-[70px] top-[14px] size-[430px] rounded-full bg-[radial-gradient(circle_at_50%_50%,#FFE5F0_0%,#FFF0F6_60%,#FFF8FA_100%)]" />
        <HeroPortrait />
        <FloatingLabel icon={Droplets} tone="rose" label="Track Periods" className="left-[55px] top-[48px]" delay="0s" />
        <FloatingLabel icon={Smile} tone="lavender" label="Log Symptoms" className="left-[18px] top-[175px]" delay="1.4s" />
        <FloatingLabel icon={Heart} tone="rose" label="Understand Patterns" className="left-[25px] top-[290px]" delay="0.6s" />
        <MyCycleCard />
        <FloatingLabel icon={ChartColumn} tone="lilac" label="Personalized Insights" className="left-[470px] top-[268px]" delay="2s" />
        <div
          className={cn(
            floatCard,
            "left-[430px] top-[348px] flex w-[152px] animate-drift items-center gap-2 border-[#FCE4EF] px-3 py-2",
          )}
          style={{ animationDelay: "1s" }}
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#FFF0F5] text-[#E95A94]">
            <Sparkles className="size-3 text-[#E95A94]" aria-hidden="true" />
          </span>
          <span className="text-[11px] font-semibold leading-tight text-[#E95A94]">Insights designed around you</span>
        </div>
      </SceneCanvas>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page — hero + four feature cards matching reference                */
/* ------------------------------------------------------------------ */
export function WelcomePage({ onGetStarted, progress, onResume, onStartOver }: WelcomePageProps) {
  const [confirmingStartOver, setConfirmingStartOver] = useState(false);
  const resumeStep = progress ? STEPS[progress.currentStep - 1] : undefined;

  return (
    <OnboardingLayout
      headerRight={null}
      background="plain"
      mode="page"
      containerClassName="max-w-[1160px] mx-auto px-6 sm:px-8"
    >
      {/* Hero Section */}
      <section
        aria-labelledby="welcome-title"
        className="grid items-center gap-8 pt-4 pb-8 sm:pt-6 sm:pb-12 md:grid-cols-[minmax(0,48fr)_minmax(0,52fr)] md:gap-8 lg:gap-12"
      >
        <div className="animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E85B91]">Your cycle, your way</p>
          <h1
            id="welcome-title"
            className="mt-3 text-[36px] sm:text-[42px] lg:text-[48px] xl:text-[52px] font-bold leading-[1.12] tracking-[-0.03em] text-[#292127]"
          >
            <span className="block">Welcome to Your</span>
            <span className="block text-[#F45A9B]">Cycle Tracker</span>
          </h1>
          <p className="mt-4 max-w-[420px] text-[15px] sm:text-base leading-relaxed text-[#756970]">
            Understand your cycle, track what matters to you, and get personalized insights along the way.
          </p>

          {progress && resumeStep ? (
            <>
              {/* Compact resume card */}
              <div className="mt-6 max-w-[420px] rounded-2xl border border-card-border bg-white p-4 shadow-feature">
                <p className="text-caption font-semibold uppercase tracking-[0.14em] text-rose-ink">Welcome back</p>
                <p className="mt-1 text-lead font-bold text-ink">
                  You&apos;re on Step {progress.currentStep} of {TOTAL_STEPS}
                </p>
                <p className="text-body-sm text-ink-muted">{resumeStep.label}</p>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-blush-200" aria-hidden="true">
                    <span
                      className="block h-full origin-left rounded-full bg-brand transition-transform duration-700"
                      style={{ transform: `scaleX(${progressPercentOf(progress) / 100})` }}
                    />
                  </span>
                  <span className="text-caption font-semibold tabular-nums text-rose-ink">{progressPercentOf(progress)}% complete</span>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2.5 min-[420px]:flex-row min-[420px]:items-center">
                <button type="button" onClick={onResume} className={cn(primaryBtn, "w-full min-[420px]:w-auto min-[420px]:min-w-[190px]")}>
                  Resume Journey
                  <ArrowRight className="size-[18px]" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingStartOver(true)}
                  className="min-h-11 rounded-xl px-3 text-body font-semibold text-ink-soft transition-colors duration-200 hover:bg-hover-bg hover:text-rose-ink focus-ring"
                >
                  Start Over
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-7">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F45A9B] to-[#F672AB] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(244,90,155,0.28)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_6px_20px_rgba(244,90,155,0.35)] focus-ring w-full min-[420px]:w-auto"
                >
                  Get Started
                  <ArrowRight className="size-[18px]" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-4 flex items-center gap-2 text-[13px] text-[#756970]">
                <Check className="size-4 text-[#34A853]" strokeWidth={2.6} aria-hidden="true" />
                You can change your preferences anytime.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-center animate-fade-in [animation-delay:150ms]">
          <HeroVisual />
        </div>
      </section>

      {/* Second Section: Features */}
      <section aria-labelledby="features-title" className="pt-4 pb-14 sm:pb-16 lg:pb-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E85B91]">Made for your wellbeing</p>
        <h2 id="features-title" className="mt-2 text-2xl sm:text-[26px] font-bold tracking-tight text-[#292127]">
          Make tracking work for you
        </h2>
        <p className="mt-1 text-[14px] text-[#756970]">Choose what matters to you and personalize your experience.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="rounded-2xl border border-[#F4E4EA] bg-white p-5 shadow-[0_2px_10px_rgba(40,20,30,0.03)] transition-all duration-200 ease-out hover:border-[#F2BBD0] hover:shadow-[0_4px_16px_rgba(40,20,30,0.06)]"
            >
              <span className={cn("grid size-10 place-items-center rounded-xl", TONES[f.tone])} aria-hidden="true">
                <f.icon className="size-5" strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-[#292127]">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#85737B]">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <StartOverDialog
        open={confirmingStartOver}
        onCancel={() => setConfirmingStartOver(false)}
        onConfirm={() => {
          setConfirmingStartOver(false);
          onStartOver?.();
        }}
      />
    </OnboardingLayout>
  );
}
