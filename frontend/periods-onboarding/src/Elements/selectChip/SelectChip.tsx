import { Check, Plus } from "lucide-react";
import { cn } from "../../lib/cn";

interface SelectChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

/** Compact multi-select pill used for conditions, symptoms, moods and methods. */
export function SelectChip({ label, selected, onToggle }: SelectChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-body-sm font-medium transition-[background-color,border-color,box-shadow,color] duration-200 ease-out focus-ring pointer-fine:min-h-8 pointer-fine:px-3",
        selected
          ? "border-select-border bg-select-bg text-rose-ink"
          : "border-blush-300 bg-white text-ink-soft hover:border-rose/40 hover:bg-blush-50",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-[18px] place-items-center rounded-full transition-colors duration-200",
          selected ? "bg-select-icon text-white" : "bg-icon-bg text-rose-icon",
        )}
      >
        {selected ? <Check className="size-3" strokeWidth={3} /> : <Plus className="size-3" strokeWidth={2.5} />}
      </span>
      {label}
    </button>
  );
}
