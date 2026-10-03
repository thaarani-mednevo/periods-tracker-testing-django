import { ChevronLeft, ChevronRight, Droplet } from 'lucide-react';
import { formatDate, parts } from '../../../../lib/dailyLogDate';
import type { CyclePhase } from '../../../../services/cycle';
import { PHASE_LABEL, type CycleInfo } from './phaseCopy';

interface CycleDayStripProps {
  today: string;
  /** The 7 visible dates */
  dates: string[];
  selectedDate: string;
  info: CycleInfo;
  cycleInfo: (date: string) => CycleInfo;
  isLogged: (date: string) => boolean;
  onSelect: (date: string) => void;
  onToday: () => void;
  onShiftWeek: (n: number) => void;
  onShiftMonth: (n: number) => void;
}

const LEGEND = [
  { label: 'Menstruation', color: 'bg-[#F87171]' },
  { label: 'Follicular Phase', color: 'bg-[#FBBF24]' },
  { label: 'Ovulation', color: 'bg-[#4ADE80]' },
  { label: 'Luteal Phase', color: 'bg-[#C084FC]' },
  { label: 'Logged', color: 'bg-[#D1D5DB]' },
];

/** "August 2026", "August – September 2026" or "December 2026 – January 2027" */
function windowLabel(first: string, last: string) {
  const a = parts(first);
  const b = parts(last);
  const month = (d: string) => formatDate(d, { month: 'long' });
  if (a.y !== b.y) return `${month(first)} ${a.y} – ${month(last)} ${b.y}`;
  if (a.m !== b.m) return `${month(first)} – ${month(last)} ${a.y}`;
  return `${month(first)} ${a.y}`;
}

const dateText = 'text-lu-micro';
const dot = 'h-[clamp(8px,0.7vw,10px)] w-[clamp(8px,0.7vw,10px)] rounded-full';

function PhaseMarker({ phase, selected }: { phase: CyclePhase; selected: boolean }) {
  switch (phase) {
    case 'menstrual':
      return (
        <Droplet
          className={`h-3.5 w-3.5 ${
            selected ? 'text-white' : 'text-[#F87171]'
          }`}
          strokeWidth={2.4}
        />
      );

    case 'follicular':
      return (
        <span
          className={`${dot} ${
            selected
              ? 'bg-white'
              : 'bg-[#FBBF24]'
          }`}
        />
      );

    case 'ovulation':
      return (
        <span
          className={`${dot} ${
            selected
              ? 'bg-white'
              : 'bg-[#4ADE80]'
          }`}
        />
      );

    case 'luteal':
      return (
        <span
          className={`${dot} ${
            selected
              ? 'bg-white'
              : 'bg-[#C084FC]'
          }`}
        />
      );

    default:
      return null;
  }
}

export function CycleDayStrip({
  today,
  dates,
  selectedDate,
  info,
  cycleInfo,
  isLogged,
  onSelect,
  onToday,
  onShiftWeek,
  onShiftMonth,
}: CycleDayStripProps) {
  const rangeLabel = windowLabel(dates[0], dates[dates.length - 1]);

  const summary = [
    selectedDate === today ? 'Today' : null,
    formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' }),
    PHASE_LABEL[info.phase],
  ]
    .filter(Boolean)
    .join(' · ');

  const arrow =
    'flex h-7 w-7 shrink-0 items-center sm:h-8 sm:w-8 justify-center rounded-full text-lu-ink-faint transition-colors hover:bg-[#F3F4F6] hover:text-lu-ink';

  return (
    <section className="lu-card p-lu-card">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lu-title font-bold text-lu-ink">
            Cycle Day <span className="text-lu-brand">{info.cycleDay ?? '–'}</span>
          </h2>
          <p className="mt-1 text-lu-label text-lu-ink-muted">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lu-label font-semibold text-lu-ink" aria-live="polite">
            {rangeLabel}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Previous month" className={arrow} onClick={() => onShiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="rounded-full bg-lu-brand-tint px-4 py-1.5 text-lu-label font-semibold text-lu-brand-strong transition-colors hover:bg-lu-brand-soft"
            >
              Today
            </button>
            <button type="button" aria-label="Next month" className={arrow} onClick={() => onShiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="-mx-2 mt-[clamp(12px,1.1vw,18px)] flex items-center gap-0.5 sm:mx-0 sm:gap-1">
        <button type="button" aria-label="Previous 7 days" className={arrow} onClick={() => onShiftWeek(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <ol aria-label={rangeLabel} className="grid min-w-0 flex-1 grid-cols-7 gap-[clamp(0px,0.8vw,14px)]">
          {dates.map((date) => {
            const isSelected = date === selectedDate;
            const isToday = date === today;
            const { cycleDay, phase } = cycleInfo(date);
            const logged = isLogged(date);
            return (
              <li key={date} className="flex min-w-0 justify-center">
                <button
                  type="button"
                  onClick={() => onSelect(date)}
                  aria-pressed={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={`${formatDate(date, { month: 'long', day: 'numeric' })}, cycle day ${cycleDay ?? 'unknown'}, ${PHASE_LABEL[phase]}${logged ? ', logged' : ''}`}
                  className={`flex w-full max-w-[68px] flex-col items-center gap-[3px] rounded-[clamp(10px,1vw,16px)] py-[clamp(6px,0.55vw,10px)] transition-colors ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#F472B6] to-[#EC4899] text-white shadow-lu-glow'
                      : isToday
                        ? 'border border-lu-brand-line bg-lu-brand-tint text-lu-ink hover:bg-lu-brand-soft'
                        : 'text-lu-ink hover:bg-lu-brand-tint'
                  }`}
                >
                  <span className={`${dateText} ${isSelected ? 'text-white/90' : 'text-lu-ink-faint'}`}>
                    {formatDate(date, { month: 'short' })}
                  </span>
                  <span className="text-lu-numeral font-bold">{parts(date).d}</span>
                  <span className={`whitespace-nowrap ${dateText} ${isSelected ? 'text-white/90' : 'text-lu-ink-faint'}`}>
                    CD {cycleDay ?? '–'}
                  </span>
                  <span className="flex h-4 items-center justify-center gap-1">
                    <PhaseMarker phase={phase} selected={isSelected} />
                    {logged && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-[#D1D5DB]'}`} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <button type="button" aria-label="Next 7 days" className={arrow} onClick={() => onShiftWeek(1)}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <ul className="mt-[clamp(10px,1vw,16px)] flex flex-wrap gap-x-5 gap-y-2">
        {LEGEND.map((l) => (
          <li key={l.label} className="flex items-center gap-1.5 text-lu-caption text-lu-ink-muted">
            <span className={`h-2 w-2 rounded-full ${l.color}`} />
            {l.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
