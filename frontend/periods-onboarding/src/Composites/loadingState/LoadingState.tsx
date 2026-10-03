import { useEffect, useState } from "react";
import { CycleOrb } from "../visuals/cycleOrb/CycleOrb";

const MESSAGES = [
  "Personalizing your tracker...",
  "Analyzing your preferences...",
  "Preparing your cycle dashboard...",
] as const;

const STAGE_MS = 1100;

/** Short futuristic loading sequence; calls onDone after the last stage. */
export function LoadingState({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    const timers = [
      setTimeout(() => setProgress(34), 60),
      setTimeout(() => { setStage(1); setProgress(68); }, STAGE_MS),
      setTimeout(() => { setStage(2); setProgress(100); }, STAGE_MS * 2),
      setTimeout(onDone, STAGE_MS * 3),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <section className="glass mx-auto flex min-h-[560px] max-w-2xl animate-fade-in flex-col items-center justify-center rounded-[32px] px-6 py-12 text-center" aria-busy="true">
      <div className="scale-[0.8] sm:scale-100">
        <CycleOrb size={180} progress={progress} />
      </div>
      <p className="mt-6 text-body font-bold tabular-nums text-rose-ink">{progress}%</p>
      <p key={stage} role="status" aria-live="polite" className="mt-2 animate-fade-up text-section font-semibold tracking-tight text-ink">
        {MESSAGES[stage]}
      </p>
      <ol className="mt-6 flex gap-2" aria-hidden="true">
        {MESSAGES.map((m, i) => (
          <li key={m} className={`h-1.5 rounded-full transition-all duration-500 ${i <= stage ? "w-10 bg-brand" : "w-4 bg-blush-200"}`} />
        ))}
      </ol>
    </section>
  );
}
