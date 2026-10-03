import { Lock, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon3D } from "../icon3D/Icon3D";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}

/** Soft futuristic switch: white when off, pink→peach with glow when on. */
export function ToggleSwitch({ checked, onChange, label, disabled, id }: ToggleSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-[54px] shrink-0 items-center rounded-full border transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-ring",
        checked ? "border-transparent bg-button" : "border-[#E9D6DE] bg-white",
        disabled && "cursor-not-allowed opacity-90",
      )}
    >
      {/* Extended touch target */}
      <span className="absolute -inset-2" aria-hidden="true" />
      <span
        aria-hidden="true"
        className={cn(
          "grid size-6 place-items-center rounded-full bg-white shadow-[0_2px_6px_rgb(45_36_40/0.18)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          checked ? "translate-x-[25px]" : "translate-x-[3px]",
        )}
      >
        {disabled && checked && <Lock className="size-3 text-rose" strokeWidth={2.5} />}
      </span>
    </button>
  );
}

interface ToggleCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  checked: boolean;
  onChange: (next: boolean) => void;
  required?: boolean;
  /** Compact grid variant: no icon, description kept for screen readers only. */
  dense?: boolean;
  children?: ReactNode;
}

/** Card wrapper around a switch; optional children expand when enabled. */
export function ToggleCard({ title, description, icon, checked, onChange, required, dense, children }: ToggleCardProps) {
  const switchId = `toggle-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div
      className={cn(
        "rounded-card border transition-[background-color,border-color,box-shadow] duration-300 ease-out",
        checked ? "border-select-border bg-select-bg" : "border-card-border bg-white",
      )}
    >
      <div className={cn("flex items-center gap-3", dense ? "min-h-11 px-3 py-1 pointer-fine:min-h-9" : "min-h-[52px] px-3.5 py-2")}>
        {icon && !dense && <Icon3D icon={icon} active={checked} size="sm" />}
        <label htmlFor={switchId} className="min-w-0 flex-1 cursor-pointer">
          <span className="flex flex-wrap items-center gap-2">
            <span className={cn("font-semibold leading-tight text-ink", dense ? "text-body-sm" : "text-body")}>{title}</span>
            {required && (
              <span className="inline-flex animate-glow items-center gap-1 rounded-full bg-rose px-1.5 py-0.5 text-eyebrow font-semibold tracking-wide text-white">
                Required
              </span>
            )}
          </span>
          {description && <span className={cn("mt-0.5 block text-caption leading-snug text-ink-muted", dense && "sr-only")}>{description}</span>}
        </label>
        <ToggleSwitch
          id={switchId}
          checked={checked}
          onChange={onChange}
          label={required ? `${title} (required, always on)` : title}
          disabled={required}
        />
      </div>
      {checked && children && (
        <div className="animate-expand border-t border-line/70 px-3.5 pb-3 pt-2.5">{children}</div>
      )}
    </div>
  );
}
