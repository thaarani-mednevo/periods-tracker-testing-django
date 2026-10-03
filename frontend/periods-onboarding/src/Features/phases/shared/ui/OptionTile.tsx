import type { ReactNode } from 'react';

interface OptionTileProps {
  label: string;
  visual: ReactNode;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}

/** Selectable tile (icon above label) used across the Daily Log sections. */
export function OptionTile({ label, visual, selected, onSelect, className = '' }: OptionTileProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex min-w-0 flex-col items-center justify-center gap-[clamp(4px,0.5vw,8px)] rounded-[clamp(12px,1vw,16px)] px-1 py-[clamp(8px,0.8vw,12px)] transition-colors duration-150 ${
        selected
          ? 'border-2 border-lu-brand bg-lu-brand-soft text-lu-brand-strong'
          : 'border border-lu-line bg-white text-lu-ink-muted hover:border-lu-brand-line hover:bg-lu-brand-tint'
      } ${className}`}
    >
      <span className="flex h-[clamp(30px,2.5vw,42px)] items-center justify-center">{visual}</span>
      <span className="w-full truncate text-center text-lu-label">{label}</span>
    </button>
  );
}

interface OptionGridProps {
  columns: number;
  children: ReactNode;
}

/** Row of option tiles; wraps to two columns on very narrow screens when crowded. */
export function OptionGrid({ columns, children }: OptionGridProps) {
  const cols: Record<number, string> = {
    3: 'grid-cols-3',
    4: 'grid-cols-2 min-[400px]:grid-cols-4',
    5: 'grid-cols-3 min-[440px]:grid-cols-5',
  };
  return <div className={`grid auto-rows-fr gap-[clamp(8px,0.8vw,12px)] ${cols[columns] ?? 'grid-cols-3'}`}>{children}</div>;
}
