import { useEffect, useRef, type ReactNode } from "react";
import { STEPS, TOTAL_STEPS } from "../../constants";
import type { StepId } from "../../types";

interface StepHeaderProps {
  step: StepId;
  title: string;
  subtitle: string;
  /** Small indicator shown at the end of the eyebrow row (e.g. a privacy note). */
  badge?: ReactNode;
}

/** Large editorial heading with step eyebrow. Focuses itself on step change for screen readers. */
export function StepHeader({ step, title, subtitle, badge }: StepHeaderProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [step]);

  return (
    <header className="mb-4 short:mb-2.5">
      <p className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-eyebrow font-bold uppercase tracking-[0.16em] text-rose-ink">
        <span className="whitespace-nowrap">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="h-px w-6 bg-rose/30" aria-hidden="true" />
        <span className="whitespace-nowrap font-semibold text-ink-small">{STEPS[step - 1].label}</span>
        {badge && <span className="ml-auto whitespace-nowrap normal-case tracking-normal">{badge}</span>}
      </p>
      <h1
        ref={ref}
        tabIndex={-1}
        className="text-balance text-title font-bold tracking-[-0.02em] text-ink outline-none short:lg:text-title-sm xshort:text-xl"
      >
        {title}
      </h1>
      <p className="mt-1 max-w-xl text-pretty text-body leading-snug text-ink-sub">{subtitle}</p>
    </header>
  );
}
