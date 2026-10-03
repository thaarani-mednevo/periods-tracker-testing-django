// frontend/periods-onboarding/src/Features/insights/InsightsPage.tsx
// Insights page in the trend-analysis design, shared by every phase.
// Rule: nothing is invented. Each card plots only what the user logged (daily log + period history);
// the numbers on screen are plain maths over that data. Ava's text comes from the existing /insights/phase API.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Activity, Download, Droplet, Eye, Heart, Maximize2, Moon, Sparkles, Target, Thermometer, TrendingDown, TrendingUp, X } from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { useCycleHistory } from "../../hooks/useCycleHistory";
import { addDays, parseIso } from "../../lib/isoDate";
import { localISODate, type CycleState } from "../../services/cycle";
import { getPhaseInsight } from "../../services/insights";
import { SYMPTOMS, getLogRange, type DailyLog } from "../../services/logs";
import { fmtDate } from "../dashboard/phases";
import { downloadCsv } from "../dashboard/trends/csv";
import { cyclePoints, periodPoints, stats } from "../dashboard/trends/trendStats";
import { fertileWindow } from "../phases/ovulation/fertility";
import { DEFAULT_STEP_GOAL, WATER_TARGET_ML } from "../phases/shared/daily-log/constants";
import moodCalm from "../../assets/phases/follicular/mood_calm.png";
import moodHappy from "../../assets/phases/follicular/mood_happy.png";
import moodIrritable from "../../assets/phases/follicular/mood_irritable.png";
import moodNeutral from "../../assets/phases/follicular/mood_neutral.png";
import moodSad from "../../assets/phases/follicular/mood_sad.png";
import { BarChart, HeatmapLegend, LineChart, RingGauge, SymptomHeatmap, niceScale } from "./InsightCharts";

// ---------------------------------------------------------------- constants
const PURPLE = "#6C4DE8";
const PINK = "#F34F97";
const CARD = "rounded-[28px] border border-[#F1DDE8] bg-white shadow-[0_10px_34px_-12px_rgb(190_120_220/0.22)]";

type Category = "cycle" | "symptoms" | "fertility" | "lifestyle" | "hormones";
type Filter = "all" | Category;
type Tint = "pink" | "purple" | "blue" | "green" | "orange" | "red";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All Metrics" },
  { id: "cycle", label: "Cycle" },
  { id: "symptoms", label: "Symptoms" },
  { id: "fertility", label: "Fertility" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "hormones", label: "Hormones" },
];
const WINDOWS = [7, 14, 30, 90] as const;
const TINTS: Record<Tint, string> = { pink: "#FFF0F6", purple: "#ece6ff", blue: "#e3f0ff", green: "#dff7e9", orange: "#ffefdc", red: "#ffe6e6" };

const FLOW_LEVEL = { Spotting: 1, Light: 2, Medium: 3, Heavy: 4 } as const;
const FLOW_NAMES = ["None", "Spot", "Light", "Med", "Heavy"];
const MOOD_SCORE = { Sad: 1, Irritable: 2, Neutral: 3, Calm: 4, Happy: 5 } as const;
const SLEEP_SCORE = { Poor: 1, Fair: 2, Good: 3, Excellent: 4 } as const;
const SLEEP_NAMES = ["", "Poor", "Fair", "Good", "Excellent"];
const LH_SCORE = { Negative: 0, Low: 1, High: 2, Peak: 3 } as const;
const LH_NAMES = ["Neg", "Low", "High", "Peak"];
const MOOD_FACES = [
  { label: "Sad", src: moodSad },
  { label: "Irritable", src: moodIrritable },
  { label: "Neutral", src: moodNeutral },
  { label: "Calm", src: moodCalm },
  { label: "Happy", src: moodHappy },
];

// ---------------------------------------------------------------- small helpers
const round1 = (n: number) => Math.round(n * 10) / 10;
const mean = (a: number[]) => (a.length ? round1(a.reduce((s, v) => s + v, 0) / a.length) : null);
const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const diffDays = (from: string, to: string) => Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86_400_000);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const signed = (n: number, digits = 1) => `${n > 0 ? "+" : ""}${n.toFixed(digits)}`;
/** Latest value minus the average of the earlier ones; null with fewer than 2 values. */
const changeOf = (values: number[]) => (values.length < 2 ? null : (values[values.length - 1] ?? 0) - (mean(values.slice(0, -1)) ?? 0));

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

// ---------------------------------------------------------------- view pieces
function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-[#17152B]">{children}</strong>;
}

function Legend({ items, children }: { items: { label: string; color: string; dashed?: boolean }[]; children?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#8A92A6] xl:text-xs">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={item.dashed ? "h-0 w-3 border-t-2 border-dashed" : "size-2 rounded-full"}
            style={item.dashed ? { borderColor: item.color } : { backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
      {children}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="grid min-h-[140px] flex-1 place-items-center rounded-2xl border border-dashed border-[#F1DDE8] bg-white/70 p-4 text-center text-xs text-[#8A92A6] md:text-[13px]">{children}</p>;
}

interface CardSpec {
  id: string;
  title: string;
  subtitle: string;
  categories: Category[];
  tint: Tint;
  insight: string;
  insightTitle?: string;
  fullWidth?: boolean;
  csv: () => (string | number)[][];
  render: (height: number) => ReactNode;
}

function TrendCard({ spec, onExpand }: { spec: CardSpec; onExpand: () => void }) {
  const action = "grid size-11 place-items-center rounded-full text-[#8A92A6] transition-colors hover:bg-[#f1edff] hover:text-[#6C4DE8]";
  return (
    <article className={`${CARD} relative flex min-w-0 flex-col overflow-hidden p-5 sm:p-6 ${spec.fullWidth ? "md:col-span-2 xl:col-span-3" : ""}`}>
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 100% 0%, ${TINTS[spec.tint]} 0%, transparent 55%)` }} aria-hidden="true" />
      <div className="relative flex flex-1 flex-col">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-[#17152B] md:text-[15px] xl:text-base">{spec.title}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f1edff] px-2 py-0.5 text-[10px] font-semibold text-[#6C4DE8] xl:text-[11px]">
                <Sparkles className="size-2.5" aria-hidden="true" />
                Insight
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#8A92A6] md:text-xs">{spec.subtitle}</p>
          </div>
          <div className="-mt-2.5 -mr-3.5 -mb-2 flex shrink-0 items-center">
            <button type="button" onClick={() => downloadCsv(`${slug(spec.title)}.csv`, spec.csv())} aria-label={`Download ${spec.title} data`} className={action}>
              <Download className="size-[15px]" aria-hidden="true" />
            </button>
            <button type="button" onClick={onExpand} aria-label={`Expand ${spec.title}`} className={action}>
              <Maximize2 className="size-[15px]" aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="mt-3 flex flex-1 flex-col">{spec.render(250)}</div>
        <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-[#f1edff]/70 p-3 text-xs text-[#68708A] md:text-[13px]">
          <span className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-white text-[#6C4DE8]" aria-hidden="true">
            <Sparkles className="size-3" />
          </span>
          <span>
            {spec.insightTitle && <strong className="block font-semibold text-[#17152B]">{spec.insightTitle}</strong>}
            {spec.insight}
          </span>
        </p>
      </div>
    </article>
  );
}

function Overlay({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);

  // Lock the page behind the dialog while it is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Portal to <body>: an ancestor with a CSS animation/transform turns `fixed` into "fixed inside that ancestor",
  // which pushed the dialog far down the page.
  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#17152B]/40 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={label} className="relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-5 shadow-[0_24px_60px_-16px_rgb(80_40_140/0.35)] sm:p-7">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-[#8A92A6] hover:bg-[#f1edff] hover:text-[#6C4DE8]">
          <X className="size-4" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- page
export function InsightsPage({ state, day }: { state: CycleState; day?: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [windowDays, setWindowDays] = useState<(typeof WINDOWS)[number]>(30);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const end = day ?? state.date ?? localISODate();
  const start = addDays(end, -(windowDays - 1));
  const history = useCycleHistory();
  const logsReq = useAsync(useCallback((signal: AbortSignal) => getLogRange(start, end, signal), [start, end]));
  const insightReq = useAsync(useCallback((signal: AbortSignal) => getPhaseInsight(end, signal), [end]));

  const periods = useMemo(() => history.data ?? [], [history.data]);
  const logs = useMemo<DailyLog[]>(() => logsReq.data?.logs ?? [], [logsReq.data]);

  const cycles = useMemo(() => cyclePoints(periods, "12"), [periods]);
  const lengths = useMemo(() => periodPoints(periods, "12"), [periods]);
  const cs = useMemo(() => stats(cycles), [cycles]);
  const ps = useMemo(() => stats(lengths), [lengths]);

  /** Logged values only, oldest first: one entry per day that has data. */
  const series = (pick: (l: DailyLog) => number | null) => {
    const rows = logs.flatMap((l) => {
      const v = pick(l);
      return v === null || v === undefined ? [] : [{ date: l.date, v }];
    });
    return { labels: rows.map((r) => fmtDate(r.date)), values: rows.map((r) => r.v), dates: rows.map((r) => r.date) };
  };
  const rowsCsv = (header: string[], labels: string[], ...cols: number[][]) => [header, ...labels.map((label, i) => [label, ...cols.map((c) => c[i] ?? "")])];

  // ---- health score (transparent: only three factors, all from logged data)
  const regularity = cs.sd === null ? null : Math.round(clamp(100 - cs.sd * 8));
  const periodFit = ps.mean === null ? null : Math.round(clamp(100 - (ps.mean < 3 ? 3 - ps.mean : ps.mean > 7 ? ps.mean - 7 : 0) * 20));
  const trackedDays = logs.length;
  const tracking = Math.round(clamp((trackedDays / windowDays) * 100));
  const factors = [
    { id: "regularity", label: "Cycle Regularity", weight: 40, score: regularity, description: "How steady your cycle length is across your logged periods. Needs at least 3 logged cycles." },
    { id: "period", label: "Period Length", weight: 20, score: periodFit, description: "How close your average period length is to the usual 3 to 7 day range." },
    { id: "tracking", label: "Tracking Consistency", weight: 40, score: tracking, description: `Days with a daily log in the last ${windowDays} days.` },
  ];
  const scored = factors.filter((f) => f.score !== null);
  const totalWeight = scored.reduce((s, f) => s + f.weight, 0);
  const healthScore = totalWeight ? Math.round(scored.reduce((s, f) => s + (f.score ?? 0) * f.weight, 0) / totalWeight) : null;
  const healthLabel = healthScore === null ? "No data yet" : healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Getting started";

  // ---- predictions (all dates come from the backend cycle engine)
  const fw = fertileWindow(state.ovulation?.date);
  const confidence = cap(state.confidence.level);
  const rel = (iso: string) => {
    const d = diffDays(state.date, iso);
    return d === 0 ? "Today" : d === 1 ? "Tomorrow" : d > 1 ? `In ${d} days` : `${-d} days ago`;
  };
  const predictions = [
    {
      id: "next-period",
      title: "Next Period",
      subtitle: "Based on your cycle history",
      value: state.nextPeriod ? (state.isOverdue ? `${state.overdueDays}d late` : rel(state.nextPeriod.date)) : "—",
      note: state.nextPeriod ? `${confidence} confidence` : "Not enough data yet",
      icon: Droplet,
      tone: "pink" as const,
    },
    {
      id: "ovulation",
      title: "Ovulation",
      subtitle: "Estimated ovulation date",
      value: state.ovulation ? rel(state.ovulation.date) : "—",
      note: state.ovulation ? "Estimated" : "Not enough data yet",
      icon: Target,
      tone: "purple" as const,
    },
    {
      id: "fertile-window",
      title: "Fertile Window",
      subtitle: "5 days before to 1 day after",
      value: fw ? `${fmtDate(fw.start)} – ${fmtDate(fw.end)}` : "—",
      note: fw ? "Estimated" : "Not enough data yet",
      icon: Heart,
      tone: "pink" as const,
    },
  ];

  const ava = insightReq.data?.insight;
  const recommendations = ava ? [{ id: "summary", title: "Ava's take", body: ava.summary }, ...ava.tips.slice(0, 2).map((t, i) => ({ id: `tip-${i}`, title: "Tip", body: t }))] : [];

  // ---- summary metric cards
  const bbtS = series((l) => l.bbtCelsius);
  const bbtLatest = bbtS.values[bbtS.values.length - 1];
  const summary = [
    { id: "avg-cycle", value: cs.mean !== null ? `${cs.mean}d` : "—", label: "Avg Cycle", delta: changeOf(cycles.map((c) => c.value)), icon: Activity, tone: "bg-[#f1edff] text-[#6C4DE8]" },
    { id: "period-length", value: ps.mean !== null ? `${ps.mean}d` : "—", label: "Period Length", delta: changeOf(lengths.map((c) => c.value)), icon: Droplet, tone: "bg-[#FFF0F6] text-[#F34F97]" },
    { id: "bbt", value: bbtLatest !== undefined ? `${bbtLatest.toFixed(2)}°C` : "—", label: "Latest BBT", delta: changeOf(bbtS.values), icon: Thermometer, tone: "bg-sky-50 text-sky-500" },
  ];

  // ---- trend cards
  const flowS = series((l) => (l.flow ? FLOW_LEVEL[l.flow] : null));
  const painS = series((l) => l.painScore);
  const moodS = series((l) => (l.mood ? MOOD_SCORE[l.mood] : null));
  const sleepS = series((l) => (l.sleep ? SLEEP_SCORE[l.sleep] : null));
  const waterS = series((l) => (l.waterMl !== null ? round1(l.waterMl / 1000) : null));
  const stepsS = series((l) => l.steps);
  const weightS = series((l) => l.weightKg);
  const lhS = series((l) => (l.lhTest ? LH_SCORE[l.lhTest] : null));
  const latestMucus = [...logs].reverse().find((l) => l.cervicalMucus)?.cervicalMucus ?? null;

  const heatDates = Array.from({ length: 14 }, (_, i) => addDays(end, i - 13));
  const heatRows = SYMPTOMS.map((s) => ({
    symptom: s.label,
    levels: heatDates.map((d) => (logs.find((l) => l.date === d)?.symptoms.includes(s.id) ? 1 : 0)),
  })).filter((r) => r.levels.some(Boolean));

  const cycleScale = niceScale(cycles.map((c) => c.value), { floor: 0, minSpan: 6 });
  const periodScale = niceScale(lengths.map((c) => c.value), { floor: 0, minSpan: 4 });
  const weightScale = niceScale(weightS.values, { minSpan: 2 });
  const bbtScale = niceScale(bbtS.values, { minSpan: 1, step: 0.25 });
  const waterScale = niceScale([...waterS.values, WATER_TARGET_ML / 1000], { floor: 0, minSpan: 3, step: 1 });
  const stepsScale = niceScale([...stepsS.values, DEFAULT_STEP_GOAL], { floor: 0, minSpan: 4000, step: 2500 });
  const bbtOvulationIdx = state.ovulation ? bbtS.dates.indexOf(state.ovulation.date) : -1;
  const goalDays = waterS.values.filter((v) => v >= WATER_TARGET_ML / 1000).length;
  const minOf = (a: number[]) => (a.length ? Math.min(...a) : 0);
  const maxOf = (a: number[]) => (a.length ? Math.max(...a) : 0);
  const rangeNote = `Last ${windowDays} days`;

  const cards: CardSpec[] = [
    {
      id: "cycle-length",
      title: "Cycle Length Trend",
      subtitle: `Last ${cycles.length || 12} cycles · days between periods`,
      categories: ["cycle"],
      tint: "purple",
      insight: cs.count ? `Your logged cycles range from ${cs.min} to ${cs.max} days and average ${cs.mean} days.` : "Cycle length appears once you log your second period.",
      csv: () => rowsCsv(["Period start", "Cycle length (days)"], cycles.map((c) => c.startDate), cycles.map((c) => c.value)),
      render: (h) =>
        cycles.length === 0 ? (
          <Empty>Cycle length appears once you log your second period.</Empty>
        ) : (
          <>
            <Legend items={[{ label: "Cycle length", color: PURPLE }, { label: "Latest cycle", color: PINK }]} />
            <p className="-mt-1 mb-2 text-[11px] text-[#8A92A6] xl:text-xs">
              Avg <Strong>{cs.mean}d</Strong> · Longest <Strong>{cs.max}d</Strong> · Shortest <Strong>{cs.min}d</Strong>
            </p>
            <LineChart
              ariaLabel={`Cycle length over ${cycles.length} cycles, from ${cs.min} to ${cs.max} days`}
              xLabels={cycles.map((c) => fmtDate(c.startDate))}
              yDomain={cycleScale.domain}
              yTicks={cycleScale.ticks}
              height={h}
              series={[{ id: "cycle", color: PURPLE, values: cycles.map((c) => c.value), dots: "last", lastDotColor: PINK }]}
            />
          </>
        ),
    },
    {
      id: "period-length",
      title: "Period Length Trend",
      subtitle: `Duration of bleeding · last ${lengths.length || 12} periods`,
      categories: ["cycle"],
      tint: "pink",
      insight: ps.count ? `Period length averages ${ps.mean} days. The usual range is 3 to 7 days.` : "Period length shows up once you log when a period ended.",
      csv: () => rowsCsv(["Period start", "Period length (days)"], lengths.map((c) => c.startDate), lengths.map((c) => c.value)),
      render: (h) =>
        lengths.length === 0 ? (
          <Empty>Period length shows up once you log when a period ended.</Empty>
        ) : (
          <>
            <Legend items={[{ label: "Period days", color: PINK }, { label: "Latest", color: "#5b3fe4" }]} />
            <BarChart
              ariaLabel={`Period length over ${lengths.length} periods, from ${ps.min} to ${ps.max} days`}
              labels={lengths.map((c) => fmtDate(c.startDate))}
              values={lengths.map((c) => c.value)}
              yDomain={periodScale.domain}
              yTicks={periodScale.ticks}
              height={h}
              gradient={["#f9a8d4", PINK]}
              highlightIndex={lengths.length - 1}
              highlightGradient={["#8b6cf5", "#5b3fe4"]}
            />
          </>
        ),
    },
    {
      id: "flow",
      title: "Flow Trend",
      subtitle: `Logged flow · ${rangeNote.toLowerCase()}`,
      categories: ["cycle"],
      tint: "pink",
      insight: flowS.values.length ? `You logged flow on ${flowS.values.length} ${flowS.values.length === 1 ? "day" : "days"}. Heaviest logged flow: ${FLOW_NAMES[maxOf(flowS.values)]?.toLowerCase()}.` : "Log your flow in the daily log to see it here.",
      csv: () => rowsCsv(["Date", "Flow level (1 spotting – 4 heavy)"], flowS.dates, flowS.values),
      render: (h) =>
        flowS.values.length === 0 ? (
          <Empty>No flow logged in this range.</Empty>
        ) : (
          <>
            <Legend items={[{ label: "Flow intensity", color: PINK }]} />
            <LineChart
              ariaLabel="Logged flow intensity over the selected range"
              xLabels={flowS.labels}
              yDomain={[0, 4.4]}
              yTicks={[0, 1, 2, 3, 4]}
              formatY={(v) => FLOW_NAMES[v] ?? ""}
              height={h}
              curve="linear"
              margin={{ left: 46 }}
              series={[{ id: "flow", color: PINK, values: flowS.values, fill: true, dots: "all" }]}
            />
          </>
        ),
    },
    {
      id: "pain",
      title: "Pain Trend",
      subtitle: `Severity score · ${rangeNote.toLowerCase()}`,
      categories: ["symptoms"],
      tint: "red",
      insight: painS.values.length ? `Peak pain you logged was ${maxOf(painS.values)}/10. Average ${mean(painS.values)}/10.` : "Log a pain score in the daily log to see it here.",
      csv: () => rowsCsv(["Date", "Pain (0-10)"], painS.dates, painS.values),
      render: (h) =>
        painS.values.length === 0 ? (
          <Empty>No pain score logged in this range.</Empty>
        ) : (
          <>
            <Legend items={[{ label: "Pain", color: "#ef4444" }]}>
              <span>Peak <Strong>{maxOf(painS.values)}/10</Strong></span>
              <span>Avg <Strong>{mean(painS.values)}</Strong></span>
            </Legend>
            <LineChart ariaLabel="Logged pain score over the selected range" xLabels={painS.labels} yDomain={[0, 10]} yTicks={[0, 2, 4, 6, 8, 10]} height={h} series={[{ id: "pain", color: "#ef4444", values: painS.values, dots: painS.values.length < 15 ? "all" : "none" }]} />
          </>
        ),
    },
    {
      id: "mood",
      title: "Mood Trend",
      subtitle: `Daily mood · ${rangeNote.toLowerCase()}`,
      categories: ["symptoms"],
      tint: "orange",
      insight: moodS.values.length ? `Average mood ${mean(moodS.values)} out of 5 across ${moodS.values.length} logged ${moodS.values.length === 1 ? "day" : "days"}.` : "Log your mood in the daily log to see it here.",
      csv: () => rowsCsv(["Date", "Mood (1 sad – 5 happy)"], moodS.dates, moodS.values),
      render: (h) =>
        moodS.values.length === 0 ? (
          <Empty>No mood logged in this range.</Empty>
        ) : (
          <>
            <div className="mb-3 flex gap-2">
              {MOOD_FACES.map((f) => (
                <img key={f.label} src={f.src} alt={f.label} width={20} height={20} className="size-5 rounded-full object-cover" />
              ))}
            </div>
            <LineChart ariaLabel="Logged mood score over the selected range" xLabels={moodS.labels} yDomain={[1, 5]} yTicks={[1, 2, 3, 4, 5]} height={h} series={[{ id: "mood", color: "#f59e0b", values: moodS.values, dots: moodS.values.length < 15 ? "all" : "none" }]} />
          </>
        ),
    },
    {
      id: "sleep",
      title: "Sleep Trend",
      subtitle: `Sleep quality · ${rangeNote.toLowerCase()}`,
      categories: ["lifestyle"],
      tint: "purple",
      insight: sleepS.values.length ? `Average sleep quality ${SLEEP_NAMES[Math.round(mean(sleepS.values) ?? 0)] || "—"} across ${sleepS.values.length} logged ${sleepS.values.length === 1 ? "night" : "nights"}.` : "Log your sleep in the daily log to see it here.",
      csv: () => rowsCsv(["Date", "Sleep (1 poor – 4 excellent)"], sleepS.dates, sleepS.values),
      render: (h) =>
        sleepS.values.length === 0 ? (
          <Empty>No sleep logged in this range.</Empty>
        ) : (
          <>
            <Legend items={[{ label: "Sleep quality", color: PURPLE }]} />
            <LineChart
              ariaLabel="Logged sleep quality over the selected range"
              xLabels={sleepS.labels}
              yDomain={[0.5, 4.5]}
              yTicks={[1, 2, 3, 4]}
              formatY={(v) => SLEEP_NAMES[v] ?? ""}
              height={h}
              margin={{ left: 62 }}
              series={[{ id: "sleep", color: PURPLE, values: sleepS.values, dots: "last", lastDotColor: PINK }]}
            />
          </>
        ),
    },
    {
      id: "water",
      title: "Water Intake",
      subtitle: `Litres per day · goal ${(WATER_TARGET_ML / 1000).toFixed(1)}L`,
      categories: ["lifestyle"],
      tint: "blue",
      insight: waterS.values.length ? `You reached the ${(WATER_TARGET_ML / 1000).toFixed(1)}L goal on ${goalDays} of ${waterS.values.length} logged ${waterS.values.length === 1 ? "day" : "days"}.` : "Log your water in the daily log to see it here.",
      csv: () => rowsCsv(["Date", "Litres"], waterS.dates, waterS.values),
      render: (h) =>
        waterS.values.length === 0 ? (
          <Empty>No water logged in this range.</Empty>
        ) : (
          <>
            <Legend items={[{ label: "Intake", color: "#3b82f6" }, { label: `Goal ${(WATER_TARGET_ML / 1000).toFixed(1)}L`, color: "#93c5fd", dashed: true }]} />
            <BarChart
              ariaLabel="Litres of water logged per day against the daily goal"
              labels={waterS.labels}
              values={waterS.values}
              yDomain={waterScale.domain}
              yTicks={waterScale.ticks}
              height={h}
              gradient={["#7ab8ff", "#3b82f6"]}
              referenceLines={[{ value: WATER_TARGET_ML / 1000, color: "#93c5fd" }]}
            />
          </>
        ),
    },
    {
      id: "steps",
      title: "Activity Trend",
      subtitle: `Steps per day · goal ${DEFAULT_STEP_GOAL.toLocaleString()}`,
      categories: ["lifestyle"],
      tint: "green",
      insight: stepsS.values.length ? `Average ${Math.round(mean(stepsS.values) ?? 0).toLocaleString()} steps across ${stepsS.values.length} logged ${stepsS.values.length === 1 ? "day" : "days"}.` : "Log your steps in the daily log to see them here.",
      csv: () => rowsCsv(["Date", "Steps"], stepsS.dates, stepsS.values),
      render: (h) =>
        stepsS.values.length === 0 ? (
          <Empty>No steps logged in this range.</Empty>
        ) : (
          <>
            <Legend items={[{ label: "Steps", color: "#22c55e" }, { label: `Goal ${DEFAULT_STEP_GOAL.toLocaleString()}`, color: "#4ade80", dashed: true }]} />
            <BarChart
              ariaLabel="Steps logged per day against the step goal"
              labels={stepsS.labels}
              values={stepsS.values}
              yDomain={stepsScale.domain}
              yTicks={stepsScale.ticks}
              formatY={(v) => (v >= 1000 ? `${round1(v / 1000)}k` : String(v))}
              height={h}
              gradient={["#4ade80", "#16a34a"]}
              referenceLines={[{ value: DEFAULT_STEP_GOAL, color: "#4ade80" }]}
            />
          </>
        ),
    },
    {
      id: "weight",
      title: "Weight Trend",
      subtitle: `Logged weight · ${rangeNote.toLowerCase()}`,
      categories: ["lifestyle"],
      tint: "pink",
      insightTitle: weightS.values.length > 1 ? (changeOf(weightS.values)! < 0 ? "Trending down" : changeOf(weightS.values)! > 0 ? "Trending up" : "Holding steady") : undefined,
      insight: weightS.values.length > 1 ? `Your latest weight is ${Math.abs(round1(weightS.values[weightS.values.length - 1]! - weightS.values[0]!))} kg ${weightS.values[weightS.values.length - 1]! < weightS.values[0]! ? "lower" : "higher"} than the first one logged in this range.` : "Log your weight on two or more days to see a trend.",
      csv: () => rowsCsv(["Date", "Weight (kg)"], weightS.dates, weightS.values),
      render: (h) =>
        weightS.values.length === 0 ? (
          <Empty>No weight logged in this range.</Empty>
        ) : (
          <>
            <Legend items={[{ label: "Weight (kg)", color: "#ef4444" }]} />
            <LineChart ariaLabel="Logged weight in kilograms over the selected range" xLabels={weightS.labels} yDomain={weightScale.domain} yTicks={weightScale.ticks} height={Math.min(h, 235)} series={[{ id: "weight", color: "#ef4444", values: weightS.values, dots: "last" }]} />
            <dl className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["Latest", `${weightS.values[weightS.values.length - 1]} kg`, "Most recent log"],
                ["First", `${weightS.values[0]} kg`, "Start of range"],
                ["Change", `${signed(weightS.values[weightS.values.length - 1]! - weightS.values[0]!)} kg`, "Over this range"],
              ].map(([label, value, note]) => (
                <div key={label} className="min-w-0 rounded-xl border border-[#F1DDE8] bg-white/80 px-2.5 py-2">
                  <dt className="truncate text-[11px] text-[#8A92A6]">{label}</dt>
                  <dd className="text-base font-bold text-[#17152B]">{value}</dd>
                  <dd className="truncate text-[11px] text-[#8A92A6]">{note}</dd>
                </div>
              ))}
            </dl>
          </>
        ),
    },
    {
      id: "bbt",
      title: "Basal Body Temperature",
      subtitle: `Logged readings · ${rangeNote.toLowerCase()}`,
      categories: ["fertility", "hormones"],
      tint: "pink",
      insight: bbtS.values.length ? `Readings range from ${minOf(bbtS.values).toFixed(2)} to ${maxOf(bbtS.values).toFixed(2)}°C. A sustained rise of about 0.2°C or more usually follows ovulation.` : "Log your basal temperature in the daily log to see it here.",
      csv: () => rowsCsv(["Date", "BBT (°C)"], bbtS.dates, bbtS.values),
      render: (h) =>
        bbtS.values.length === 0 ? (
          <Empty>No temperature logged in this range.</Empty>
        ) : (
          <>
            <Legend items={[{ label: "BBT °C", color: PINK }, { label: "Average", color: "#c4b8ee", dashed: true }]}>
              <span>Latest: <Strong>{bbtLatest?.toFixed(2)}°C</Strong></span>
            </Legend>
            <LineChart
              ariaLabel="Basal body temperature in degrees Celsius over the selected range"
              xLabels={bbtS.labels}
              yDomain={bbtScale.domain}
              yTicks={bbtScale.ticks}
              formatY={(v) => v.toFixed(2)}
              height={h}
              markers={bbtOvulationIdx >= 0 ? [{ index: bbtOvulationIdx, label: "Est. ovulation", color: PURPLE }] : []}
              referenceLines={[{ value: mean(bbtS.values) ?? 0, color: "#c4b8ee" }]}
              series={[{ id: "bbt", color: PINK, values: bbtS.values, dots: bbtS.values.length < 15 ? "all" : "none" }]}
            />
          </>
        ),
    },
    {
      id: "lh",
      title: "LH Test & Cervical Mucus",
      subtitle: `What you logged · ${rangeNote.toLowerCase()}`,
      categories: ["hormones", "fertility"],
      tint: "purple",
      insight: lhS.values.length ? `${lhS.values.filter((v) => v >= 2).length} high or peak LH ${lhS.values.filter((v) => v >= 2).length === 1 ? "result" : "results"} logged. A surge usually comes 24 to 36 hours before ovulation.` : "Log LH tests and cervical mucus in the daily log to see them here.",
      csv: () => rowsCsv(["Date", "LH (0 negative – 3 peak)"], lhS.dates, lhS.values),
      render: (h) =>
        lhS.values.length === 0 && !latestMucus ? (
          <Empty>No LH test or cervical mucus logged in this range.</Empty>
        ) : (
          <>
            <Legend items={[{ label: "LH test", color: "#22c55e" }]}>
              {latestMucus && <span>Latest mucus: <Strong>{latestMucus}</Strong></span>}
            </Legend>
            {lhS.values.length > 0 && (
              <BarChart ariaLabel="LH test results logged over the selected range" labels={lhS.labels} values={lhS.values} yDomain={[0, 3.5]} yTicks={[0, 1, 2, 3]} formatY={(v) => LH_NAMES[v] ?? ""} height={h} gradient={["#4ade80", "#16a34a"]} />
            )}
          </>
        ),
    },
    {
      id: "regularity",
      title: "Cycle Regularity",
      subtitle: `Consistency score · last ${cycles.length || 12} cycles`,
      categories: ["cycle"],
      tint: "green",
      insight: cs.sd !== null ? `Your cycle length varies by about ±${cs.sd} days from one cycle to the next.` : "Needs 3 or more logged cycles to score regularity.",
      csv: () => [["Metric", "Value"], ["Regularity score (%)", regularity ?? ""], ["Cycle length SD (days)", cs.sd ?? ""]],
      render: () =>
        regularity === null ? (
          <Empty>Needs 3 or more logged cycles.</Empty>
        ) : (
          <div className="flex flex-1 items-center justify-center py-2">
            <RingGauge value={regularity} size={188} strokeWidth={20} gradient={["#34d399", "#16a34a"]} trackColor="#e2f6ea" innerFill="#ffffff" ariaLabel={`Cycle regularity ${regularity} percent`}>
              <span className="text-2xl font-extrabold text-[#17152B] md:text-[28px] xl:text-[32px]">
                {regularity}
                <span className="text-base font-bold">%</span>
              </span>
              <span className="mt-1 text-xs font-semibold text-[#22B573] md:text-[13px]">{cs.sd !== null && cs.sd <= 2 ? "Very consistent" : cs.sd !== null && cs.sd <= 5 ? "Some variation" : "Varies a lot"}</span>
            </RingGauge>
          </div>
        ),
    },
    {
      id: "heatmap",
      title: "Symptom Frequency Heatmap",
      subtitle: "Symptoms you logged · last 14 days",
      categories: ["symptoms"],
      tint: "purple",
      fullWidth: true,
      insight: heatRows.length ? `Most logged symptom: ${[...heatRows].sort((a, b) => b.levels.filter(Boolean).length - a.levels.filter(Boolean).length)[0]?.symptom}.` : "Log symptoms in the daily log to see them here.",
      csv: () => [["Symptom", ...heatDates], ...heatRows.map((r) => [r.symptom, ...r.levels])],
      render: () =>
        heatRows.length === 0 ? (
          <Empty>No symptoms logged in the last 14 days.</Empty>
        ) : (
          <>
            <div className="mb-3">
              <HeatmapLegend />
            </div>
            <SymptomHeatmap rows={heatRows} columnLabels={heatDates.map((d) => String(parseIso(d).getDate()))} />
          </>
        ),
    },
  ];

  const visible = cards.filter((c) => filter === "all" || c.categories.includes(filter));
  const expanded = cards.find((c) => c.id === expandedId) ?? null;

  const exportReport = () => {
    const rows: (string | number)[][] = [["Trend Analysis report"], ["Range", `${start} to ${end}`], [], ["Summary metric", "Value"], ...summary.map((m) => [m.label, m.value])];
    for (const c of cards) rows.push([], [c.title], ...c.csv());
    downloadCsv("trend-analysis-report.csv", rows);
  };

  const sectionTitle = "mb-3 text-lg font-bold text-[#17152B] md:text-xl xl:text-[22px]";
  const phaseLabel = state.phase === "unknown" ? "Cycle" : cap(state.phase);

  return (
    <div className="animate-fade-up">
      {/* ---- summary row */}
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <section aria-labelledby="health-score-title" className="flex min-w-0 flex-col">
          <h2 id="health-score-title" className={sectionTitle}>Health Score</h2>
          <div className={`${CARD} relative flex flex-1 items-center justify-between gap-4 overflow-hidden p-5 sm:p-6`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#FFF0F6_0%,transparent_50%)]" aria-hidden="true" />
            <div className="relative min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-base font-bold text-[#17152B] md:text-[17px] xl:text-lg">{healthLabel}</span>
                <button type="button" onClick={() => setScoreOpen(true)} className="-my-2 inline-flex h-11 items-center">
                  <span className="inline-flex h-7 items-center gap-1 rounded-full border border-[#F34F97]/30 bg-[#FFF0F6] px-2.5 text-xs font-semibold text-[#F34F97]">
                    <Eye className="size-3" aria-hidden="true" />
                    View more
                  </span>
                  <span className="sr-only"> about your health score</span>
                </button>
              </div>
              <p className="mt-2 max-w-[200px] text-xs text-[#8A92A6] md:text-[13px]">Based on your cycle regularity, period length and how often you log.</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#22B573] md:text-[13px]">
                <TrendingUp className="size-3.5" aria-hidden="true" />
                {trackedDays} of {windowDays} days logged
              </p>
            </div>
            <RingGauge value={healthScore ?? 0} size={120} strokeWidth={14} gradient={[PINK, "#8b6cf5"]} trackColor="#f0e6f8" ariaLabel={healthScore === null ? "Health score not available yet" : `Health score ${healthScore} out of 100`}>
              <span className="text-2xl font-bold text-[#17152B] md:text-[28px] xl:text-[32px]">{healthScore ?? "—"}</span>
              <span className="mt-0.5 text-[11px] text-[#8A92A6] xl:text-xs">/ 100</span>
            </RingGauge>
          </div>
        </section>

        <section aria-labelledby="predictions-title" className="flex min-w-0 flex-col">
          <h2 id="predictions-title" className={sectionTitle}>Predictions</h2>
          <ul className="flex flex-1 flex-col gap-2.5">
            {predictions.map((p) => (
              <li key={p.id} className="flex flex-1 items-center gap-3 rounded-[22px] border border-[#F1DDE8] bg-white px-4 py-2.5 shadow-[0_10px_34px_-12px_rgb(190_120_220/0.22)]">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#FFF0F6] text-[#F34F97]">
                  <p.icon className="size-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#17152B] xl:text-base">{p.title}</div>
                  <div className="text-[11px] text-[#8A92A6] xl:text-xs">{p.subtitle}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-sm font-bold xl:text-base ${p.tone === "pink" ? "text-[#F34F97]" : "text-[#6C4DE8]"}`}>{p.value}</div>
                  <div className="text-[11px] text-[#8A92A6] xl:text-xs">{p.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="recommendations-title" className="flex min-w-0 flex-col md:col-span-2 lg:col-span-1">
          <h2 id="recommendations-title" className={sectionTitle}>AI Recommendations</h2>
          <ul className="flex flex-1 flex-col gap-2.5">
            {recommendations.length === 0 ? (
              <li className="flex flex-1 items-center rounded-[22px] bg-gradient-to-r from-[#f1edff]/80 to-[#FFF0F6]/70 px-4 py-3 text-xs text-[#68708A] md:text-[13px]">
                {insightReq.status === "loading" ? "Ava is reading your cycle…" : "Ava's recommendations appear once your phase insight is ready."}
              </li>
            ) : (
              recommendations.map((r) => (
                <li key={r.id} className="flex flex-1 items-center gap-3 rounded-[22px] bg-gradient-to-r from-[#f1edff]/80 to-[#FFF0F6]/70 px-4 py-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#F34F97]/25 bg-white text-[#F34F97]">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#17152B] xl:text-base">{r.title}</div>
                    <p className="mt-0.5 text-xs text-[#68708A] md:text-[13px]">{r.body}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {/* ---- trend analysis */}
      <section aria-labelledby="trend-title" className="mt-9">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1edff] px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-[#6C4DE8] xl:text-[11px]">
              <Sparkles className="size-2.5" aria-hidden="true" />
              ANALYTICS
            </span>
            <h2 id="trend-title" className="mt-2 text-2xl font-bold text-[#17152B] md:text-[28px] xl:text-[32px]">Trend Analysis</h2>
            <p className="mt-1 text-[13px] text-[#8A92A6] md:text-sm">Analytics to understand your menstrual health over time, from what you log.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Date range" className="flex gap-1.5 rounded-full border border-[#F1DDE8] bg-white p-1">
              {WINDOWS.map((w) => (
                <button key={w} type="button" aria-pressed={windowDays === w} onClick={() => setWindowDays(w)} className={`h-9 rounded-full px-3.5 text-xs font-semibold md:text-[13px] ${windowDays === w ? "bg-[#f1edff] text-[#6C4DE8]" : "text-[#68708A] hover:bg-[#f1edff]/60"}`}>
                  {w}d
                </button>
              ))}
            </div>
            <button type="button" onClick={exportReport} className="flex h-11 items-center gap-2 rounded-full bg-[#F34F97] px-5 text-xs font-semibold text-white shadow-[0_10px_22px_-8px_rgb(236_72_153/0.7)] md:text-[13px]">
              <Download className="size-3.5" aria-hidden="true" />
              Export Report
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter metrics" className="flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const active = item.id === filter;
              return (
                <button key={item.id} type="button" aria-pressed={active} onClick={() => setFilter(item.id)} className="group inline-flex h-11 items-center">
                  <span className={`inline-flex h-11 items-center rounded-full px-4 text-xs font-medium transition-colors sm:h-9 sm:px-5 md:text-[13px] ${active ? "bg-gradient-to-r from-[#4b2fd8] to-[#6C4DE8] font-semibold text-white shadow-[0_8px_18px_-8px_rgb(75_47_216/0.7)]" : "border border-[#F1DDE8] bg-white text-[#68708A] group-hover:bg-[#f1edff]/60"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div role="group" aria-label="Current cycle phase" className="flex items-center gap-4 text-[11px] text-[#8A92A6] xl:text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1edff] px-3 py-1.5 font-semibold text-[#6C4DE8]">
              <Moon className="size-3" aria-hidden="true" />
              {phaseLabel}
              {state.cycleDay ? ` · Day ${state.cycleDay}` : ""}
            </span>
          </div>
        </div>

        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {summary.map((m) => (
            <li key={m.id} className="rounded-[24px] border border-[#F1DDE8] bg-white p-5 shadow-[0_10px_34px_-12px_rgb(190_120_220/0.22)]">
              <div className="flex items-center justify-between">
                <span className={`grid size-9 place-items-center rounded-xl ${m.tone}`}>
                  <m.icon className="size-[18px]" aria-hidden="true" />
                </span>
                {m.delta !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#22B573]/10 px-2 py-0.5 text-[10px] font-semibold text-[#22B573] xl:text-[11px]">
                    {m.delta >= 0 ? <TrendingUp className="size-3" aria-hidden="true" /> : <TrendingDown className="size-3" aria-hidden="true" />}
                    {signed(m.delta)}
                    <span className="sr-only"> change</span>
                  </span>
                )}
              </div>
              <div className="mt-4 text-[22px] font-bold text-[#17152B] md:text-[25px] xl:text-[28px]">{m.value}</div>
              <div className="mt-1.5 text-xs text-[#8A92A6] md:text-[13px]">{m.label}</div>
            </li>
          ))}
        </ul>

        {history.status === "error" && (
          <p role="alert" className="mt-5 rounded-[24px] border border-[#F1DDE8] bg-white p-5 text-sm text-[#68708A]">
            {history.error?.message ?? "Couldn't load your history."}{" "}
            <button type="button" onClick={history.refetch} className="font-semibold underline">Try again</button>
          </p>
        )}
        {logsReq.status === "error" && (
          <p role="alert" className="mt-5 rounded-[24px] border border-[#F1DDE8] bg-white p-5 text-sm text-[#68708A]">
            {logsReq.error?.message ?? "Couldn't load your daily logs."}{" "}
            <button type="button" onClick={logsReq.refetch} className="font-semibold underline">Try again</button>
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((spec) => (
            <TrendCard key={spec.id} spec={spec} onExpand={() => setExpandedId(spec.id)} />
          ))}
        </div>

        <p className="mt-6 rounded-[24px] border border-[#F1DDE8] bg-white/80 p-4 text-center text-xs text-[#8A92A6]">
          Trends are based on what you log and are not a diagnosis. General wellness information, not medical advice.
        </p>
      </section>

      {scoreOpen && (
        <Overlay label="Health score details" onClose={() => setScoreOpen(false)}>
          <h2 className="text-xl font-bold text-[#17152B]">Health Score</h2>
          <p className="mt-1 text-sm text-[#68708A]">A simple score from three things you log. It is not a diagnosis. Factors without data yet are left out and the rest are re-weighted.</p>
          <ul className="mt-5 grid gap-4">
            {factors.map((f) => (
              <li key={f.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#17152B]">{f.label} <span className="font-normal text-[#8A92A6]">· {f.weight}%</span></span>
                  <span className="font-bold text-[#6C4DE8]">{f.score === null ? "No data yet" : f.score}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-[#f0e6f8]">
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#F34F97] to-[#8b6cf5]" style={{ width: `${f.score ?? 0}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-[#8A92A6]">{f.description}</p>
              </li>
            ))}
          </ul>
        </Overlay>
      )}

      {expanded && (
        <Overlay label={expanded.title} onClose={() => setExpandedId(null)}>
          <h2 className="pr-10 text-xl font-bold text-[#17152B]">{expanded.title}</h2>
          <p className="mt-1 text-sm text-[#8A92A6]">{expanded.subtitle}</p>
          <div className="mt-4 flex flex-col">{expanded.render(380)}</div>
          <p className="mt-4 rounded-2xl bg-[#f1edff]/70 p-3 text-sm text-[#68708A]">{expanded.insight}</p>
        </Overlay>
      )}
    </div>
  );
}