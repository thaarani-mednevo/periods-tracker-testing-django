import { ArrowDownRight, ArrowUpRight, CircleCheck } from "lucide-react";
import { cn } from "../../lib/cn";
import type { FeedbackTone } from "../../types";

/** Calm, non-alarming range indicator (icon + text, never colour alone). */
export function FeedbackBadge({ tone, label }: { tone: FeedbackTone; label: string }) {
  const Icon = tone === "typical" ? CircleCheck : tone === "short" ? ArrowDownRight : ArrowUpRight;
  return (
    <span
      key={label}
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex animate-scale-in items-center gap-1.5 rounded-full border px-3 py-1.5 text-body-sm font-semibold",
        tone === "typical" ? "border-blush-300 bg-blush-50 text-rose-ink" : "border-peach-border bg-peach-50 text-coral-ink",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </span>
  );
}
