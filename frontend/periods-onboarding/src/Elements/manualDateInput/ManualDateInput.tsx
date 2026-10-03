import { ChevronDown } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { parseISODate, toISODate } from "../../lib/health";

const MONTHS = [
  { value: "0", label: "Jan", full: "January" },
  { value: "1", label: "Feb", full: "February" },
  { value: "2", label: "Mar", full: "March" },
  { value: "3", label: "Apr", full: "April" },
  { value: "4", label: "May", full: "May" },
  { value: "5", label: "Jun", full: "June" },
  { value: "6", label: "Jul", full: "July" },
  { value: "7", label: "Aug", full: "August" },
  { value: "8", label: "Sep", full: "September" },
  { value: "9", label: "Oct", full: "October" },
  { value: "10", label: "Nov", full: "November" },
  { value: "11", label: "Dec", full: "December" },
];

interface ManualDateInputProps {
  /** ISO string "YYYY-MM-DD" or "" */
  value: string;
  onChange: (iso: string) => void;
  error?: string;
  errorId?: string;
}

export function ManualDateInput({ value, onChange, error, errorId }: ManualDateInputProps) {
  const dayId = useId();
  const monthId = useId();
  const yearId = useId();

  const parsed = useMemo(() => parseISODate(value), [value]);

  const [dayStr, setDayStr] = useState(() => (parsed ? String(parsed.getUTCDate()) : ""));
  const [monthStr, setMonthStr] = useState(() => (parsed ? String(parsed.getUTCMonth()) : ""));
  const [yearStr, setYearStr] = useState(() => (parsed ? String(parsed.getUTCFullYear()) : ""));
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize internal fields whenever `value` prop changes (e.g. Today button, Calendar dialog, or restored progress)
  useEffect(() => {
    if (parsed) {
      setDayStr(String(parsed.getUTCDate()));
      setMonthStr(String(parsed.getUTCMonth()));
      setYearStr(String(parsed.getUTCFullYear()));
      setValidationError(null);
    } else if (!value) {
      setDayStr("");
      setMonthStr("");
      setYearStr("");
      setValidationError(null);
    }
  }, [value, parsed]);

  const validateAndSync = (newDay: string, newMonth: string, newYear: string) => {
    setDayStr(newDay);
    setMonthStr(newMonth);
    setYearStr(newYear);

    // If completely blank, clear error and date
    if (!newDay.trim() && !newMonth.trim() && !newYear.trim()) {
      setValidationError(null);
      onChange("");
      return;
    }

    // If partially filled, wait for all fields
    if (!newDay.trim() || !newMonth.trim() || !newYear.trim()) {
      setValidationError(null);
      onChange("");
      return;
    }

    const d = parseInt(newDay, 10);
    const m = parseInt(newMonth, 10);
    const y = parseInt(newYear, 10);

    if (isNaN(y) || newYear.length !== 4 || y < 1900 || y > 2100) {
      setValidationError("Please enter a valid 4-digit year.");
      onChange("");
      return;
    }

    if (isNaN(m) || m < 0 || m > 11) {
      setValidationError("Please select a valid month.");
      onChange("");
      return;
    }

    if (isNaN(d) || d < 1 || d > 31) {
      setValidationError("Day must be between 1 and 31.");
      onChange("");
      return;
    }

    const maxDays = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const monthName = MONTHS[m]?.label ?? "Selected month";

    if (d > maxDays) {
      setValidationError(`${monthName} has only ${maxDays} days in ${y}.`);
      onChange("");
      return;
    }

    const date = new Date(Date.UTC(y, m, d));
    const now = new Date();
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    if (date.getTime() > todayUtc) {
      setValidationError("The date can't be in the future.");
      onChange("");
      return;
    }

    setValidationError(null);
    onChange(toISODate(date));
  };

  const handleDayChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 2);
    validateAndSync(cleaned, monthStr, yearStr);
  };

  const handleMonthChange = (val: string) => {
    validateAndSync(dayStr, val, yearStr);
  };

  const handleYearChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    validateAndSync(dayStr, monthStr, cleaned);
  };

  const displayError = validationError || error;

  return (
    <div className="rounded-[18px] border border-[#F2DDE7] bg-white p-3.5 sm:p-4 shadow-[0_2px_10px_rgba(40,20,30,0.03)]">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* DAY field */}
        <div className="flex flex-col">
          <label htmlFor={dayId} className="mb-1.5 text-center text-eyebrow font-semibold uppercase tracking-[0.14em] text-ink-muted">
            DAY
          </label>
          <input
            id={dayId}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            placeholder="DD"
            value={dayStr}
            onChange={(e) => handleDayChange(e.target.value)}
            className={cn(
              "h-12 w-full rounded-xl border border-[#F1DCE4] bg-[#FFF8FB] text-center text-base font-bold text-ink placeholder:font-normal placeholder:text-ink-placeholder transition-all",
              "hover:border-hover-border hover:bg-hover-bg focus:border-rose focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose/20",
              displayError && "border-rose/50 bg-[#FFF5F8]",
            )}
            aria-describedby={displayError && errorId ? errorId : undefined}
          />
        </div>

        {/* MONTH field */}
        <div className="flex flex-col">
          <label htmlFor={monthId} className="mb-1.5 text-center text-eyebrow font-semibold uppercase tracking-[0.14em] text-ink-muted">
            MONTH
          </label>
          <div className="relative">
            <select
              id={monthId}
              value={monthStr}
              onChange={(e) => handleMonthChange(e.target.value)}
              className={cn(
                "h-12 w-full appearance-none rounded-xl border border-[#F1DCE4] bg-[#FFF8FB] px-2.5 pr-7 text-center text-base font-bold text-ink transition-all cursor-pointer",
                "hover:border-hover-border hover:bg-hover-bg focus:border-rose focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose/20",
                !monthStr && "font-normal text-ink-placeholder",
                displayError && "border-rose/50 bg-[#FFF5F8]",
              )}
              aria-describedby={displayError && errorId ? errorId : undefined}
            >
              <option value="" disabled>
                Month
              </option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} className="text-ink font-semibold">
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-rose" aria-hidden="true" />
          </div>
        </div>

        {/* YEAR field */}
        <div className="flex flex-col">
          <label htmlFor={yearId} className="mb-1.5 text-center text-eyebrow font-semibold uppercase tracking-[0.14em] text-ink-muted">
            YEAR
          </label>
          <input
            id={yearId}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="YYYY"
            value={yearStr}
            onChange={(e) => handleYearChange(e.target.value)}
            className={cn(
              "h-12 w-full rounded-xl border border-[#F1DCE4] bg-[#FFF8FB] text-center text-base font-bold text-ink placeholder:font-normal placeholder:text-ink-placeholder transition-all",
              "hover:border-hover-border hover:bg-hover-bg focus:border-rose focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose/20",
              displayError && "border-rose/50 bg-[#FFF5F8]",
            )}
            aria-describedby={displayError && errorId ? errorId : undefined}
          />
        </div>
      </div>

      {validationError && (
        <p className="mt-2.5 text-center text-caption font-medium text-rose-deep animate-fade-in" role="alert">
          {validationError}
        </p>
      )}
    </div>
  );
}
