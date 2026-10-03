import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn";
import { parseISODate, toISODate } from "../../lib/health";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Row height in px — also the touch target, so it stays comfortable on phones. */
const ROW = 44;
/** Rows visible above and below the selected one. */
const PAD_ROWS = 1;

interface WheelProps<T> {
  label: string;
  /** Rendered by the parent; kept here only for the listbox's accessible name. */
  items: readonly T[];
  index: number;
  onIndex: (index: number) => void;
  render: (item: T) => string;
}

/**
 * One scrollable column. Uses native scroll-snap for the physics (touch, wheel and trackpad all come
 * free), reports the centred row once scrolling settles, and supports arrow keys and direct clicks.
 */
function Wheel<T>({ label, items, index, onIndex, render }: WheelProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef(0);
  /**
   * Scrolling the column in code also fires scroll events. Without this flag the settle handler would
   * read a half-finished position and "select" whatever row it happened to pass.
   */
  const programmatic = useRef(true);

  // Park on the selected row: instantly on mount, smoothly when the value changes elsewhere.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = index * ROW;
    if (Math.abs(el.scrollTop - target) < 2) return;
    programmatic.current = true;
    el.scrollTo({ top: target, behavior: el.scrollTop === 0 ? "auto" : "smooth" });
  }, [index]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      if (programmatic.current) {
        // That scroll was ours — just release the flag.
        programmatic.current = false;
        return;
      }
      const next = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ROW)));
      if (next !== index) {
        onIndex(next);
      } else if (Math.abs(el.scrollTop - next * ROW) > 1) {
        // Snap the last fraction into place without re-selecting.
        programmatic.current = true;
        el.scrollTo({ top: next * ROW, behavior: "smooth" });
      }
    }, 140);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const next = Math.max(0, Math.min(items.length - 1, index + (e.key === "ArrowDown" ? 1 : -1)));
    if (next !== index) onIndex(next);
  };

  return (
    <div
        ref={ref}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        className="scrollbar-none relative min-w-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-[14px] focus-ring"
        style={{ height: ROW * (PAD_ROWS * 2 + 1) }}
      >
        <div style={{ paddingTop: ROW * PAD_ROWS, paddingBottom: ROW * PAD_ROWS }}>
          {items.map((item, i) => (
            <button
              key={render(item)}
              type="button"
              role="option"
              aria-selected={i === index}
              tabIndex={-1}
              onClick={() => onIndex(i)}
              style={{ height: ROW }}
              className={cn(
                "flex w-full snap-center items-center justify-center text-base tabular-nums transition-[color,opacity,font-weight] duration-200",
                i === index ? "font-bold text-ink" : "font-medium text-ink-muted opacity-55",
              )}
            >
              {render(item)}
            </button>
          ))}
        </div>
    </div>
  );
}

const YEAR_SPAN = 8;

interface DateWheelProps {
  /** ISO "YYYY-MM-DD"; empty means nothing chosen yet. */
  value: string;
  onChange: (iso: string) => void;
}

/**
 * Three wheels driving a single date. The day column always reflects the selected month, and a day
 * that no longer exists (31 → February) is clamped to that month's last day, so the value can never
 * become invalid.
 */
export function DateWheel({ value, onChange }: DateWheelProps) {
  const today = useMemo(() => new Date(), []);
  const selected = parseISODate(value) ?? today;
  // Derived straight from the value (no mirrored state), so Today, the calendar dialog and restored
  // progress are reflected in the same render.
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const day = selected.getDate();

  // A last period can't be in the future, so the list ends at the current year. A saved date outside
  // the window is still included, so the Year column can always show the actual selection.
  const years = useMemo(() => {
    const last = today.getFullYear();
    const first = Math.min(last - YEAR_SPAN, year);
    return Array.from({ length: last - first + 1 }, (_, i) => first + i).concat(year > last ? [year] : []);
  }, [today, year]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const safeDay = Math.min(day, daysInMonth);

  const commit = (y: number, m: number, d: number) => {
    const clamped = Math.min(d, new Date(y, m + 1, 0).getDate());
    onChange(toISODate(new Date(y, m, clamped)));
  };

  return (
    <div className="rounded-[16px] border border-line bg-white/80 px-2 py-2">
      <div className="flex gap-1" aria-hidden="true">
        {["Day", "Month", "Year"].map((l) => (
          <p key={l} className="min-w-0 flex-1 text-center text-eyebrow font-semibold uppercase tracking-[0.14em] text-ink-muted">
            {l}
          </p>
        ))}
      </div>

      {/* The columns and the selection band share one box, so the band always frames the centre row. */}
      <div className="relative mt-1">
        <div className="flex items-stretch gap-1">
          <Wheel label="Day" items={days} index={safeDay - 1} onIndex={(i) => commit(year, month, days[i])} render={(d) => String(d)} />
          <Wheel label="Month" items={MONTHS} index={month} onIndex={(i) => commit(year, i, day)} render={(m) => m} />
          <Wheel label="Year" items={years} index={years.indexOf(year)} onIndex={(i) => commit(years[i], month, day)} render={(y) => String(y)} />
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 rounded-[12px] border border-select-border bg-select-bg/50" style={{ top: ROW, height: ROW }} />
          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-white via-white/70 to-transparent" style={{ height: ROW }} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/70 to-transparent" style={{ height: ROW }} />
        </div>
      </div>
    </div>
  );
}
