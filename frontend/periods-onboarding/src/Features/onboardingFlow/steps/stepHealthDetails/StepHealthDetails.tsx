import { PersonStanding, Ruler, Weight } from "lucide-react";
import { Icon3D } from "../../../../Elements/icon3D/Icon3D";

import { NumberField } from "../../../../Elements/fields/Fields";

import { InfoCard } from "../../../../Elements/infoCard/InfoCard";

import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";

import { useCountUp } from "../../../../hooks/useCountUp";

import { cn } from "../../../../lib/cn";

import { BMI_CATEGORY_NOTES, bmiCategory, validBmi } from "../../../../lib/health";

import type { StepProps } from "../../../../types";

const GAUGE_MIN = 14;
const GAUGE_MAX = 40;

function BmiGauge({ bmi }: { bmi: number }) {
  const shown = useCountUp(bmi, 900, 1);
  const r = 62;
  const arc = 2 * Math.PI * r * 0.75; // 270° gauge
  const pct = Math.min(1, Math.max(0, (bmi - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)));
  const category = bmiCategory(bmi);

  return (
    <div className="flex animate-scale-in items-center gap-4 rounded-card border border-line bg-gradient-to-br from-white via-blush-50 to-blush-100 p-3.5 shadow-glass">
      <div className="relative size-[112px] shrink-0 xshort:size-[96px]">
        <svg viewBox="0 0 156 156" className="size-full rotate-[135deg]" aria-hidden="true">
          <defs>
            <linearGradient id="bmiGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FF9CC6" />
              <stop offset="1" stopColor="#F34F97" />
            </linearGradient>
          </defs>
          <circle cx="78" cy="78" r={r} fill="none" stroke="#F8DDE7" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${arc} 999`} />
          <circle
            cx="78"
            cy="78"
            r={r}
            fill="none"
            stroke="url(#bmiGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arc * pct} 999`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-[19%] grid place-items-center rounded-full border border-white bg-white/80 shadow-[inset_0_2px_10px_rgba(243,79,151,0.12)] backdrop-blur">
          <div className="text-center">
            <p className="text-eyebrow font-bold uppercase tracking-[0.18em] text-ink-muted">BMI</p>
            <p className="text-metric-sm font-bold leading-none tracking-tight text-rose-ink tabular-nums">{shown.toFixed(1)}</p>
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1" role="status" aria-live="polite">
        <p className="sr-only">Your BMI is {bmi.toFixed(1)}, {category}.</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blush-300 bg-white py-0.5 pl-1 pr-3 text-body-sm font-semibold text-ink-label">
          <Icon3D icon={PersonStanding} size="sm" active className="size-6 rounded-full" />
          {category}
        </span>
        <p className="mt-1.5 text-body-sm leading-snug text-ink-soft">{BMI_CATEGORY_NOTES[category]}</p>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {(["Underweight", "Normal", "Overweight", "Obesity"] as const).map((c) => (
            <span key={c} className={cn("h-1.5 flex-1 rounded-full transition-colors", c === category ? "bg-brand" : "bg-blush-200")} />
          ))}
        </div>
        <div className="mt-1 flex justify-between gap-2 text-eyebrow font-medium text-ink-muted" aria-hidden="true">
          <span>&lt;18.5</span>
          <span>18.5–24.9</span>
          <span>25–29.9</span>
          <span>30+</span>
        </div>
      </div>
    </div>
  );
}

export function StepHealthDetails({ data, update, errors }: StepProps) {
  const bmi = validBmi(data.height, data.weight);

  const setHeight = (height?: number) => update({ height });
  const setWeight = (weight?: number) => update({ weight });

  return (
    <div>
      <StepHeader
        step={5}
        title="Let's understand your body better"
        subtitle="These details help us personalize your cycle insights."
      />

      <div className="grid gap-2.5">
        <div className="flex items-start gap-2.5 rounded-2xl border border-blush-300 bg-white p-3">
          <Icon3D icon={Ruler} size="sm" active={data.height !== undefined} className="mt-6" />
          <NumberField
            id="height"
            label="Height"
            value={data.height}
            onChange={setHeight}
            placeholder="165"
            unit="cm"
            error={errors.height}
            className="min-w-0 flex-1"
          />
        </div>
        <div className="flex items-start gap-2.5 rounded-2xl border border-blush-300 bg-white p-3">
          <Icon3D icon={Weight} size="sm" active={data.weight !== undefined} className="mt-6" />
          <NumberField
            id="weight"
            label="Weight"
            value={data.weight}
            onChange={setWeight}
            placeholder="58"
            unit="kg"
            decimals
            error={errors.weight}
            className="min-w-0 flex-1"
          />
        </div>
      </div>

      <div className="mt-2.5">
        {bmi !== undefined ? (
          <BmiGauge bmi={bmi} />
        ) : (
          <div className="grid min-h-[76px] place-items-center rounded-card border border-dashed border-blush-300 bg-white/50 p-3 text-center">
            <div>
              <p className="text-micro font-bold uppercase tracking-[0.18em] text-ink-muted">BMI</p>
              <p className="mt-0.5 text-body-sm text-ink-muted">Enter your height and weight to calculate it automatically.</p>
            </div>
          </div>
        )}
      </div>

      <InfoCard variant="disclaimer" className="mt-2.5">
        BMI is a general screening measure and does not account for every aspect of individual health. It should
        not be used as a diagnosis.
      </InfoCard>
    </div>
  );
}
