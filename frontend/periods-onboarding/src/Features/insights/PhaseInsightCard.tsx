import { Sparkles } from "lucide-react";
import { Icon3D } from "../../Elements/icon3D/Icon3D";
import { InfoCard } from "../../Elements/infoCard/InfoCard";
import { useAsync } from "../../hooks/useAsync";
import { getPhaseInsight } from "../../services/insights";
import { card } from "../phases/shared";

const load = (signal: AbortSignal) => getPhaseInsight(signal);

/** AI explanation of the current phase. The phase and dates come from the engine; the model only explains them. */
export function PhaseInsightCard() {
  const insight = useAsync(load);

  if (insight.status === "loading") {
    return (
      <section className={card} aria-busy="true">
        <p className="text-body text-ink-muted">Preparing your phase insight…</p>
      </section>
    );
  }

  const res = insight.data;
  if (insight.status === "error" || !res || res.status === "unavailable") {
    return (
      <InfoCard>
        The AI insight isn't available right now.{" "}
        <button type="button" onClick={insight.refetch} className="font-semibold underline">
          Try again
        </button>
      </InfoCard>
    );
  }
  if (res.status === "no_phase" || !res.insight) return null;

  return (
    <section className={card} aria-labelledby="phase-insight">
      <div className="flex items-start gap-3.5">
        <Icon3D icon={Sparkles} size="md" />
        <div className="min-w-0">
          <h2 id="phase-insight" className="text-heading font-semibold text-ink">What this phase means for you</h2>
          <p className="mt-1.5 text-body text-ink-muted">{res.insight.summary}</p>
        </div>
      </div>
      {res.insight.tips.length > 0 && (
        <ul className="mt-4 grid gap-2 md:grid-cols-3">
          {res.insight.tips.map((tip) => (
            <li key={tip} className="rounded-[18px] bg-blush-50 p-3.5 text-body-sm text-ink">
              {tip}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-caption text-ink-muted">AI-generated general wellness information, not medical advice.</p>
    </section>
  );
}
