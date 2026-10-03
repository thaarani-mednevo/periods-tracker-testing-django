import type { CycleState } from "../../services/cycle";
import { fmtDate, PHASES, type PhaseId } from "./phases";

interface PhaseTimelineProps {
  state: CycleState | null;
  onSelect?: (phase: PhaseId) => void;
}

/** Where she is in the cycle and when the next phase starts. Tap a phase to open it. */
export function PhaseTimeline({ state, onSelect }: PhaseTimelineProps) {
  if (!state || state.phase === "unknown") return null;
  const next = state.nextPhase;
  const nextLabel = next ? PHASES.find((p) => p.id === next.phase)?.label : undefined;

  return (
    <div className="mt-5 w-full rounded-[18px] bg-blush-50 p-3.5">
      <ol className="flex items-center gap-1.5" aria-label="Cycle phases">
        {PHASES.map((p) => {
          const active = p.id === state.phase;
          return (
            <li key={p.id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onSelect?.(p.id)}
                aria-current={active ? "step" : undefined}
                className={`w-full truncate rounded-full px-2 py-1 text-center text-caption font-semibold ${
                  active ? "bg-rose text-white" : "bg-white text-ink-muted"
                }`}
              >
                {p.label}
              </button>
            </li>
          );
        })}
      </ol>
      {next && nextLabel && (
        <p className="mt-2.5 text-caption font-medium text-ink-muted">
          Next: <span className="font-bold text-ink">{nextLabel}</span>{" "}
          {next.daysUntil === 1 ? "tomorrow" : `in ${next.daysUntil} days`} · {fmtDate(next.startDate)}
        </p>
      )}
    </div>
  );
}