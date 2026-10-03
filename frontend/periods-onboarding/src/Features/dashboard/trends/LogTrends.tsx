import { useCallback } from "react";
import { InfoCard } from "../../../Elements/infoCard/InfoCard";
import { useAsync } from "../../../hooks/useAsync";
import { addDays } from "../../../lib/isoDate";
import { localISODate } from "../../../services/cycle";
import { FLOWS, MOODS, SYMPTOMS, getLogRange, type DailyLog } from "../../../services/logs";
import { card } from "../../phases/shared";
import { fmtDate } from "../phases";
import { TrendChart, type ChartPoint } from "./TrendChart";

const WINDOW_DAYS = 90;
const avg = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;

function series(logs: DailyLog[], pick: (l: DailyLog) => number | null): ChartPoint[] {
  return logs.flatMap((l) => {
    const v = pick(l);
    return v === null ? [] : [{ key: l.date, label: fmtDate(l.date), value: v }];
  });
}

function counts<T extends string>(labels: readonly T[], values: (T | null)[]): ChartPoint[] {
  return labels
    .map((label) => ({ key: label, label, value: values.filter((v) => v === label).length }))
    .filter((p) => p.value > 0);
}

/** Charts built from what the user actually logged (last 90 days). Nothing is estimated or invented. */
export function LogTrends() {
  const today = localISODate();
  const start = addDays(today, -(WINDOW_DAYS - 1));
  const load = useCallback((s: AbortSignal) => getLogRange(start, today, s), [start, today]);
  const res = useAsync(load);

  if (res.status === "loading" && !res.data) return <p className="text-body text-ink-muted">Loading daily log trends…</p>;
  if (res.status === "error") {
    return (
      <InfoCard live>
        {res.error?.message ?? "Couldn't load your daily logs."}{" "}
        <button type="button" onClick={res.refetch} className="font-semibold underline">Try again</button>
      </InfoCard>
    );
  }

  const logs = res.data?.logs ?? [];
  if (logs.length === 0) {
    return <InfoCard>Daily log trends (pain, temperature, flow, mood, symptoms) appear once you start logging days.</InfoCard>;
  }

  const pain = series(logs, (l) => l.painScore);
  const bbt = series(logs, (l) => l.bbtCelsius);
  const flow = counts(FLOWS, logs.map((l) => l.flow));
  const mood = counts(MOODS, logs.map((l) => l.mood));
  const water = logs.flatMap((l) => (l.waterMl === null ? [] : [l.waterMl]));
  const symptomCounts = SYMPTOMS.map((s) => ({ label: s.label, n: logs.filter((l) => l.symptoms.includes(s.id)).length }))
    .filter((s) => s.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-heading font-semibold text-ink">From your daily log</h2>
        <p className="mt-0.5 text-body-sm text-ink-muted">
          {logs.length} {logs.length === 1 ? "day" : "days"} logged in the last {WINDOW_DAYS} days.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {pain.length > 0 && (
          <section className={card} aria-labelledby="lt-pain">
            <h3 id="lt-pain" className="text-body font-semibold text-ink">Pain score</h3>
            <p className="mb-3 mt-0.5 text-body-sm text-ink-muted">0 = none, 10 = worst</p>
            <TrendChart kind="line" unit="/ 10" average={avg(pain.map((p) => p.value))} points={pain} ariaLabel={`Pain score over ${pain.length} logged days`} />
          </section>
        )}
        {bbt.length > 0 && (
          <section className={card} aria-labelledby="lt-bbt">
            <h3 id="lt-bbt" className="text-body font-semibold text-ink">Basal body temperature</h3>
            <p className="mb-3 mt-0.5 text-body-sm text-ink-muted">°C, as you entered it</p>
            <TrendChart fine kind="line" unit="°C" points={bbt} ariaLabel={`Basal body temperature over ${bbt.length} logged days`} />
          </section>
        )}
        {flow.length > 0 && (
          <section className={card} aria-labelledby="lt-flow">
            <h3 id="lt-flow" className="text-body font-semibold text-ink">Flow</h3>
            <p className="mb-3 mt-0.5 text-body-sm text-ink-muted">Days logged at each level</p>
            <TrendChart kind="bar" unit="days" points={flow} ariaLabel="Days logged at each flow level" />
          </section>
        )}
        {mood.length > 0 && (
          <section className={card} aria-labelledby="lt-mood">
            <h3 id="lt-mood" className="text-body font-semibold text-ink">Mood</h3>
            <p className="mb-3 mt-0.5 text-body-sm text-ink-muted">Days logged for each mood</p>
            <TrendChart kind="bar" unit="days" points={mood} ariaLabel="Days logged for each mood" />
          </section>
        )}
      </div>

      {(symptomCounts.length > 0 || water.length > 0) && (
        <section className={card} aria-labelledby="lt-more">
          <h3 id="lt-more" className="text-body font-semibold text-ink">Symptoms & habits</h3>
          {symptomCounts.length > 0 && (
            <ul className="mt-3 grid gap-2 text-body text-ink-muted">
              {symptomCounts.map((s) => (
                <li key={s.label} className="flex justify-between gap-3 rounded-[14px] bg-blush-50 px-3.5 py-2">
                  <span className="text-ink">{s.label}</span>
                  <span>{s.n} {s.n === 1 ? "day" : "days"}</span>
                </li>
              ))}
            </ul>
          )}
          {water.length > 0 && <p className="mt-3 text-body text-ink-muted">Average water logged: {Math.round(avg(water))} ml on {water.length} {water.length === 1 ? "day" : "days"}.</p>}
        </section>
      )}
    </div>
  );
}
