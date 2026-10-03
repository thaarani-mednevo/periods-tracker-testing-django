import { ArrowLeft, ArrowRight, ListChecks, Sparkles } from "lucide-react";
import { cn } from "../../lib/cn";

interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  /** When editing from Review, offer a shortcut straight back. */
  onReturnToReview?: () => void;
  errorSummary?: string;
}

export const primaryBtn =
  "group inline-flex min-h-12 short:min-h-11 items-center justify-center gap-2 rounded-[18px] bg-brand px-7 text-lead font-semibold text-white shadow-glow transition-[filter,box-shadow,transform] duration-200 ease-out hover:brightness-[1.03] hover:shadow-[0_6px_16px_rgb(244_90_155/0.16)] active:scale-[0.99] focus-ring disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-none disabled:bg-[#F3E6EB] disabled:text-ink-muted disabled:shadow-none";

export const secondaryBtn =
  "inline-flex min-h-12 short:min-h-11 items-center justify-center gap-2 rounded-[18px] border border-select-border bg-white px-6 text-lead font-semibold text-rose-ink transition-[background-color,border-color] duration-200 ease-out hover:border-hover-border hover:bg-hover-bg active:scale-[0.99] focus-ring";

export function NavigationButtons({ onBack, onNext, isFirst, isLast, onReturnToReview, errorSummary }: NavigationButtonsProps) {
  return (
    // Bottom row of the fixed onboarding screen — always in view, never covering content.
    <div className="shrink-0 border-t border-line/70 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:border-0 sm:pb-4 sm:pt-4 short:pb-2.5 short:pt-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        {/* Inline with the buttons on desktop so an error never pushes them around. */}
        <p aria-live="polite" className={cn("text-body-sm font-medium text-rose-ink sm:mr-auto sm:max-w-[45%]", !errorSummary && "sr-only")}>
          {errorSummary}
        </p>
        <div className="flex items-center gap-3">
          {/* Desktop/tablet only. max-sm:hidden (a variant) wins over secondaryBtn's inline-flex; plain `hidden` did not. */}
          {onReturnToReview && !isLast && (
            <button type="button" onClick={onReturnToReview} className={cn(secondaryBtn, "border-blush-300 max-sm:hidden")}>
              <ListChecks className="size-[18px]" aria-hidden="true" />
              Save &amp; review
            </button>
          )}
          {!isFirst && (
            <button type="button" onClick={onBack} className={cn(secondaryBtn, "px-4 sm:min-w-[150px] sm:px-6")}>
              <ArrowLeft className="size-[18px]" aria-hidden="true" />
              <span>Back</span>
            </button>
          )}
          {/* On narrow phones the final label steps down to text-body with tighter padding (and drops its
              decorative icon below 360px) so "Set Up My Tracker" stays on one line. */}
          <button
            type="button"
            onClick={onNext}
            className={cn(primaryBtn, "flex-1 sm:min-w-[190px] sm:flex-none", isLast && "max-[399px]:px-4 max-[399px]:text-body")}
          >
            {isLast ? (
              <>
                <Sparkles className="size-[18px] max-[359px]:hidden" aria-hidden="true" />
                Set Up My Tracker
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="size-[18px] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
      {onReturnToReview && !isLast && (
        <button
          type="button"
          onClick={onReturnToReview}
          className="mt-1 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl text-body font-semibold text-rose-ink focus-ring sm:hidden"
        >
          <ListChecks className="size-4" aria-hidden="true" />
          Save &amp; return to review
        </button>
      )}
    </div>
  );
}
