import { Info } from 'lucide-react';
import { LogCard } from '../ui/LogCard';
import { ScaleArt } from '../ui/Illustrations';

interface BodyWeightSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function BodyWeightSection({ value, onChange }: BodyWeightSectionProps) {
  return (
    <LogCard icon={<ScaleArt className="w-[70%]" />} title="Body Weight" subtitle="Enter your current weight" info>
      <label className="flex items-baseline gap-1 rounded-[clamp(12px,1vw,16px)] border border-lu-brand-line bg-white px-4 py-[clamp(10px,1vw,14px)] focus-within:border-lu-brand">
        <span className="sr-only">Weight in kilograms</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 bg-transparent text-lu-title font-bold text-lu-ink outline-none"
          style={{ width: `${Math.max(value.length, 2) * 0.62}em` }}
        />
        <span className="text-lu-label text-lu-ink-muted">kg</span>
      </label>
      <p className="mt-auto flex items-center gap-2 rounded-[clamp(10px,0.9vw,14px)] bg-lu-brand-soft/70 px-4 py-3 text-lu-caption text-lu-brand-strong">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        Track your weight to see trends throughout your cycle.
      </p>
    </LogCard>
  );
}
