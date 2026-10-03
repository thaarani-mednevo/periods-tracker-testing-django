import type { ReactNode } from 'react';
import { LogCard } from '../ui/LogCard';
import { OptionGrid, OptionTile } from '../ui/OptionTile';

export interface ChoiceOption<T extends string> {
  value: T;
  visual: ReactNode;
}

interface ChoiceSectionProps<T extends string> {
  icon: ReactNode;
  title: string;
  subtitle: string;
  info?: boolean;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  className?: string;
}

/** A Daily Log card with a single-select row of option tiles (mood, fatigue, sleep…). */
export function ChoiceSection<T extends string>({
  icon,
  title,
  subtitle,
  info,
  options,
  value,
  onChange,
  className,
}: ChoiceSectionProps<T>) {
  return (
    <LogCard icon={icon} title={title} subtitle={subtitle} info={info} className={className}>
      <div role="group" aria-label={title} className="flex flex-1 flex-col [&>div]:flex-1">
        <OptionGrid columns={options.length}>
          {options.map((o) => (
            <OptionTile key={o.value} label={o.value} visual={o.visual} selected={o.value === value} onSelect={() => onChange(o.value)} />
          ))}
        </OptionGrid>
      </div>
    </LogCard>
  );
}
