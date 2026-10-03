// frontend/periods-onboarding/src/Features/insights/InsightCharts.tsx
// Chart primitives ported from the trend-analysis reference (LineChart, BarChart, RingGauge, Heatmap).
// Everything is plain SVG, no chart library. Every chart receives only values the user actually logged.
import { useCallback, useId, useRef, useState, type ReactNode } from "react";

// ---------------------------------------------------------------- shared types / helpers
export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
interface Point {
  x: number;
  y: number;
}
export interface ReferenceLine {
  value: number;
  color: string;
  label?: string;
}
export interface ChartMarker {
  index: number;
  label: string;
  color: string;
}
type Gradient = [string, string];

const AXIS_COLOR = "#9d9bb2";
const GRID_COLOR = "#eee9f5";
const DEFAULT_MARGIN: Margin = { top: 14, right: 14, bottom: 28, left: 40 };

const scaleLinear = (domain: [number, number], range: [number, number]) => (value: number) =>
  range[0] + ((value - domain[0]) / (domain[1] - domain[0] || 1)) * (range[1] - range[0]);

/** Monotone cubic interpolation: smooth like the design, never overshoots the data. */
function monotonePath(points: Point[]): string {
  const first = points[0];
  if (!first) return "";
  const n = points.length;
  if (n === 1) return `M${first.x} ${first.y}`;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    slopes.push(a && b && b.x !== a.x ? (b.y - a.y) / (b.x - a.x) : 0);
  }
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0] ?? 0;
    if (i === n - 1) return slopes[n - 2] ?? 0;
    const prev = slopes[i - 1] ?? 0;
    const next = slopes[i] ?? 0;
    return prev * next <= 0 ? 0 : (2 * prev * next) / (prev + next);
  });
  let d = `M${first.x} ${first.y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) continue;
    const dx = (b.x - a.x) / 3;
    d += ` C${a.x + dx} ${a.y + dx * (tangents[i] ?? 0)} ${b.x - dx} ${b.y - dx * (tangents[i + 1] ?? 0)} ${b.x} ${b.y}`;
  }
  return d;
}

const linearPath = (points: Point[]) => points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

/** Indices of x labels to show so they never overlap. */
function visibleLabelIndexes(labels: string[], plotWidth: number): Set<number> {
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 1);
  const labelWidth = longest * 6.4 + 14;
  const slot = labels.length > 1 ? plotWidth / (labels.length - 1) : plotWidth;
  const step = Math.max(1, Math.ceil(labelWidth / slot));
  return new Set(labels.map((_, i) => i).filter((i) => i % step === 0));
}

/** Rounded y-axis domain + 5 ticks around the data, so a real series never sits flat or off-chart. */
export function niceScale(values: number[], opts: { floor?: number; ceil?: number; minSpan?: number; step?: number } = {}) {
  const { floor, ceil, minSpan = 4, step } = opts;
  if (values.length === 0) return { domain: [0, 4] as [number, number], ticks: [0, 1, 2, 3, 4] };
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < minSpan) {
    const mid = (hi + lo) / 2;
    lo = mid - minSpan / 2;
    hi = mid + minSpan / 2;
  }
  const pad = (hi - lo) * 0.15;
  lo = Math.floor(lo - pad);
  hi = Math.ceil(hi + pad);
  if (floor !== undefined) lo = Math.max(lo, floor);
  if (ceil !== undefined) hi = Math.min(hi, ceil);
  const s = step ?? Math.max(1, Math.ceil((hi - lo) / 4));
  hi = lo + s * 4;
  return { domain: [lo, hi] as [number, number], ticks: [0, 1, 2, 3, 4].map((i) => lo + i * s) };
}

/** Callback ref + observed content width, so SVG charts always fit their card. */
function useElementWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);
  const ref = useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;
    setWidth(Math.round(node.getBoundingClientRect().width));
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);
  return [ref, width] as const;
}

// ---------------------------------------------------------------- axes
function YAxisGrid({ ticks, left, right, toY, format }: { ticks: number[]; left: number; right: number; toY: (v: number) => number; format: (v: number) => string }) {
  return (
    <g fill={AXIS_COLOR}>
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={left} x2={right} y1={toY(tick)} y2={toY(tick)} stroke={GRID_COLOR} />
          <text x={left - 10} y={toY(tick)} textAnchor="end" dominantBaseline="middle">
            {format(tick)}
          </text>
        </g>
      ))}
    </g>
  );
}

function XLabels({ labels, visible, toX, y }: { labels: string[]; visible: Set<number>; toX: (i: number) => number; y: number }) {
  return (
    <g fill={AXIS_COLOR} textAnchor="middle">
      {labels.map((label, i) =>
        visible.has(i) ? (
          <text key={`${label}-${i}`} x={toX(i)} y={y}>
            {label}
          </text>
        ) : null,
      )}
    </g>
  );
}

function ReferenceLines({ lines, left, right, toY }: { lines: ReferenceLine[]; left: number; right: number; toY: (v: number) => number }) {
  return (
    <g>
      {lines.map((line, i) => {
        const y = toY(line.value);
        return (
          <g key={`${line.value}-${i}`}>
            <line x1={left} x2={right} y1={y} y2={y} stroke={line.color} strokeDasharray="4 4" strokeWidth="1.2" />
            {line.label && (
              <text x={right - 2} y={y - 6} textAnchor="end" fill={AXIS_COLOR} stroke="#fff" strokeWidth={3} paintOrder="stroke">
                {line.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function Markers({ markers, toX, top, bottom }: { markers: ChartMarker[]; toX: (i: number) => number; top: number; bottom: number }) {
  return (
    <g>
      {markers.map((m) => (
        <g key={m.label}>
          <line x1={toX(m.index)} x2={toX(m.index)} y1={top} y2={bottom} stroke={m.color} strokeDasharray="3 3" strokeWidth="1.2" />
          <text x={toX(m.index)} y={top - 6} textAnchor="middle" fontWeight="600" fill={m.color}>
            {m.label}
          </text>
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------- line chart
export interface LineSeries {
  id: string;
  color: string;
  values: number[];
  dashed?: boolean;
  fill?: boolean;
  dots?: "all" | "last" | "none";
  lastDotColor?: string;
}

export function LineChart({
  series,
  xLabels,
  yDomain,
  yTicks,
  height = 250,
  ariaLabel,
  formatY = String,
  markers = [],
  referenceLines = [],
  curve = "smooth",
  margin: marginOverride,
}: {
  series: LineSeries[];
  xLabels: string[];
  yDomain: [number, number];
  yTicks: number[];
  height?: number;
  ariaLabel: string;
  formatY?: (value: number) => string;
  markers?: ChartMarker[];
  referenceLines?: ReferenceLine[];
  curve?: "smooth" | "linear";
  margin?: Partial<Margin>;
}) {
  const uid = useId();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const margin = { ...DEFAULT_MARGIN, ...(markers.length > 0 ? { top: 26 } : null), ...marginOverride };
  const plotLeft = margin.left;
  const plotRight = Math.max(plotLeft + 10, width - margin.right);
  const plotTop = margin.top;
  const plotBottom = height - margin.bottom;
  const count = xLabels.length;
  const toX = (i: number) => (count <= 1 ? (plotLeft + plotRight) / 2 : plotLeft + (i * (plotRight - plotLeft)) / (count - 1));
  const toY = scaleLinear(yDomain, [plotBottom, plotTop]);
  const buildPath = curve === "smooth" ? monotonePath : linearPath;
  const visible = visibleLabelIndexes(xLabels, plotRight - plotLeft);

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible text-[10px] xl:text-[11px]">
          <defs>
            {series.map(
              (s) =>
                s.fill && (
                  <linearGradient key={s.id} id={`${uid}-fill-${s.id}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
                  </linearGradient>
                ),
            )}
          </defs>
          <YAxisGrid ticks={yTicks} left={plotLeft} right={plotRight} toY={toY} format={formatY} />
          <XLabels labels={xLabels} visible={visible} toX={toX} y={plotBottom + 20} />
          <ReferenceLines lines={referenceLines} left={plotLeft} right={plotRight} toY={toY} />
          <Markers markers={markers} toX={toX} top={plotTop} bottom={plotBottom} />
          {series.map((s) => {
            const points: Point[] = s.values.map((v, i) => ({ x: toX(i), y: toY(v) }));
            const path = buildPath(points);
            const first = points[0];
            const last = points[points.length - 1];
            return (
              <g key={s.id}>
                {s.fill && first && last && <path d={`${path} L${last.x} ${plotBottom} L${first.x} ${plotBottom} Z`} fill={`url(#${uid}-fill-${s.id})`} />}
                <path d={path} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dashed ? "5 4" : undefined} />
                {points.map((p, i) => {
                  const isLast = i === points.length - 1;
                  const showDot = s.dots === "all" || (s.dots === "last" && isLast) || points.length === 1;
                  if (!showDot) return null;
                  const emphasised = isLast && s.lastDotColor !== undefined;
                  return <circle key={i} cx={p.x} cy={p.y} r={emphasised ? 5 : 3.4} fill={isLast && s.lastDotColor ? s.lastDotColor : s.color} stroke="#fff" strokeWidth="1.6" />;
                })}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- bar chart
export function BarChart({
  values,
  labels,
  yDomain,
  yTicks,
  height = 250,
  ariaLabel,
  gradient,
  highlightIndex,
  highlightGradient,
  referenceLines = [],
  formatY = String,
}: {
  values: number[];
  labels: string[];
  yDomain: [number, number];
  yTicks: number[];
  height?: number;
  ariaLabel: string;
  gradient: Gradient;
  highlightIndex?: number;
  highlightGradient?: Gradient;
  referenceLines?: ReferenceLine[];
  formatY?: (value: number) => string;
}) {
  const uid = useId();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const margin = DEFAULT_MARGIN;
  const plotLeft = margin.left;
  const plotRight = Math.max(plotLeft + 10, width - margin.right);
  const plotTop = margin.top;
  const plotBottom = height - margin.bottom;
  const band = (plotRight - plotLeft) / Math.max(values.length, 1);
  const barWidth = Math.min(band * 0.56, 34);
  const toX = (i: number) => plotLeft + band * i + band / 2;
  const toY = scaleLinear(yDomain, [plotBottom, plotTop]);
  const visible = visibleLabelIndexes(labels, plotRight - plotLeft - band);
  const radius = Math.min(6, barWidth / 2);

  return (
    <div ref={ref} className="w-full">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible text-[10px] xl:text-[11px]">
          <defs>
            <linearGradient id={`${uid}-base`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
            {highlightGradient && (
              <linearGradient id={`${uid}-highlight`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={highlightGradient[0]} />
                <stop offset="100%" stopColor={highlightGradient[1]} />
              </linearGradient>
            )}
          </defs>
          <YAxisGrid ticks={yTicks} left={plotLeft} right={plotRight} toY={toY} format={formatY} />
          <XLabels labels={labels} visible={visible} toX={toX} y={plotBottom + 20} />
          {values.map((value, i) => {
            const top = toY(value);
            const x = toX(i) - barWidth / 2;
            const h = Math.max(plotBottom - top, 0);
            const fill = highlightGradient && highlightIndex === i ? "highlight" : "base";
            return (
              <path
                key={`${labels[i] ?? i}-${i}`}
                d={`M${x} ${plotBottom} V${top + radius} Q${x} ${top} ${x + radius} ${top} H${x + barWidth - radius} Q${x + barWidth} ${top} ${x + barWidth} ${top + radius} V${plotBottom} Z`}
                fill={`url(#${uid}-${fill})`}
                opacity={h > 0 ? 1 : 0}
              />
            );
          })}
          <ReferenceLines lines={referenceLines} left={plotLeft} right={plotRight} toY={toY} />
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- ring gauge
export function RingGauge({
  value,
  max = 100,
  size,
  strokeWidth,
  gradient,
  trackColor,
  ariaLabel,
  children,
  innerFill = "transparent",
}: {
  value: number;
  max?: number;
  size: number;
  strokeWidth: number;
  gradient: Gradient;
  trackColor: string;
  ariaLabel: string;
  children?: ReactNode;
  innerFill?: string;
}) {
  const uid = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value / max, 0), 1);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={ariaLabel} className="-rotate-90">
        <defs>
          <linearGradient id={uid} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius - strokeWidth / 2} fill={innerFill} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`url(#${uid})`} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${circumference * progress} ${circumference}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------- symptom heatmap
const HEAT_COLORS = ["#f1eefb", "#d8ccfa", "#b2a0f4", "#8c70ec", "#5a33d4"] as const;
export const HEAT_LEVELS = ["None", "Logged"] as const;

export function HeatmapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8A92A6] xl:text-xs">
      <span>Symptom</span>
      {HEAT_LEVELS.map((label, i) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ backgroundColor: HEAT_COLORS[i === 0 ? 0 : 3] }} />
          {label}
        </span>
      ))}
    </div>
  );
}

/** `levels` per column: 0 = not logged, 1 = logged. */
export function SymptomHeatmap({ rows, columnLabels }: { rows: { symptom: string; levels: number[] }[]; columnLabels: string[] }) {
  return (
    <div
      role="img"
      aria-label={`Heatmap of the symptoms you logged across the last ${columnLabels.length} days`}
      className="grid gap-[3px] sm:gap-1.5"
      style={{ gridTemplateColumns: `minmax(58px, 118px) repeat(${columnLabels.length}, minmax(0, 1fr))` }}
    >
      <span aria-hidden="true" />
      {columnLabels.map((label, i) => (
        <span key={`${label}-${i}`} aria-hidden="true" className="pb-1 text-center text-[10px] text-[#8A92A6] xl:text-[11px]">
          {label}
        </span>
      ))}
      {rows.map((row) => (
        <div key={row.symptom} className="contents">
          <span aria-hidden="true" className="flex items-center truncate pr-2 text-[11px] font-medium text-[#17152B] xl:text-xs">
            <span className="truncate">{row.symptom}</span>
          </span>
          {row.levels.map((level, i) => (
            <span key={`${columnLabels[i] ?? i}-${i}`} aria-hidden="true" className="h-6 rounded-[5px] sm:h-7 sm:rounded-lg" style={{ backgroundColor: HEAT_COLORS[level > 0 ? 3 : 0] }} />
          ))}
        </div>
      ))}
    </div>
  );
}