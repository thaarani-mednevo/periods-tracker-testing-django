import { ArrowRight, Bell, CalendarHeart, Droplet, Target } from "lucide-react";
import { useEffect, useRef } from "react";
import { FERTILITY_GOAL_OPTIONS } from "../../constants";
import { cn } from "../../lib/cn";
import { effectiveDuration, formatLongDate } from "../../lib/health";
import type { OnboardingData } from "../../types";
import { primaryBtn } from "./../../Elements/navigationButtons/NavigationButtons";
import { SuccessVisual } from "../visuals/cycleOrb/CycleOrb";
import { Particles } from "../visuals/primitives/primitives";

interface SuccessStateProps {
  data: OnboardingData;
  onGoToDashboard: (data: OnboardingData) => void;
}

export function SuccessState({ data, onGoToDashboard }: SuccessStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const duration = effectiveDuration(data);
  const goal = FERTILITY_GOAL_OPTIONS.find((g) => g.value === data.fertilityGoal)?.label;
  const summary = [
    { icon: CalendarHeart, label: "Last period", value: formatLongDate(data.lastPeriod) },
    {
      icon: Droplet,
      label: "Cycle",
      value:
        data.cycleLengthOption === "known" && data.cycleLength
          ? `${data.cycleLength} days · ${duration ?? "–"}-day period`
          : `Learning · ${duration ?? "–"}-day period`,
    },
    { icon: Target, label: "Focus", value: goal ?? "—" },
    {
      icon: Bell,
      label: "Reminders",
      value: [data.periodReminder && "Period", data.ovulationReminder && "Ovulation"].filter(Boolean).join(" & ") || "Off",
    },
  ];

  return (
    <section className="glass relative mx-auto max-w-3xl animate-scale-in overflow-hidden rounded-[32px] px-5 py-10 text-center sm:px-10 sm:py-12">
      <Particles count={16} />
      <SuccessVisual />

      <h1 ref={headingRef} tabIndex={-1} className="relative mt-4 text-headline font-semibold tracking-[-0.02em] text-ink outline-none">
        Your tracker is ready <span aria-hidden="true">✨</span>
      </h1>
      <p className="relative mx-auto mt-3 max-w-md text-lead leading-relaxed text-ink-sub sm:text-base">
        Your personalized cycle tracking experience has been successfully set up.
      </p>

      <ul className="relative mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
        {summary.map(({ icon: Icon, label, value }, i) => (
          <li
            key={label}
            className="flex animate-fade-up items-center gap-3 rounded-[18px] border border-line bg-white/75 p-3.5"
            style={{ animationDelay: `${300 + i * 80}ms` }}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-mist text-rose" aria-hidden="true">
              <Icon className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-caption font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</span>
              <span className="block truncate text-body font-semibold text-ink">{value}</span>
            </span>
          </li>
        ))}
      </ul>

      <button type="button" onClick={() => onGoToDashboard(data)} className={cn(primaryBtn, "relative mt-9 w-full sm:w-auto sm:min-w-[260px]")}>
        Go to My Dashboard
        <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </section>
  );
}
