import { Heart, ShieldCheck, Sparkles } from "lucide-react";
import { useId, type ReactNode } from "react";
import type { ReminderDays } from "../../types";
import type { JourneyOption } from "./journeyOptions";

export function ToggleSwitch({ checked, onChange, labelledBy, describedBy, disabled }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelledBy: string;
  describedBy?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group relative -mr-1.5 inline-flex h-11 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span aria-hidden="true" className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors duration-200 ${checked ? "bg-[#F43F8F]" : "bg-[#E2E8F0]"}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

export function SettingRow({ label, description, checked, onChange, disabled }: {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const labelId = useId();
  const descId = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p id={labelId} className="text-xs font-bold text-[#17152B] sm:text-sm">{label}</p>
        {description && <p id={descId} className="text-[0.72rem] text-[#68708A]">{description}</p>}
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} labelledBy={labelId} describedBy={description ? descId : undefined} disabled={disabled} />
    </div>
  );
}

const LEAD_DAYS: readonly ReminderDays[] = [1, 3, 5];

export function LeadDaysPicker({ label, value, onChange, disabled }: {
  label: string;
  value: ReminderDays;
  onChange: (days: ReminderDays) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="space-y-1.5 pt-1.5" disabled={disabled}>
      <legend className="text-[0.68rem] font-medium text-[#68708A]">{label}</legend>
      <div className="grid grid-cols-3 gap-2">
        {LEAD_DAYS.map((days) => {
          const selected = value === days;
          return (
            <button
              key={days}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(days)}
              className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-full border px-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                selected ? "border-[#F43F8F] bg-[#FFF0F6] text-[#C2185B]" : "border-[#F1DDE8] bg-white text-[#68708A] hover:bg-gray-50"
              }`}
            >
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${selected ? "bg-[#F43F8F]" : "border border-[#68708A]"}`} />
              <span>{days} {days === 1 ? "day" : "days"} before</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function JourneyIcon({ icon, className = "h-5 w-5" }: { icon: JourneyOption["icon"]; className?: string }) {
  if (icon === "heart") return <Heart className={`${className} fill-current`} aria-hidden="true" />;
  if (icon === "shield") return <ShieldCheck className={className} aria-hidden="true" />;
  return <Sparkles className={className} aria-hidden="true" />;
}