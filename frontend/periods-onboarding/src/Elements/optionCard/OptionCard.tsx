import { Check, type LucideIcon } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon3D } from "../icon3D/Icon3D";

interface OptionCardProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  /** "radio" for single choice groups, "checkbox" for multi-select. */
  mode?: "radio" | "checkbox";
  size?: "md" | "sm";
  /** "row" (icon · text · check) or "tile" (row on phones, stacked tile from sm — for 3-up grids). */
  layout?: "row" | "tile";
  badge?: ReactNode;
  className?: string;
  /** Optional id so error messages can reference the group. */
  describedBy?: string;
  /**
   * Roving tabindex for radio groups: pass `selected || nothing selected yet`, so Tab enters the group
   * once (on the checked option) and the arrow keys move within it, as WAI-ARIA specifies.
   */
  inTabOrder?: boolean;
}

const ARROW_DELTA: Partial<Record<string, number>> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

/** WAI-ARIA radiogroup keyboard support: arrow keys move focus and select. */
export function handleRadioKeys(e: KeyboardEvent<HTMLElement>) {
  const delta = ARROW_DELTA[e.key];
  if (delta === undefined) return;
  const radios = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
  const current = radios.findIndex((r) => r === document.activeElement);
  if (current < 0) return;
  e.preventDefault();
  const next = radios[(current + delta + radios.length) % radios.length];
  next.focus();
  next.click();
}

/**
 * Option card with a clear selected state (border, tint, glow, 3D icon and a
 * check indicator — never colour alone). Border width is constant so
 * selection never shifts layout.
 */
export function OptionCard({
  label,
  description,
  icon,
  selected,
  onSelect,
  mode = "radio",
  size = "md",
  layout = "row",
  badge,
  className,
  describedBy,
  inTabOrder = true,
}: OptionCardProps) {
  const check = (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-6 shrink-0 place-items-center border transition-[background-color,border-color,box-shadow] duration-200",
        mode === "radio" ? "rounded-full" : "rounded-lg",
        selected ? "border-transparent bg-select-icon text-white" : "border-blush-300 bg-white",
      )}
    >
      <Check className={cn("size-3.5 transition-transform duration-200", selected ? "scale-100" : "scale-0")} strokeWidth={3} />
    </span>
  );

  if (layout === "tile") {
    // Row on phones; stacked tile (check pinned top-right) from sm, for 3-up grids.
    return (
      <button
        type="button"
        role={mode}
        aria-checked={selected}
        aria-describedby={describedBy}
        tabIndex={inTabOrder ? 0 : -1}
        onClick={onSelect}
        className={cn(
          "group relative flex h-full w-full items-center gap-3 rounded-card border-[1.5px] px-3.5 py-2.5 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out focus-ring active:scale-[0.99] sm:flex-col sm:items-start sm:gap-2 sm:p-3 lg:p-3.5",
          selected ? "border-select-border bg-select-bg" : "border-card-border bg-white hover:border-hover-border hover:bg-hover-bg",
          className,
        )}
      >
        {icon && <Icon3D icon={icon} active={selected} size="sm" />}
        <span className="min-w-0 flex-1 sm:flex-none sm:pr-6">
          <span className="block text-body font-semibold leading-tight text-ink">{label}</span>
          {description && <span className="mt-1 block text-caption leading-snug text-ink-muted">{description}</span>}
        </span>
        <span className="shrink-0 sm:absolute sm:right-3 sm:top-3">{check}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role={mode}
      aria-checked={selected}
      aria-describedby={describedBy}
      tabIndex={inTabOrder ? 0 : -1}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-center gap-3.5 rounded-card border-[1.5px] text-left transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out focus-ring active:scale-[0.99]",
        size === "md" ? "min-h-[60px] px-3.5 py-2.5 sm:px-4 short:min-h-[52px] short:py-2" : "min-h-11 px-3.5 py-2 pointer-fine:min-h-10",
        selected ? "border-select-border bg-select-bg" : "border-card-border bg-white hover:border-hover-border hover:bg-hover-bg",
        className,
      )}
    >
      {icon && <Icon3D icon={icon} active={selected} size="sm" />}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={cn("font-semibold text-ink", size === "md" ? "text-body" : "text-body")}>{label}</span>
          {badge}
        </span>
        {description && <span className="mt-0.5 block text-body-sm leading-snug text-ink-muted">{description}</span>}
      </span>
      {check}
    </button>
  );
}
