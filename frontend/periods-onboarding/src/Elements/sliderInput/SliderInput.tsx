import type { CSSProperties, ReactNode } from "react";
import { useCountUp } from "../../hooks/useCountUp";
import { cn } from "../../lib/cn";
import { pluralDays } from "../../lib/health";

interface SliderInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Rendered next to the large value (e.g. feedback badge). */
  aside?: ReactNode;
  ticks?: number[];
  disabled?: boolean;
  /** Number shown large when it differs from the slider position (manual entry above the max). */
  displayValue?: number;
  /** Extra controls rendered inside the same card, below the scale. */
  children?: ReactNode;
}

/** Large-value slider with pink→peach filled track. */
export function SliderInput({
  id,
  label,
  value,
  min,
  max,
  onChange,
  aside,
  ticks,
  disabled,
  displayValue,
  children,
}: SliderInputProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const shown = useCountUp(displayValue ?? value, 250);
  // CSS custom property consumed by the .range-rose track gradient.
  const fillStyle: CSSProperties & { "--fill": string } = { "--fill": `${pct}%` };

  return (
    <div className={cn("rounded-card border border-blush-300 bg-white px-4 pb-2 pt-3.5", disabled && "opacity-80")}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label htmlFor={id} className="text-body-sm font-semibold text-ink-label">
            {label}
          </label>
          <p className="mt-1.5 flex items-baseline gap-2" aria-hidden="true">
            <span className="text-metric font-bold leading-none tabular-nums tracking-tight text-rose-deep xshort:text-4xl">{shown}</span>
            <span className="text-heading font-semibold text-rose-ink">{shown === 1 ? "day" : "days"}</span>
          </p>
        </div>
        {aside}
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={pluralDays(value)}
        className="range-rose mt-1"
        style={fillStyle}
      />

      <div className="-mt-1 flex justify-between text-micro font-medium text-ink-muted" aria-hidden="true">
        {(ticks ?? [min, max]).map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>

      {children}
    </div>
  );
}
