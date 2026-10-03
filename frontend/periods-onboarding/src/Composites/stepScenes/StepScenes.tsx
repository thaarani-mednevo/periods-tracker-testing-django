import {
  Activity,
  BatteryLow,
  Bell,
  BellRing,
  Brain,
  CalendarHeart,
  Droplets,
  FileHeart,
  Heart,
  HeartPulse,
  Lock,
  Moon,
  Pill,
  Plus,
  Ruler,
  ShieldCheck,
  Smile,
  Sparkles,
  Tag,
  Target,
  TestTube,
  Thermometer,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { BIRTH_CONTROL_METHODS_BY_CATEGORY, FERTILITY_GOAL_OPTIONS, GOAL_TRACKING, TRACKING_KEYS } from "../../constants";
import { useCountUp } from "../../hooks/useCountUp";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { cn } from "../../lib/cn";
import { bmiCategory, daysAgo, effectiveDuration, parseISODate, reminderPhrase, trackingLabel, validBmi } from "../../lib/health";
import type { OnboardingData, PeriodRegularity, StepId, TrackingKey } from "../../types";
import { Icon3D, MethodGlyph } from "../../Elements/icon3D/Icon3D";
import { guideBox } from "../visuals/guidePlacement/guidePlacement";
import {
  DataChip,
  FloorShadow,
  Flower,
  GlassPanel,
  HoloRing,
  MATERIAL,
  Orb,
  Particles,
  SceneBox,
  Sparkle,
  Sprig,
  useSceneLayout,
} from "../visuals/primitives/primitives";

/* ------------------------------------------------------------------ */
/* Shared scene helpers                                                */
/* ------------------------------------------------------------------ */

/** Items placed evenly on a circle, the ring slowly rotating while each item counter-rotates upright. */
export function Orbit<T>({
  items,
  radius,
  duration = 40,
  render,
  getKey,
  className,
}: {
  items: readonly T[];
  radius: number;
  duration?: number;
  render: (item: T, index: number) => ReactNode;
  getKey: (item: T) => string;
  className?: string;
}) {
  return (
    <div className={cn("absolute size-0", className)} style={{ animation: `spin ${duration}s linear infinite` }}>
      {items.map((item, i) => {
        const angle = (i / Math.max(items.length, 1)) * 2 * Math.PI - Math.PI / 2;
        return (
          <div key={getKey(item)} className="absolute" style={{ left: Math.cos(angle) * radius, top: Math.sin(angle) * radius }}>
            <div style={{ animation: `spin-reverse ${duration}s linear infinite` }}>
              <div className="-translate-x-1/2 -translate-y-1/2">{render(item, i)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The cycle donut: menstrual, follicular, ovulation and luteal arcs, with an optional highlighted
 * span of logged days and an ovulation marker.
 */
export function PhaseRing({
  cycle,
  duration,
  size = 300,
  stroke = 34,
  fertileWindow,
  highlightDays,
  showOvulation,
}: {
  cycle: number;
  duration: number;
  size?: number;
  stroke?: number;
  fertileWindow?: boolean;
  highlightDays?: number;
  showOvulation?: boolean;
}) {
  const c = size / 2;
  const r = c - stroke / 2 - 16;
  const circumference = 2 * Math.PI * r;
  const ovulationDay = Math.max(duration + 2, cycle - 14);

  const arcs = [
    { from: 0, to: duration, color: "#F34F97" },
    { from: duration, to: ovulationDay - 1, color: "#FFC2DA" },
    { from: ovulationDay - 1, to: ovulationDay + 1, color: "#FF5AA5" },
    { from: ovulationDay + 1, to: cycle, color: "#FF9CC6" },
  ].filter((a) => a.to > a.from);

  const dash = (from: number, to: number): { strokeDasharray: string; strokeDashoffset: number } => ({
    strokeDasharray: `${Math.max(((to - from) / cycle) * circumference - 3, 1)} ${circumference}`,
    strokeDashoffset: -(from / cycle) * circumference,
  });

  const ovulationAngle = ((ovulationDay / cycle) * 360 - 90) * (Math.PI / 180);
  const fertileFrom = Math.max(0, ovulationDay - 5);
  const fertileTo = Math.min(cycle, ovulationDay + 1);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <filter id={`pr-glow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#D93D7F" floodOpacity="0.25" />
        </filter>
      </defs>
      <g transform={`rotate(-90 ${c} ${c})`} filter={`url(#pr-glow-${size})`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#F8DDE7" strokeWidth={stroke} />
        {arcs.map((arc) => (
          <circle
            key={arc.from}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeOpacity="0.9"
            strokeWidth={stroke}
            {...dash(arc.from, arc.to)}
            className="transition-all duration-700"
          />
        ))}
        {highlightDays !== undefined && (
          <circle
            cx={c}
            cy={c}
            r={r + stroke / 2 + 7}
            fill="none"
            stroke="#F34F97"
            strokeWidth="5"
            strokeLinecap="round"
            {...dash(0, Math.min(highlightDays, cycle))}
            className="transition-all duration-500"
          />
        )}
        {fertileWindow && (
          <circle
            cx={c}
            cy={c}
            r={r + stroke / 2 + 7}
            fill="none"
            stroke="#FF5AA5"
            strokeWidth="6"
            strokeLinecap="round"
            {...dash(fertileFrom, fertileTo)}
            className="animate-pulse transition-all duration-500"
          />
        )}
        <circle cx={c} cy={c} r={r + stroke / 2} fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="1.5" />
        <circle cx={c} cy={c} r={r - stroke / 2} fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="1.5" />
      </g>
      {showOvulation && (
        <g transform={`translate(${c + Math.cos(ovulationAngle) * r} ${c + Math.sin(ovulationAngle) * r})`}>
          <circle r="13" fill="#fff" opacity="0.6" className="animate-pulse" />
          <circle r="8" fill="#FF5AA5" stroke="#fff" strokeWidth="2.5" />
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Last period                                                */
/* ------------------------------------------------------------------ */
export function LastPeriodScene({ iso }: { iso: string }) {
  const selected = parseISODate(iso);
  const view = selected ?? new Date();
  const firstWeekday = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 35 }, (_, i) => {
    const day = i - firstWeekday + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
  const ago = daysAgo(iso);
  const isSelected = (day: number | null) => day !== null && !!selected && day === selected.getDate();

  return (
    <SceneBox>
      <HoloRing size={400} dashed reverse dot={false} />
      <Sprig className="bottom-[62px] left-[60px]" />

      {/* Floating calendar */}
      <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 animate-float">
        <div className="relative animate-sway [transform-style:preserve-3d]">
          <GlassPanel className="absolute inset-0 rounded-[26px] opacity-60" style={{ transform: "translate3d(18px,14px,-60px)" }} />
          <GlassPanel className="h-[280px] w-[250px] rounded-[26px]">
            <div className="flex h-[64px] items-end justify-between px-5 pb-3" style={{ background: MATERIAL.brand }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">{view.getFullYear()}</p>
                <p className="text-lg font-bold text-white">{view.toLocaleDateString("en-US", { month: "long" })}</p>
              </div>
              <CalendarHeart className="mb-1 size-6 text-white/90" strokeWidth={1.6} />
            </div>
            <div className="grid grid-cols-7 gap-1.5 px-4 pt-4">
              {cells.map((day, i) => (
                <span
                  key={i}
                  className={cn(
                    "grid size-[26px] place-items-center rounded-full text-[10px] font-semibold",
                    day === null && "opacity-0",
                    isSelected(day) ? "animate-pulse-soft bg-rose text-white shadow-glow" : "bg-white/60 text-ink-muted",
                  )}
                >
                  {day}
                </span>
              ))}
            </div>
          </GlassPanel>
          {/* Binder rings */}
          {[62, 176].map((left) => (
            <span
              key={left}
              className="absolute -top-4 h-9 w-3 rounded-full shadow-[0_2px_6px_rgba(217,61,127,0.15)]"
              style={{ left, background: MATERIAL.roseMetal }}
            />
          ))}
        </div>
      </div>

      {/* Day 1 dial */}
      <div className="absolute right-2 top-2 grid size-[74px] animate-float-slow place-items-center rounded-full border border-white bg-white/80 shadow-glass backdrop-blur">
        <PhaseRing cycle={28} duration={5} size={66} stroke={8} />
        <span className="absolute text-[10px] font-bold text-rose-ink">Day 1</span>
      </div>

      {/* Drifting day numbers */}
      {(
        [
          ["1", "left-[34px] top-[40px]"],
          ["2", "right-[96px] top-[10px]"],
          ["3", "right-[6px] top-[190px]"],
          ["4", "left-[18px] top-[250px]"],
        ] as const
      ).map(([label, pos], i) => (
        <span
          key={label}
          className={cn("absolute grid size-7 animate-float place-items-center rounded-lg border border-white bg-white/85 text-[11px] font-bold text-rose-ink shadow-glass", pos)}
          style={{ animationDelay: `${i * 0.7}s` }}
        >
          {label}
        </span>
      ))}

      <Flower size={78} className="bottom-[40px] left-[70px] animate-float-slow" />
      <Flower size={52} hue="blush" className="bottom-[34px] left-[140px]" />
      <Flower size={62} className="bottom-[46px] right-[50px] animate-float" style={{ animationDelay: "1s" }} />
      <FloorShadow width={250} className="bottom-8" />

      {selected && (
        <DataChip className="right-4 top-[92px] animate-scale-in">
          <span className="size-2 rounded-full bg-rose" />
          {`Period started · `}
          {selected.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </DataChip>
      )}
      {ago !== undefined && ago >= 0 && (
        <DataChip className="bottom-[120px] right-0 animate-scale-in">
          <Moon className="size-3.5 text-rose" />
          {ago === 0 ? "Started today" : `${ago} ${ago === 1 ? "day" : "days"} ago`}
        </DataChip>
      )}
    </SceneBox>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Cycle length                                               */
/* ------------------------------------------------------------------ */
export function CycleLengthScene({ cycle, label, known }: { cycle: number; label: string; known: boolean }) {
  const markerPct = Math.min(100, Math.max(0, ((cycle - 15) / 45) * 100));
  const shown = Math.round(useCountUp(cycle, 400));

  return (
    <SceneBox>
      <HoloRing size={410} dashed dot={false} reverse />

      {/* Tilted cycle wheel */}
      <div className="absolute inset-0 grid place-items-center [transform:perspective(900px)_rotateX(20deg)]">
        <div className="animate-spin-slower">
          <PhaseRing cycle={cycle} duration={5} size={330} stroke={38} showOvulation />
        </div>
      </div>

      {/* Day counter */}
      <div className="absolute inset-0 grid place-items-center">
        <Orb size={140} material="pearl" className="grid place-items-center">
          <div className="relative text-center">
            <p className="text-[40px] font-bold leading-none tracking-tight text-rose-ink tabular-nums">{known ? shown : label}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">day cycle</p>
          </div>
        </Orb>
      </div>

      <DataChip className="right-0 top-2 animate-pulse-soft">
        <CalendarHeart className="size-4 text-rose" />
        <span className="text-[15px] font-bold text-rose-ink tabular-nums">{known ? `${shown} days` : "Learning"}</span>
      </DataChip>

      {/* Typical range meter */}
      <div className="absolute bottom-3 right-2 w-[210px] rounded-2xl border border-white bg-white/85 p-3 shadow-glass backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Typical range · 21–35 days</p>
        <div className="relative mt-2 h-2 rounded-full bg-blush-200">
          <span className="absolute inset-y-0 rounded-full bg-rose/35" style={{ left: `${(6 / 45) * 100}%`, width: `${(14 / 45) * 100}%` }} />
          {known && (
            <span className="absolute inset-0 transition-transform duration-300" style={{ transform: `translateX(${markerPct}%)` }}>
              <span className="absolute left-0 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose shadow-glow" />
            </span>
          )}
        </div>
      </div>

      <DataChip className="left-2 top-10">
        <span className="size-2 rounded-full bg-rose" />
        Menstrual
      </DataChip>
      <DataChip className="bottom-[110px] left-0">
        <span className="size-2 rounded-full bg-[#FFC2DA]" />
        Follicular
      </DataChip>
      <DataChip className="right-0 top-[150px]">
        <span className="size-2 rounded-full bg-rose-bright" />
        Ovulation
      </DataChip>
    </SceneBox>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Period regularity                                          */
/* ------------------------------------------------------------------ */
const PATTERNS = [
  { value: "regular", title: "Regular", dash: "6.5 4", note: "Similar timing each cycle" },
  { value: "irregular", title: "Irregular", dash: "14 3 3 7 18 4 2 6", note: "Timing changes a lot" },
  { value: "unknown", title: "Unknown", dash: "1.5 5", note: "We'll learn together" },
] as const;

export function PatternScene({ regularity }: { regularity: PeriodRegularity }) {
  return (
    <SceneBox>
      <HoloRing size={420} dashed dot={false} />
      <HoloRing size={330} reverse />

      <div className="absolute inset-x-6 top-[42px] flex flex-col gap-4">
        {PATTERNS.map((pattern, i) => {
          const active = regularity === pattern.value;
          return (
            <div
              key={pattern.value}
              className={cn(
                "flex animate-card-in items-center gap-4 rounded-[22px] border bg-white/90 p-4 backdrop-blur transition-all duration-300",
                active ? "scale-[1.04] border-rose shadow-card-active" : "border-white shadow-glass",
                !!regularity && !active && "opacity-50",
              )}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className={cn("relative grid size-[62px] shrink-0 place-items-center rounded-full", active ? "bg-blush-100" : "bg-blush-50")}>
                <svg
                  width="54"
                  height="54"
                  viewBox="0 0 54 54"
                  className={cn(
                    active && (pattern.value === "unknown" ? "animate-spin-slow" : pattern.value === "regular" ? "animate-spin-slower" : "animate-spin-reverse"),
                  )}
                  aria-hidden="true"
                >
                  <circle cx="27" cy="27" r="20" fill="none" stroke={active ? "#F34F97" : "#FF9CC6"} strokeWidth="5" strokeLinecap="round" strokeDasharray={pattern.dash} />
                </svg>
                {pattern.value === "unknown" && <span className="absolute text-base font-bold text-rose-ink">?</span>}
                {active && <Sparkle size={12} className="-right-1 -top-1" />}
              </span>
              <div className="min-w-0">
                <p className="text-[17px] font-bold text-ink">{pattern.title}</p>
                <p className="text-[12.5px] text-ink-muted">{pattern.note}</p>
              </div>
              {active && (
                <span className="ml-auto grid size-7 shrink-0 animate-pop place-items-center rounded-full bg-rose text-white shadow-glow">
                  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                    <path d="M5 12.5 L10 17 L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {regularity === "unknown" && <Particles count={14} />}
      <FloorShadow width={320} className="bottom-6" />
    </SceneBox>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4 — Period duration                                            */
/* ------------------------------------------------------------------ */
export function DurationScene({ days }: { days?: number }) {
  const reduce = usePrefersReducedMotion();
  const shown = useCountUp(days ?? 0, 350);
  const glass = "M44 34 H156 C156 108 112 138 104 160 C112 182 156 212 156 286 H44 C44 212 88 182 96 160 C88 138 44 108 44 34 Z";

  return (
    <SceneBox>
      <div className="absolute inset-0 grid place-items-center opacity-80">
        <PhaseRing cycle={28} duration={5} size={390} stroke={20} highlightDays={days} />
      </div>

      {/* Hourglass */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-float">
        <svg width="170" height="280" viewBox="0 0 200 330" aria-hidden="true">
          <defs>
            <linearGradient id="hgMetal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFE5EF" />
              <stop offset="0.35" stopColor="#FF9CC6" />
              <stop offset="0.55" stopColor="#D93D7F" />
              <stop offset="0.8" stopColor="#FFB3D1" />
              <stop offset="1" stopColor="#FFF1F6" />
            </linearGradient>
            <linearGradient id="hgGlass" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="0.5" stopColor="#FFE5EF" stopOpacity="0.4" />
              <stop offset="1" stopColor="#FF9CC6" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="hgLiquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFD6C4" />
              <stop offset="0.45" stopColor="#FF8DBF" />
              <stop offset="1" stopColor="#F34F97" />
            </linearGradient>
            <clipPath id="hgClip">
              <path d={glass} />
            </clipPath>
          </defs>
          <path d={glass} fill="url(#hgGlass)" />
          <g clipPath="url(#hgClip)">
            <rect x="40" y={reduce ? 110 : 70} width="120" height="92" fill="url(#hgLiquid)" opacity="0.9">
              {!reduce && <animate attributeName="y" values="70;150;150" keyTimes="0;0.9;1" dur="6s" repeatCount="indefinite" />}
            </rect>
            <rect x="40" y={reduce ? 232 : 268} width="120" height={reduce ? 66 : 30} fill="url(#hgLiquid)" opacity="0.9">
              {!reduce && <animate attributeName="y" values="268;196;196" keyTimes="0;0.9;1" dur="6s" repeatCount="indefinite" />}
              {!reduce && <animate attributeName="height" values="30;100;100" keyTimes="0;0.9;1" dur="6s" repeatCount="indefinite" />}
            </rect>
            {!reduce &&
              [0, 0.45, 0.9].map((begin) => (
                <circle key={begin} cx="100" cy="165" r="3" fill="#F34F97">
                  <animate attributeName="cy" values="165;262" dur="1.35s" begin={`${begin}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;0" dur="1.35s" begin={`${begin}s`} repeatCount="indefinite" />
                </circle>
              ))}
          </g>
          <path d={glass} fill="none" stroke="white" strokeOpacity="0.95" strokeWidth="2.5" />
          <path d="M58 46 C60 96 80 124 90 146" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="5" strokeLinecap="round" />
          <rect x="20" y="16" width="160" height="20" rx="10" fill="url(#hgMetal)" />
          <rect x="20" y="284" width="160" height="20" rx="10" fill="url(#hgMetal)" />
          <rect x="28" y="34" width="6" height="252" rx="3" fill="url(#hgMetal)" opacity="0.9" />
          <rect x="166" y="34" width="6" height="252" rx="3" fill="url(#hgMetal)" opacity="0.9" />
        </svg>
      </div>

      <div className="absolute right-0 top-4 animate-float-slow rounded-[20px] border border-white bg-white/85 px-5 py-3 text-center shadow-card-active backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Period</p>
        <p className="text-[34px] font-bold leading-none tracking-tight text-rose-ink tabular-nums">{days ? Math.round(shown) : "–"}</p>
        <p className="text-[12px] font-semibold text-rose-ink">{days === 1 ? "day" : "days"}</p>
      </div>

      <DataChip className="bottom-6 left-4">
        <Droplets className="size-3.5 text-rose" />
        Typical 3–7 days
      </DataChip>
      <Sparkle size={12} className="left-10 top-16" />
    </SceneBox>
  );
}

/* ------------------------------------------------------------------ */
/* Step 5 — Health details                                             */
/* ------------------------------------------------------------------ */
export function HealthScene({ height, weight }: { height?: number; weight?: number }) {
  const bmi = validBmi(height, weight);
  const shownBmi = useCountUp(bmi ?? 0, 900, 1);
  const fill = bmi ? Math.min(1, Math.max(0, (bmi - 14) / 26)) : 0;
  const circumference = 2 * Math.PI * 34;

  // The measuring line stands beside the guide, scaled to her rendered height.
  const layout = useSceneLayout();
  const girl = guideBox(5, layout);
  const rulerLeft = girl.left + girl.width + 10;
  const rulerTop = Math.round(layout.h - girl.height - girl.bottom + 18);
  const scanStyle: CSSProperties & { "--scan-distance": string } = {
    top: rulerTop,
    width: rulerLeft - 20,
    "--scan-distance": `${girl.height - 40}px`,
  };

  return (
    <>
      {/* Height ruler beside the guide */}
      <div className="absolute bottom-[14px] w-8" style={{ left: rulerLeft, top: rulerTop }} aria-hidden="true">
        <div className="absolute inset-y-0 left-0 w-[2px] rounded-full bg-gradient-to-b from-rose/80 to-rose/25" />
        {Array.from({ length: 25 }, (_, i) => (
          <span key={i} className={cn("absolute left-0 h-px bg-rose/55", i % 4 === 0 ? "w-4" : "w-2")} style={{ top: `${(i / 24) * 100}%` }} />
        ))}
        <span className="absolute -left-[5px] top-0 size-3 -translate-y-1/2 rounded-full bg-rose shadow-glow" />
      </div>
      <div
        className="pointer-events-none absolute left-[20px] h-[3px] animate-scan-y rounded-full bg-gradient-to-r from-transparent via-rose/70 to-transparent shadow-[0_0_6px_rgb(243_79_151/0.2)]"
        style={scanStyle}
      />

      <SceneBox>
        <HoloRing size={380} dashed dot={false} reverse />

        <div key={`h${height}`} className="absolute left-4 top-4 animate-card-appear rounded-[22px] border border-white bg-white/90 px-5 py-3.5 shadow-card-active backdrop-blur">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            <Ruler className="size-3.5 text-rose" /> Height
          </p>
          <p className="text-[34px] font-bold leading-tight text-rose-ink tabular-nums">
            {height ?? "—"}
            <span className="ml-1 text-base">cm</span>
          </p>
        </div>

        {/* BMI dial */}
        <div className={cn("absolute right-2 top-[130px] transition-[opacity,transform] duration-500", bmi ? "scale-100 opacity-100" : "scale-90 opacity-40")}>
          <div className="relative grid size-[150px] animate-visual-float place-items-center rounded-full border border-white bg-white/85 shadow-card-active backdrop-blur">
            <svg width="130" height="130" viewBox="0 0 80 80" className="absolute -rotate-90" aria-hidden="true">
              <circle cx="40" cy="40" r={34} fill="none" stroke="#F8DDE7" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r={34}
                fill="none"
                stroke="#F34F97"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${circumference * fill} ${circumference}`}
                className="transition-[stroke-dasharray] duration-700"
              />
            </svg>
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">BMI</p>
              <p className="text-[30px] font-bold leading-none text-rose-ink tabular-nums">{bmi ? shownBmi.toFixed(1) : "—"}</p>
              <p className="mt-1 text-[11px] font-semibold text-ink-soft">{bmi ? bmiCategory(bmi) : "Awaiting data"}</p>
            </div>
          </div>
        </div>

        {/* Weight card + scale */}
        <div className="absolute bottom-6 left-6">
          <div key={`w${weight}`} className="mb-2 ml-6 w-fit animate-card-appear rounded-2xl border border-white bg-white/90 px-4 py-2 shadow-glass backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Weight</p>
            <p className="text-[24px] font-bold leading-tight text-rose-ink tabular-nums">
              {weight ?? "—"}
              <span className="ml-1 text-sm">kg</span>
            </p>
          </div>
          <div className="relative h-14 w-[200px]">
            <div className="absolute inset-0 rounded-[50%]" style={{ background: MATERIAL.roseMetal }} />
            <div className="absolute inset-[3px] rounded-[50%] bg-gradient-to-b from-white to-blush-100" />
            <div className="absolute left-1/2 top-3 grid h-5 w-14 -translate-x-1/2 place-items-center rounded-md bg-ink/85 text-[9px] font-bold tabular-nums text-rose-bright">
              {weight ? weight.toFixed(1) : "0.0"}
            </div>
          </div>
        </div>

        <Particles count={8} />
      </SceneBox>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Step 6 — Medical info                                               */
/* ------------------------------------------------------------------ */
export function MedicalScene({ conditions, other, meds }: { conditions: string[]; other: string; meds: number | null }) {
  const named = conditions.filter((c) => c !== "Other" && c !== "None");
  const hasPcos = named.includes("PCOS");
  const none = conditions.includes("None");
  const takingMeds = meds !== null && meds > 0;

  return (
    <SceneBox>
      <HoloRing size={400} dashed dot={false} />

      {/* Health record card */}
      <div className="absolute left-2 top-[46px] animate-visual-float">
        <GlassPanel className={cn("w-[250px] rounded-[26px] p-5 transition-shadow duration-500", hasPcos && "shadow-card-active ring-2 ring-rose/60")}>
          <div className="flex items-center gap-2.5">
            <Icon3D icon={FileHeart} active size="sm" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Health record</p>
              <p className="text-sm font-bold text-ink">{none ? "No conditions noted" : named.length ? `${named.length} noted` : "Personal profile"}</p>
            </div>
          </div>
          <div className="mt-4 flex min-h-[64px] flex-wrap content-start gap-1.5">
            {named.slice(0, 5).map((c) => (
              <span
                key={c}
                className={cn(
                  "inline-flex animate-pop items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  c === "PCOS" ? "bg-rose text-white shadow-glow" : "bg-blush-150 text-rose-ink",
                )}
              >
                {c === "PCOS" && <Sparkles className="size-3" />}
                {c}
              </span>
            ))}
            {named.length > 5 && <span className="rounded-full bg-blush-100 px-2.5 py-1 text-[11px] font-semibold text-rose-ink">+{named.length - 5}</span>}
            {!named.length && !none && [70, 52, 84].map((w) => <span key={w} className="h-6 rounded-full bg-blush-100" style={{ width: w }} />)}
          </div>
          <svg viewBox="0 0 200 40" className="mt-3 w-full" aria-hidden="true">
            <path
              d="M0 24 H52 L60 10 L70 34 L80 6 L90 28 L98 24 H200"
              fill="none"
              stroke="#F34F97"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="400"
              className="animate-dash"
            />
          </svg>
        </GlassPanel>
      </div>

      {/* Medical cross orb + shield */}
      <Orb size={80} className="absolute right-4 top-0 grid animate-float place-items-center">
        <Plus className="relative size-9 text-white drop-shadow" strokeWidth={3.2} />
      </Orb>
      <div className="absolute right-8 top-[150px] animate-visual-float">
        <Icon3D icon={ShieldCheck} active size="lg" />
      </div>

      {/* Capsule */}
      <div className={cn("absolute bottom-[40px] right-[10px] transition-opacity duration-500", takingMeds ? "opacity-100" : "opacity-35")}>
        {takingMeds && <div className="absolute -inset-6 animate-glow rounded-full bg-[radial-gradient(circle,rgba(243,79,151,0.45),transparent_70%)] blur-lg" />}
        <div className="relative flex h-[58px] w-[150px] rotate-[-28deg] animate-float overflow-hidden rounded-full shadow-[0_8px_18px_-12px_rgba(217,61,127,0.2)]">
          <span className="h-full w-1/2" style={{ background: "linear-gradient(180deg,#ffffff 0%,#fff1f6 55%,#ffd3e4 100%)" }} />
          <span className="h-full w-1/2" style={{ background: "linear-gradient(180deg,#ffe5ef 0%,#ff9cc6 55%,#f34f97 100%)" }} />
          <span className="absolute left-5 right-5 top-2 h-2.5 rounded-full bg-white/80 blur-[2px]" />
        </div>
      </div>

      {takingMeds && (
        <DataChip className="bottom-[112px] right-[96px] animate-pop">
          <Pill className="size-3.5 text-rose" />
          {meds} {meds === 1 ? "medication" : "medications"}
        </DataChip>
      )}
      {other.trim() && (
        <div className="absolute bottom-[28px] left-2 flex max-w-[180px] animate-pop items-center gap-2 rounded-2xl border border-dashed border-rose/60 bg-white/90 px-3 py-2 text-[12px] font-semibold text-rose-ink shadow-card-active backdrop-blur">
          <Tag className="size-3.5 shrink-0" />
          <span className="truncate">{other.trim()}</span>
        </div>
      )}
    </SceneBox>
  );
}

/* ------------------------------------------------------------------ */
/* Step 7 — Symptoms & mood                                            */
/* ------------------------------------------------------------------ */
const SYMPTOM_CATEGORIES = [
  { cat: "heart", icon: Heart, label: "Heart" },
  { cat: "mood", icon: Smile, label: "Mood" },
  { cat: "head", icon: Brain, label: "Head" },
  { cat: "stomach", icon: Waves, label: "Stomach" },
  { cat: "energy", icon: BatteryLow, label: "Energy" },
  { cat: "sleep", icon: Moon, label: "Sleep" },
] as const;

/** Which body areas each symptom or mood lights up. */
const SYMPTOM_CATEGORY_MAP: Record<string, string[]> = {
  Cramps: ["stomach"],
  Headache: ["head"],
  "Back pain": ["heart"],
  Bloating: ["stomach"],
  "Breast tenderness": ["heart"],
  Fatigue: ["energy", "sleep"],
  Nausea: ["stomach"],
  Acne: ["head"],
  Discharge: ["stomach"],
  Happy: ["mood", "heart"],
  Calm: ["mood", "sleep"],
  Neutral: ["mood"],
  Irritable: ["mood"],
  Sad: ["mood"],
  Anxious: ["mood", "head"],
  "Low energy": ["energy", "sleep"],
};

export function SymptomScene({
  symptoms,
  moods,
  customSymptom,
  customMood,
}: {
  symptoms: string[];
  moods: string[];
  customSymptom: string;
  customMood: string;
}) {
  const selected = [...symptoms, ...moods];
  const categories = SYMPTOM_CATEGORIES.map((c) => ({
    ...c,
    count: selected.filter((s) => SYMPTOM_CATEGORY_MAP[s]?.includes(c.cat)).length,
  }));
  const labels = [...symptoms.map((s) => (s === "Other" ? customSymptom.trim() : s)), ...moods.map((m) => (m === "Other" ? customMood.trim() : m))].filter(Boolean);
  const anyActive = categories.some((c) => c.count > 0);

  return (
    <SceneBox>
      <HoloRing size={330} tilt={70} dot={false} className="border-rose/25" />

      <div className="absolute left-1/2 top-[200px] -translate-x-1/2 -translate-y-1/2">
        <Orb size={116} className={cn("grid place-items-center", anyActive && "animate-soft-pulse")}>
          <Heart className="relative size-9 text-white drop-shadow" />
        </Orb>
      </div>

      {categories.map((c, i) => {
        const angle = (i / categories.length) * 2 * Math.PI - Math.PI / 2;
        return (
          <div key={`${c.cat}-${c.count}`} className="absolute" style={{ left: 210 + Math.cos(angle) * 168, top: 200 + Math.sin(angle) * 150 }}>
            <div className={cn("flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1", c.count > 0 && "animate-pop")}>
              <Icon3D icon={c.icon} active={c.count > 0} size="lg" className={c.count > 0 ? "animate-soft-pulse" : undefined} />
              <span className={cn("rounded-full bg-white/80 px-1.5 text-[10.5px] font-semibold", c.count > 0 ? "text-rose-ink" : "text-ink-muted")}>{c.label}</span>
            </div>
          </div>
        );
      })}

      <Orbit
        className="left-1/2 top-[200px]"
        radius={96}
        duration={38}
        items={labels.slice(0, 6)}
        getKey={(label) => label}
        render={(label) => (
          <span className="inline-flex animate-pop items-center gap-1 whitespace-nowrap rounded-full border border-white bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-rose-ink shadow-glass">
            <span className="size-1.5 rounded-full bg-rose" />
            {label}
          </span>
        )}
      />

      {labels.length === 0 && (
        <DataChip className="bottom-0 left-1/2 -translate-x-1/2">
          <Target className="size-3.5 text-rose" />
          Select what you&apos;d like to track
        </DataChip>
      )}
    </SceneBox>
  );
}

/* ------------------------------------------------------------------ */
/* Step 8 — Notifications                                              */
/* ------------------------------------------------------------------ */
export function NotificationScene({ data }: { data: OnboardingData }) {
  const anyOn = data.periodReminder || data.ovulationReminder;
  const reminders = [
    {
      title: "Period Reminder",
      on: data.periodReminder,
      days: data.periodReminderDays ?? 1,
      msg: `Your period may start ${reminderPhrase(data.periodReminderDays ?? 1)}.`,
    },
    {
      title: "Ovulation Reminder",
      on: data.ovulationReminder,
      days: data.ovulationReminderDays ?? 1,
      msg: `Estimated ovulation ${reminderPhrase(data.ovulationReminderDays ?? 1)}.`,
    },
  ];
  const latest = [...reminders].reverse().find((r) => r.on);

  return (
    <SceneBox>
      {anyOn && (
        <div className="absolute left-1/2 top-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 animate-glow rounded-full bg-[radial-gradient(circle,rgba(243,79,151,0.28),transparent_65%)] blur-lg" />
      )}

      {/* Phone */}
      <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 animate-float">
        <div
          className="relative h-[372px] w-[196px] rounded-[40px] p-[7px] [transform:perspective(900px)_rotateY(-12deg)_rotateX(4deg)]"
          style={{ background: MATERIAL.roseMetal, boxShadow: "0 40px 70px -30px rgba(217,61,127,0.55)" }}
        >
          <div className="relative size-full overflow-hidden rounded-[34px] bg-gradient-to-b from-white via-[#FFF5F9] to-[#FFF0F5]">
            <span className="absolute left-1/2 top-2.5 h-5 w-16 -translate-x-1/2 rounded-full bg-ink/85" />
            <div className="px-4 pt-10 text-center">
              <p className="text-[30px] font-semibold leading-none tracking-tight text-ink">9:41</p>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-rose-ink">MEDNEVO</p>
            </div>
            <div className="mt-4 space-y-2 px-2.5">
              {reminders.map((r) => (
                <div
                  key={r.title}
                  className={cn("rounded-2xl border p-2.5 transition-all duration-300", r.on ? "border-rose/40 bg-white shadow-glass" : "border-white bg-white/60 opacity-70")}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("grid size-6 place-items-center rounded-lg", r.on ? "bg-rose text-white" : "bg-blush-100 text-rose-icon")}>
                      <Bell className="size-3" />
                    </span>
                    <p className="flex-1 text-[10.5px] font-bold text-ink">{r.title}</p>
                    <span className={cn("h-3.5 w-6 rounded-full p-0.5 transition-colors", r.on ? "bg-rose" : "bg-blush-200")}>
                      <span className={cn("block size-2.5 rounded-full bg-white transition-transform", r.on && "translate-x-2.5")} />
                    </span>
                  </div>
                  <p key={r.days} className="mt-1 animate-fade-in text-[9.5px] font-medium text-ink-soft">
                    {r.on ? `${r.days} ${r.days === 1 ? "day" : "days"} before` : "Off"}
                  </p>
                </div>
              ))}
            </div>
            {latest && (
              <div
                key={latest.title + latest.days}
                className="absolute inset-x-2.5 bottom-4 flex animate-notify gap-2 rounded-2xl border border-white bg-white/95 p-2.5 shadow-card-active"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-rose text-white">
                  <BellRing className="size-3.5" />
                </span>
                <p className="text-[9.5px] font-semibold leading-snug text-ink-soft">{latest.msg}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <DataChip className="right-0 top-8 animate-float-slow">
        <span className="grid size-6 place-items-center rounded-full bg-rose text-white">
          <Bell className="size-3" />
        </span>
        {data.periodReminder ? "Period reminder on" : "Period reminder"}
      </DataChip>
      {/* Below the phone (which spans y≈25–397 and only floats upward), so the chip never covers its animated notification. */}
      <DataChip className="bottom-0 right-0 animate-float">
        <span className="grid size-6 place-items-center rounded-full bg-rose text-white">
          <Target className="size-3" />
        </span>
        {data.ovulationReminder ? "Ovulation reminder on" : "Ovulation reminder"}
      </DataChip>
    </SceneBox>
  );
}

/* ------------------------------------------------------------------ */
/* Step 9 — Birth control                                              */
/* ------------------------------------------------------------------ */
export function BirthControlScene({
  answer,
  category,
  method,
}: {
  answer: OnboardingData["birthControl"];
  category: OnboardingData["birthControlCategory"];
  method: string;
}) {
  const orbitMethods: readonly string[] =
    category && category !== "other" ? BIRTH_CONTROL_METHODS_BY_CATEGORY[category].filter((m) => m !== "Other") : [];

  return (
    <SceneBox>
      <div className="absolute left-1/2 top-[45%] size-[300px] -translate-x-1/2 -translate-y-1/2 animate-glow rounded-full bg-[radial-gradient(circle,rgba(236,106,159,0.3),transparent_65%)] blur-xl" />

      {/* Shield */}
      <svg width="270" height="315" viewBox="0 0 240 280" className="absolute left-1/2 top-[40px] -translate-x-1/2" aria-hidden="true">
        <defs>
          <linearGradient id="shield-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#FFD3E4" stopOpacity="0.6" />
            <stop offset="1" stopColor="#FF9CC6" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="shield-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFF1F6" />
            <stop offset="0.5" stopColor="#F34F97" />
            <stop offset="1" stopColor="#FFC2DA" />
          </linearGradient>
        </defs>
        <path d="M120 10 L214 46 V130 C214 196 172 244 120 266 C68 244 26 196 26 130 V46 Z" fill="url(#shield-fill)" stroke="url(#shield-edge)" strokeWidth="2.5" />
        <path d="M120 26 L198 56 V128 C198 182 164 222 120 242" fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* Centre piece reflects the answer */}
      <div key={answer || "none"} className="absolute left-1/2 top-[185px] -translate-x-1/2 -translate-y-1/2 animate-scene-in">
        {answer === "no" ? (
          <div className="grid place-items-center">
            <div className="animate-hologram-rotate">
              <PhaseRing cycle={28} duration={5} size={170} stroke={18} showOvulation />
            </div>
            <span className="absolute text-[12px] font-bold text-rose-ink">Your cycle</span>
          </div>
        ) : answer === "yes" ? (
          <Icon3D icon={ShieldCheck} active size="lg" />
        ) : (
          <div
            className={cn("grid size-[92px] place-items-center rounded-[28px] text-white shadow-glow", answer === "prefer-not-to-say" ? "animate-soft-pulse" : "opacity-70")}
            style={{ background: MATERIAL.brand }}
          >
            <Lock className="size-10" strokeWidth={2} />
          </div>
        )}
      </div>

      {answer === "yes" && orbitMethods.length > 0 && (
        <Orbit
          className="left-1/2 top-[185px]"
          radius={176}
          duration={46}
          items={orbitMethods}
          getKey={(m) => m}
          render={(m) => {
            const on = m === method;
            return (
              <div className="flex flex-col items-center gap-0.5">
                <Icon3D glyph={<MethodGlyph method={m} className="size-5" />} active={on} className={on ? "scale-110" : undefined} />
                <span className={cn("rounded-full bg-white/90 px-1.5 text-[10px] font-semibold", on ? "text-rose-ink" : "text-ink-muted")}>{m}</span>
              </div>
            );
          }}
        />
      )}

      {/* Bottom-right: the method orbit sweeps through the top of the box (radius 176 around y=185), so a
          chip up there collides with each icon as it passes. Nothing orbits below y≈392. */}
      <DataChip className="bottom-1 right-1">
        <Lock className="size-3.5 text-rose" />
        {answer === "prefer-not-to-say" ? "Kept private" : answer === "no" ? "Insights from your logs" : "Private to you"}
      </DataChip>

      <Flower size={46} className="bottom-[6px] left-[40px]" />
      <Flower size={32} hue="blush" className="bottom-[4px] right-[148px]" />
    </SceneBox>
  );
}

/* ------------------------------------------------------------------ */
/* Step 10 — Fertility goals                                           */
/* ------------------------------------------------------------------ */
const TRACKING_ICONS: Record<TrackingKey, LucideIcon> = {
  intercourse: HeartPulse,
  cervicalMucus: Droplets,
  bbt: Thermometer,
  lhTest: TestTube,
  symptoms: Target,
  mood: Smile,
  libido: Heart,
};

const TRACKING_SLOTS = [
  "left-0 top-[48px]",
  "right-0 top-[48px]",
  "left-0 top-[180px]",
  "right-0 top-[180px]",
  "left-0 top-[250px]",
  "right-0 top-[250px]",
  "left-1/2 top-[300px] -translate-x-1/2",
];

export function FertilityScene({ data }: { data: OnboardingData }) {
  const goal = data.fertilityGoal;
  const cycle = data.cycleLengthOption === "known" && data.cycleLength ? data.cycleLength : 28;
  const duration = Math.min(effectiveDuration(data) ?? 5, 12);

  const shown: TrackingKey[] =
    goal === "trying-to-conceive"
      ? ["cervicalMucus", "intercourse", "bbt", "lhTest"]
      : goal === "pregnancy-prevention"
        ? ["intercourse"]
        : goal === "understand-cycle"
          ? TRACKING_KEYS.filter((k) => data.fertilityTracking[k])
          : [];
  const required = goal ? GOAL_TRACKING[goal].required : [];
  const showBbt = goal === "trying-to-conceive" || (!!goal && data.fertilityTracking.bbt);
  const showLh = goal === "trying-to-conceive" || (!!goal && data.fertilityTracking.lhTest);

  return (
    <SceneBox>
      <div className="absolute left-1/2 top-[40%] size-[300px] -translate-x-1/2 -translate-y-1/2 animate-glow rounded-full bg-[radial-gradient(circle,rgba(243,79,151,0.25),rgba(255,214,196,0.18)_50%,transparent_70%)] blur-xl" />

      {/* Fertility wheel */}
      <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
        <div className="animate-spin-slower">
          <PhaseRing
            cycle={cycle}
            duration={duration}
            size={280}
            stroke={30}
            fertileWindow={goal === "trying-to-conceive" || goal === "pregnancy-prevention"}
            showOvulation
          />
        </div>
        <div className="absolute inset-0 grid place-items-center">
          <Orb size={112} className="grid place-items-center">
            <Activity className="relative size-8 text-white drop-shadow" />
          </Orb>
        </div>
      </div>

      <DataChip key={goal || "none"} className="left-1/2 top-2 -translate-x-1/2 animate-scale-in">
        <span className="size-2 rounded-full bg-rose-bright" />
        {goal ? (goal === "understand-cycle" ? "Your cycle phases" : "Fertile window + ovulation") : "Choose your focus"}
      </DataChip>

      {shown.map((key, i) => {
        const Icon = TRACKING_ICONS[key];
        return (
          <div
            key={`${goal}-${key}`}
            className={cn("absolute flex animate-card-in items-center gap-2 rounded-2xl border border-white bg-white/90 p-1.5 pr-3 shadow-glass backdrop-blur", TRACKING_SLOTS[i])}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <Icon3D icon={Icon} active={data.fertilityTracking[key]} size="sm" className={required.includes(key) ? "animate-pulse-soft" : undefined} />
            <span className="text-[11px] font-semibold text-ink-soft">{trackingLabel(goal, key)}</span>
          </div>
        );
      })}

      {goal === "understand-cycle" && shown.length === 0 && (
        <>
          <DataChip className="left-0 top-[60px]">
            <span className="size-2 rounded-full bg-rose" />
            Menstrual
          </DataChip>
          <DataChip className="right-0 top-[60px]">
            <span className="size-2 rounded-full bg-[#FFC2DA]" />
            Follicular
          </DataChip>
          <DataChip className="left-0 top-[230px]">
            <span className="size-2 rounded-full bg-rose-bright" />
            Ovulation
          </DataChip>
          <DataChip className="right-0 top-[230px]">
            <span className="size-2 rounded-full bg-[#FF9CC6]" />
            Luteal
          </DataChip>
        </>
      )}

      {goal === "pregnancy-prevention" && (
        <DataChip className="bottom-[96px] right-0 animate-scale-in">
          <ShieldCheck className="size-3.5 text-rose" />
          Estimates only — not contraception
        </DataChip>
      )}

      {/* BBT chart + LH test */}
      <div className="absolute inset-x-2 bottom-2 flex gap-2">
        {showBbt && (
          <GlassPanel className="flex-1 animate-card-in rounded-2xl px-3 py-2">
            <p className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              <Thermometer className="size-3 text-rose" /> BBT
            </p>
            <svg viewBox="0 0 200 40" className="h-8 w-full" aria-hidden="true">
              <path
                d="M0 30 C20 29 40 32 60 30 S95 31 110 32 S130 22 140 18 S175 12 200 13"
                fill="none"
                stroke="#F34F97"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="400"
                className="animate-dash"
              />
              <circle cx="110" cy="32" r="3.5" fill="#FF5AA5" />
            </svg>
          </GlassPanel>
        )}
        {showLh && (
          <GlassPanel className="w-[120px] animate-card-in rounded-2xl px-3 py-2">
            <p className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              <TestTube className="size-3 text-rose" /> LH test
            </p>
            <div className="mt-1.5 flex h-6 items-center gap-1.5 rounded-md border border-blush-300 bg-white px-2">
              <span className="h-4 w-1 rounded bg-rose" />
              <span className="h-4 w-1 animate-pulse rounded bg-rose/80" />
              <span className="ml-auto text-[9px] font-bold text-rose-ink">Peak</span>
            </div>
          </GlassPanel>
        )}
      </div>
    </SceneBox>
  );
}

/* ------------------------------------------------------------------ */
/* Step 11 — Review                                                    */
/* ------------------------------------------------------------------ */
export function ReviewScene({ data }: { data: OnboardingData }) {
  const duration = effectiveDuration(data);
  const bmi = validBmi(data.height, data.weight);
  const last = parseISODate(data.lastPeriod);
  const signals = data.symptoms.length + data.moods.length;
  const reminders = [data.periodReminder, data.ovulationReminder].filter(Boolean).length;

  const tiles = [
    { icon: CalendarHeart, label: "Last period", value: last ? last.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—" },
    { icon: Moon, label: "Cycle", value: data.cycleLengthOption === "known" && data.cycleLength ? `${data.cycleLength} days` : "Learning" },
    { icon: Heart, label: "Health", value: bmi ? `BMI ${bmi.toFixed(1)}` : "—" },
    { icon: Sparkles, label: "Symptoms", value: signals ? `${signals} tracked` : "None yet" },
    { icon: Bell, label: "Notifications", value: reminders ? `${reminders} on` : "Off" },
    { icon: Activity, label: "Fertility goal", value: FERTILITY_GOAL_OPTIONS.find((o) => o.value === data.fertilityGoal)?.label ?? "—" },
  ];

  return (
    <SceneBox>
      <div className="absolute left-1/2 top-[46%] size-[320px] -translate-x-1/2 -translate-y-1/2 animate-glow rounded-full bg-[radial-gradient(circle,rgba(243,79,151,0.22),transparent_65%)] blur-xl" />

      <GlassPanel className="absolute inset-x-2 top-4 rounded-[26px] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-ink">Your cycle dashboard</p>
          <span className="text-[10px] font-semibold text-ink-muted">{duration ? `${duration}-day period` : ""}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {tiles.map((tile, i) => (
            <div
              key={tile.label}
              className="flex animate-card-in items-center gap-2.5 rounded-2xl border border-white bg-white/90 p-2.5 shadow-glass"
              style={{ animationDelay: `${120 + i * 110}ms` }}
            >
              <Icon3D icon={tile.icon} active={i === 0 || i === 5} size="sm" />
              <div className="min-w-0">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{tile.label}</p>
                <p className="truncate text-[12.5px] font-bold text-ink">{tile.value}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      <Flower size={58} className="bottom-[30px] right-[40px] animate-float-slow" />
      <Flower size={40} hue="blush" className="bottom-[26px] right-[110px]" />
      <Particles count={10} />
    </SceneBox>
  );
}

/* ------------------------------------------------------------------ */
/* Contextual scene for a step — the animated layer behind the guide    */
/* ------------------------------------------------------------------ */
export function StepScene({ step, data }: { step: StepId; data: OnboardingData }) {
  const duration = effectiveDuration(data);
  const known = data.cycleLengthOption === "known" && !!data.cycleLength;
  const label = known ? String(data.cycleLength) : data.cycleLengthOption === "varies" ? "~" : data.cycleLengthOption === "unsure" ? "?" : "28";

  switch (step) {
    case 1:
      return <LastPeriodScene iso={data.lastPeriod} />;
    case 2:
      return <CycleLengthScene cycle={known && data.cycleLength ? data.cycleLength : 28} label={label} known={known} />;
    case 3:
      return <PatternScene regularity={data.periodRegularity} />;
    case 4:
      return <DurationScene days={duration} />;
    case 5:
      return <HealthScene height={data.height} weight={data.weight} />;
    case 6:
      return (
        <MedicalScene
          conditions={data.medicalConditions}
          other={data.medicalConditions.includes("Other") ? data.otherMedicalCondition : ""}
          meds={data.takingMedication === null ? null : data.takingMedication ? data.medications.filter((m) => m.trim()).length || 1 : 0}
        />
      );
    case 7:
      return <SymptomScene symptoms={data.symptoms} moods={data.moods} customSymptom={data.customSymptom} customMood={data.customMood} />;
    case 8:
      return <NotificationScene data={data} />;
    case 9:
      return <BirthControlScene answer={data.birthControl} category={data.birthControlCategory} method={data.birthControlMethod} />;
    case 10:
      return <FertilityScene data={data} />;
    case 11:
      return <ReviewScene data={data} />;
  }
}
