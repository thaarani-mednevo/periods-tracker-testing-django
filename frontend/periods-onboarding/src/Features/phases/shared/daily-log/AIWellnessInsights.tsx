import { Sparkles } from 'lucide-react';
import type { CyclePhase } from '../../../../services/cycle';
import type { PhaseInsight } from '../../../../services/insights';
import { PHASE_SHORT } from './phaseCopy';
import { Emoji } from '../ui/Emoji';

const TIP_EMOJI = ['💧', '🚶‍♀️', '😴'];

interface AIWellnessInsightsProps {
  cycleDay: number | null;
  phase: CyclePhase;
  insight: PhaseInsight | null;
  loading: boolean;
}

export function AIWellnessInsights({ cycleDay, phase, insight, loading }: AIWellnessInsightsProps) {
  return (
    <section className="rounded-lu-card border border-lu-brand-line bg-gradient-to-b from-[#FDF2F8] to-white p-lu-card shadow-lu-card">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lu-body font-semibold text-lu-ink">
          <Sparkles className="h-4 w-4 text-lu-brand-strong" aria-hidden="true" />
          AI Wellness Insights
        </h2>
        <span className="text-lu-caption font-semibold text-[#4F46E5]">
          {PHASE_SHORT[phase]} Day {cycleDay ?? '–'}
        </span>
      </header>
      <p className="mt-3 text-lu-label text-lu-ink-soft">
        {loading ? 'Preparing your insight…' : (insight?.summary ?? "Your AI insight isn't available right now.")}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {(insight?.tips ?? []).map((tip, i) => (
          <li
            key={tip}
            className="inline-flex items-center gap-2 rounded-full border border-lu-line bg-white px-3 py-1.5 text-lu-caption font-semibold text-lu-ink shadow-lu-pill"
          >
            <Emoji symbol={TIP_EMOJI[i % TIP_EMOJI.length]} className="text-[13px]" />
            {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}
