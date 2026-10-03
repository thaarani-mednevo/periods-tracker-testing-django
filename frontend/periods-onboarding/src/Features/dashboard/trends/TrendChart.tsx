export interface ChartPoint {
  key: string | number;
  label: string;
  value: number;
}

interface TrendChartProps {
  points: ChartPoint[];
  kind: "line" | "bar";
  /** Shown in tooltips and the accessible description, e.g. "days". */
  unit: string;
  /** Dashed reference line. */
  average?: number | null;
  ariaLabel: string;
  /** One-decimal axis for small ranges such as body temperature. */
  fine?: boolean;
}

const W = 600;
const H = 230;
const PAD = { l: 42, r: 14, t: 18, b: 34 };

function scale(values: number[], kind: "line" | "bar", fine: boolean) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (fine) {
    const min = Math.floor((lo - 0.2) * 10) / 10;
    let max = Math.ceil((hi + 0.2) * 10) / 10;
    if (max - min < 0.4) max = Math.round((min + 0.4) * 10) / 10;
    const step = Math.max(0.1, Math.ceil(((max - min) / 4) * 10) / 10);
    const ticks: number[] = [];
    for (let v = min; ; v += step) {
      const r = Math.round(v * 10) / 10;
      ticks.push(r);
      if (r >= max - 1e-9) break;
    }
    return { min, max: ticks[ticks.length - 1], ticks };
  }
  const min = kind === "bar" ? 0 : Math.max(0, Math.floor(lo - 2));
  let max = Math.ceil(hi + (kind === "bar" ? 1 : 2));
  if (max - min < 4) max = min + 4;
  const step = Math.max(1, Math.ceil((max - min) / 4));
  max = min + step * Math.ceil((max - min) / step);
  const ticks: number[] = [];
  for (let v = min; v <= max; v += step) ticks.push(v);
  return { min, max, ticks };
}

/** Dependency-free SVG chart (line or bar) in the app's colour tokens. */
export function TrendChart({ points, kind, unit, average, ariaLabel, fine = false }: TrendChartProps) {
  const n = points.length;
  if (n === 0) return null;

  const { min, max, ticks } = scale(points.map((p) => p.value), kind, fine);
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const y = (v: number) => PAD.t + innerH - ((v - min) / (max - min)) * innerH;
  const x = (i: number) =>
    kind === "bar" ? PAD.l + (innerW / n) * (i + 0.5) : n === 1 ? PAD.l + innerW / 2 : PAD.l + (innerW * i) / (n - 1);
  const labelEvery = n <= 8 ? 1 : Math.ceil(n / 6);
  const barW = Math.min(36, (innerW / n) * 0.6);
  const tick = (t: number) => (fine ? t.toFixed(1) : String(t));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="h-auto w-full min-w-[480px]">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} className="fill-ink-muted">
              {tick(t)}
            </text>
          </g>
        ))}

        {average != null && average >= min && average <= max && (
          <g>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(average)} y2={y(average)} className="stroke-ink-muted" strokeWidth={1} strokeDasharray="5 4" />
            <text x={W - PAD.r} y={y(average) - 5} textAnchor="end" fontSize={11} className="fill-ink-muted">
              avg {average}
            </text>
          </g>
        )}

        {kind === "line" && n > 1 && (
          <polyline
            points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}
            fill="none"
            className="stroke-rose"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {points.map((p, i) => (
          <g key={p.key}>
            {kind === "bar" ? (
              <>
                <rect x={x(i) - barW / 2} y={y(p.value)} width={barW} height={Math.max(y(min) - y(p.value), 0)} rx={5} className="fill-rose-light">
                  <title>{`${p.label}: ${p.value} ${unit}`}</title>
                </rect>
                {n <= 12 && (
                  <text x={x(i)} y={y(p.value) - 5} textAnchor="middle" fontSize={11} className="fill-ink">
                    {p.value}
                  </text>
                )}
              </>
            ) : (
              <circle cx={x(i)} cy={y(p.value)} r={i === n - 1 ? 5 : 3.5} className="fill-white stroke-rose" strokeWidth={2.5}>
                <title>{`${p.label}: ${p.value} ${unit}`}</title>
              </circle>
            )}
            {i % labelEvery === 0 && (
              <text x={x(i)} y={H - 10} textAnchor="middle" fontSize={11} className="fill-ink-muted">
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
