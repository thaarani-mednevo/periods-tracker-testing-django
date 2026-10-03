import { Bell, BellRing, Settings2, Smartphone } from "lucide-react";
import { handleRadioKeys } from "../../../../Elements/optionCard/OptionCard";

import { StepHeader } from "../../../../Elements/stepHeader/StepHeader";

import { ToggleCard } from "../../../../Elements/toggleCard/ToggleCard";

import { cn } from "../../../../lib/cn";

import { reminderPhrase } from "../../../../lib/health";

import type { ReminderDays, StepProps } from "../../../../types";

const DAY_OPTIONS: { value: ReminderDays; label: string }[] = [
  { value: 1, label: "1 day before" },
  { value: 3, label: "3 days before" },
  { value: 5, label: "5 days before" },
];

function DaysPicker({ value, onChange, name }: { value?: ReminderDays; onChange: (d: ReminderDays) => void; name: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-body-sm font-semibold text-ink-label" id={`${name}-label`}>
        Remind me
      </p>
      <div role="radiogroup" tabIndex={-1} aria-labelledby={`${name}-label`} onKeyDown={handleRadioKeys} className="grid w-full grid-cols-3 gap-1 rounded-[14px] border border-line bg-blush-50 p-1">
        {DAY_OPTIONS.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={value === undefined || on ? 0 : -1}
              onClick={() => onChange(o.value)}
              className={cn(
                "min-h-11 rounded-[10px] px-1 text-body-sm font-semibold transition-[background-color,color,box-shadow] duration-200 focus-ring pointer-fine:min-h-8",
                on ? "bg-white text-rose-ink shadow-[0_1px_4px_rgb(40_20_30/0.06)] ring-1 ring-select-border" : "text-ink-soft hover:bg-hover-bg",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StepNotifications({ data, update }: StepProps) {
  const previews: { title: string; body: string }[] = [];
  if (data.periodReminder)
    previews.push({ title: "Period reminder", body: `Your period may start ${reminderPhrase(data.periodReminderDays ?? 1)}.` });
  if (data.ovulationReminder)
    previews.push({ title: "Ovulation reminder", body: `Your estimated ovulation day may be ${reminderPhrase(data.ovulationReminderDays ?? 1)}.` });

  return (
    <div>
      <StepHeader step={8} title="Would you like helpful reminders?" subtitle="Choose when you'd like your tracker to remind you." />

      <div className="space-y-2">
        <ToggleCard
          title="Period reminder"
          description="A heads-up before your next period"
          icon={BellRing}
          checked={data.periodReminder}
          onChange={(on) => update({ periodReminder: on, ...(on && !data.periodReminderDays ? { periodReminderDays: 1 } : {}) })}
        >
          <DaysPicker name="period-days" value={data.periodReminderDays} onChange={(periodReminderDays) => update({ periodReminderDays })} />
        </ToggleCard>

        <ToggleCard
          title="Ovulation reminder"
          description="A note ahead of your estimated ovulation"
          icon={Smartphone}
          checked={data.ovulationReminder}
          onChange={(on) => update({ ovulationReminder: on, ...(on && !data.ovulationReminderDays ? { ovulationReminderDays: 1 } : {}) })}
        >
          <DaysPicker name="ovulation-days" value={data.ovulationReminderDays} onChange={(ovulationReminderDays) => update({ ovulationReminderDays })} />
        </ToggleCard>
      </div>

      {/* Reminder preview */}
      <section aria-labelledby="preview-title" className="mt-3">
        <h2 id="preview-title" className="mb-1.5 text-micro font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Reminder preview
        </h2>
        <div className="rounded-2xl bg-brand-mist p-2" aria-live="polite">
          {previews.length === 0 ? (
            <p className="px-2 py-2 text-center text-body-sm text-ink-muted">Turn on a reminder to see a preview.</p>
          ) : (
            <div key={previews.map((p) => p.body).join("|")} className="flex animate-fade-up items-start gap-2.5 rounded-[14px] border border-white bg-white/90 px-3 py-2 shadow-glass">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] bg-icon-bg text-select-icon" aria-hidden="true">
                <Bell className="size-4" />
              </span>
              <ul className="min-w-0 flex-1 space-y-1">
                {previews.map((p) => (
                  <li key={p.title}>
                    <p className="text-caption font-semibold leading-tight text-ink">
                      Mednevo · {p.title} <span className="font-normal text-ink-muted">· now</span>
                    </p>
                    <p className="text-body-sm leading-snug text-ink-soft">{p.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <p className="mt-2.5 flex items-center gap-1.5 text-body-sm text-ink-muted">
        <Settings2 className="size-3.5 shrink-0 text-rose" aria-hidden="true" />
        Notification preferences can be changed anytime in Settings.
      </p>
    </div>
  );
}
