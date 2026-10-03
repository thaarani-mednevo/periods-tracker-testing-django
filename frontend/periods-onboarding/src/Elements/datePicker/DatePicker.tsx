import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { parseISODate, toISODate } from "../../lib/health";

interface DatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  /** Fires as the keyboard focus moves between days, so a wrapping dialog can offer "Select". */
  onFocusedDateChange?: (iso: string) => void;
  /** Latest selectable date (defaults to today). */
  max?: Date;
  error?: string;
  errorId?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
/** Short names keep the month/year header on one line down to a 320px phone ("Sep", not "September"). */
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString("en-US", { month: "short" }),
);
const MONTHS_LONG = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" }),
);

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

const selectCls =
  "h-11 appearance-none rounded-xl border border-line-input bg-white pl-3 pr-8 text-body-sm font-semibold text-rose-ink pointer-fine:h-9 transition focus:border-rose focus:outline-none focus:ring-[3px] focus:ring-rose/10";

function SelectWrap({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-flex">
      {children}
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-rose-deep" aria-hidden="true" />
    </span>
  );
}

/** Premium glass calendar with month/year selectors, keyboard navigation and a today marker. */
export function DatePicker({ value, onChange, onFocusedDateChange, max, error, errorId }: DatePickerProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = max ? startOfDay(max) : today;
  const selected = parseISODate(value);

  const [view, setView] = useState(() => {
    const base = selected ?? today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [focusIso, setFocusIso] = useState<string>(value || toISODate(today));
  const setFocus = (iso: string) => {
    setFocusIso(iso);
    onFocusedDateChange?.(iso);
  };
  const gridRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => {
    const y = maxDate.getFullYear();
    return Array.from({ length: 4 }, (_, i) => y - i);
  }, [maxDate]);

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const offset = first.getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const out: Array<Date | null> = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(view.year, view.month, d));
    while (out.length % 7) out.push(null);
    return out;
  }, [view]);

  const atMaxMonth = view.year === maxDate.getFullYear() && view.month === maxDate.getMonth();
  const minYear = years[years.length - 1];
  const atMinMonth = view.year === minYear && view.month === 0;

  const goMonth = (delta: number) => {
    setDirection(delta > 0 ? "right" : "left");
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const setMonthYear = (year: number, month: number) => {
    const target = new Date(year, month, 1);
    const clamped = target > maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : target;
    setDirection(clamped.getTime() > new Date(view.year, view.month, 1).getTime() ? "right" : "left");
    setView({ year: clamped.getFullYear(), month: clamped.getMonth() });
  };

  const moveFocus = (days: number) => {
    const cur = parseISODate(focusIso) ?? today;
    const next = new Date(cur);
    next.setDate(cur.getDate() + days);
    if (next > maxDate) return;
    const iso = toISODate(next);
    setFocus(iso);
    if (next.getMonth() !== view.month || next.getFullYear() !== view.year) {
      setDirection(days > 0 ? "right" : "left");
      setView({ year: next.getFullYear(), month: next.getMonth() });
    }
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`)?.focus();
    });
  };

  const onGridKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in map) {
      e.preventDefault();
      moveFocus(map[e.key]);
    }
  };

  // Roving tabindex target: the focused date if visible, else selected, else first enabled day.
  const visibleIsos = cells.filter((c): c is Date => !!c && c <= maxDate).map(toISODate);
  const tabbable = visibleIsos.includes(focusIso)
    ? focusIso
    : value && visibleIsos.includes(value)
      ? value
      : visibleIsos[visibleIsos.length - 1];

  const navBtn =
    "grid size-11 place-items-center rounded-xl text-rose transition hover:bg-blush-100 disabled:opacity-30 focus-ring pointer-fine:size-9";

  return (
    <div className={cn("glass-soft rounded-card p-3 shadow-glass lg:p-3.5 short:lg:p-2.5", error && "border-rose/50")}>
      {/* Header / navigation */}
      <div className="mb-1.5 flex items-center gap-1.5 short:mb-1">
        <button type="button" onClick={() => goMonth(-1)} disabled={atMinMonth} aria-label="Previous month" className={navBtn}>
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex flex-1 items-center justify-center gap-1.5">
          <label className="sr-only" htmlFor="dp-month">
            Month
          </label>
          <SelectWrap>
            <select id="dp-month" className={selectCls} value={view.month} onChange={(e) => setMonthYear(view.year, Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i} disabled={view.year === maxDate.getFullYear() && i > maxDate.getMonth()}>
                  {m}
                </option>
              ))}
            </select>
          </SelectWrap>
          <label className="sr-only" htmlFor="dp-year">
            Year
          </label>
          <SelectWrap>
            <select id="dp-year" className={selectCls} value={view.year} onChange={(e) => setMonthYear(Number(e.target.value), view.month)}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </SelectWrap>
        </div>
        <button type="button" onClick={() => goMonth(1)} disabled={atMaxMonth} aria-label="Next month" className={navBtn}>
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-0.5 text-center text-micro font-semibold text-ink-muted">
            {d}
          </span>
        ))}
      </div>

      <div
        key={`${view.year}-${view.month}`}
        ref={gridRef}
        role="grid"
        // Programmatically focusable container; the roving day button is the real tab stop.
        tabIndex={-1}
        aria-label={`${MONTHS_LONG[view.month]} ${view.year}`}
        aria-describedby={error ? errorId : undefined}
        onKeyDown={onGridKey}
        className={cn("grid grid-cols-7 gap-0.5", direction === "right" ? "animate-slide-in-right" : "animate-slide-in-left")}
      >
        {cells.map((date, i) => {
          if (!date) return <span key={`e${i}`} className="h-9 short:h-8 short:pointer-fine:h-7" />;
          const iso = toISODate(date);
          const isSelected = iso === value;
          const isToday = date.getTime() === today.getTime();
          const disabled = date > maxDate;
          return (
            <button
              key={iso}
              type="button"
              data-iso={iso}
              disabled={disabled}
              tabIndex={iso === tabbable ? 0 : -1}
              aria-pressed={isSelected}
              aria-label={`${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${isToday ? ", today" : ""}${disabled ? ", unavailable" : ""}`}
              onClick={() => {
                onChange(iso);
                setFocus(iso);
              }}
              className={cn(
                "relative mx-auto grid h-9 w-full max-w-10 place-items-center rounded-full text-body-sm font-semibold tabular-nums transition-colors duration-150 focus-ring short:h-8 short:pointer-fine:h-7",
                isSelected && "bg-button text-white",
                !isSelected && !disabled && "text-ink-soft hover:bg-blush-100",
                !isSelected && isToday && "text-rose-ink ring-2 ring-inset ring-rose/35",
                disabled && "cursor-not-allowed text-ink-placeholder/50",
              )}
            >
              {date.getDate()}
              {isToday && !isSelected && <span className="absolute bottom-0.5 size-1 rounded-full bg-rose" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
