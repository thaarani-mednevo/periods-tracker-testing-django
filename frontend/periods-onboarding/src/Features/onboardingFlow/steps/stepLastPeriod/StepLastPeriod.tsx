import { CalendarDays, ChevronDown, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { CalendarDialog } from "../../../../Elements/calendarDialog/CalendarDialog";

import { ManualDateInput } from "../../../../Elements/manualDateInput/ManualDateInput";

import { FieldError, NumberField, TextField } from "../../../../Elements/fields/Fields";

import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";

import { cn } from "../../../../lib/cn";

import { formatLongDate, initials, profileCompletion, toISODate } from "../../../../lib/health";

import type { StepProps } from "../../../../types";

export function StepLastPeriod({ data, update, errors }: StepProps) {
  const completion = useMemo(() => profileCompletion(data), [data]);
  const monogram = initials(data.name);
  // Optional details start collapsed (progressive disclosure) unless already filled or invalid.
  const [aboutOpen, setAboutOpen] = useState(() => !!data.name || data.age !== undefined);
  const showAbout = aboutOpen || !!errors.age;
  // The full calendar lives in a dialog, so the card stays compact and never has to scroll.
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div>
      <StepHeader
        step={1}
        title="When was your last period?"
        subtitle="Choose the first day of your most recent period to help us understand your cycle."
      />

      {/* 1. Manual date entry + calendar / today shortcuts */}
      <div>
        <ManualDateInput
          value={data.lastPeriod}
          onChange={(lastPeriod) => update({ lastPeriod })}
          error={errors.lastPeriod}
          errorId="lastPeriod-error"
        />

        <div className="mt-2.5 flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            aria-label="Open calendar"
            aria-haspopup="dialog"
            aria-describedby={errors.lastPeriod ? "lastPeriod-error" : undefined}
            className="flex min-h-12 flex-1 items-center gap-3 rounded-[16px] border border-[#F2DDE7] bg-[#FFF8FB] px-3 py-2 text-left transition-colors duration-200 hover:border-hover-border hover:bg-hover-bg focus-ring"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-icon-bg text-select-icon" aria-hidden="true">
              <CalendarDays className="size-[18px]" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block text-body font-semibold text-ink">Calendar</span>
              <span className="block text-caption text-ink-muted">Tap to change date</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => update({ lastPeriod: toISODate(new Date()) })}
            className="shrink-0 rounded-[16px] border border-[#F2DDE7] bg-white px-4 text-body-sm font-semibold text-rose-ink transition-colors duration-200 hover:border-hover-border hover:bg-hover-bg focus-ring"
          >
            Today
          </button>
        </div>
        <FieldError id="lastPeriod-error" message={errors.lastPeriod} />
      </div>

      {/* 2. About you — collapsible optional details */}
      <section aria-labelledby="about-you" className="rounded-card border border-line bg-white/80">
        <button
          type="button"
          onClick={() => setAboutOpen((o) => !o)}
          aria-expanded={showAbout}
          aria-controls="about-you-fields"
          className="flex min-h-14 w-full items-center gap-3 rounded-card px-3 py-2 short:min-h-12 short:py-1.5 text-left focus-ring"
        >
          <span
            className="relative grid size-11 shrink-0 place-items-center rounded-full p-[3px]"
            style={{ background: `conic-gradient(#F34F97 0%, #FF6FAE ${completion}%, #F8DDE7 ${completion}% 100%)` }}
            role="img"
            aria-label={`Profile ${completion}% complete`}
          >
            <span className="grid size-full place-items-center rounded-full bg-gradient-to-br from-white to-blush-100 text-body-sm font-bold text-rose-ink">
              {monogram || <UserRound className="size-4 text-rose" aria-hidden="true" />}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span id="about-you" className="block text-body font-semibold text-ink">
              About You <span className="text-caption font-medium text-ink-muted">· optional</span>
            </span>
            <span className="mt-0.5 flex items-center gap-2">
              <span className="h-1.5 max-w-24 flex-1 overflow-hidden rounded-full bg-blush-200" aria-hidden="true">
                <span className="block h-full origin-left rounded-full bg-brand transition-transform duration-700" style={{ transform: `scaleX(${completion / 100})` }} />
              </span>
              <span className="truncate text-caption font-medium text-ink-muted">
                <span className="font-bold tabular-nums text-rose-ink">{completion}%</span> <span className="max-[359px]:hidden">profile </span>completion
              </span>
            </span>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-rose transition-transform duration-200", showAbout && "rotate-180")} aria-hidden="true" />
        </button>
        {showAbout && (
          <div id="about-you-fields" className="grid animate-expand gap-2.5 border-t border-line/70 px-3 pb-3 pt-2.5">
            <TextField id="name" label="Name" value={data.name} onChange={(name) => update({ name })} placeholder="e.g. Priya" autoComplete="given-name" maxLength={40} />
            <NumberField id="age" label="Age" value={data.age} onChange={(age) => update({ age })} placeholder="28" unit="yrs" error={errors.age} />
          </div>
        )}
      </section>

      {/* 3. Selected date summary */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-blush-50 px-3.5 py-2.5 short:py-1.5" aria-live="polite">
        <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-icon-bg text-select-icon short:size-8" aria-hidden="true">
          <CalendarDays className="size-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-eyebrow font-semibold uppercase tracking-[0.14em] text-ink-muted">First day of last period</p>
          {data.lastPeriod ? (
            <p key={data.lastPeriod} className="animate-scale-in text-base font-bold leading-tight text-ink short:text-lead">
              {formatLongDate(data.lastPeriod)}
            </p>
          ) : (
            <p className="text-body font-medium leading-tight text-ink-placeholder">Select a date in the calendar</p>
          )}
        </div>
      </div>

      <CalendarDialog
        open={calendarOpen}
        value={data.lastPeriod}
        onSelect={(lastPeriod) => update({ lastPeriod })}
        onClose={() => setCalendarOpen(false)}
      />
    </div>
  );
}
