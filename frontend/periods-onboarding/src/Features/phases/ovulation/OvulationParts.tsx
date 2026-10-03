import {
  CalendarHeart,
  CircleCheck,
  Droplet,
  FlaskConical,
  Heart,
  ShieldAlert,
  Thermometer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import mucusArt from "../../../assets/phases/follicular/cervical_mucus_fingers.png";
import lhArt from "../../../assets/phases/follicular/lh_test_device.png";
import libidoArt from "../../../assets/phases/follicular/libido_heart.png";
import { useAsync } from "../../../hooks/useAsync";
import { addDays } from "../../../lib/isoDate";
import type { CycleState } from "../../../services/cycle";
import { getPhaseInsight } from "../../../services/insights";
import { getDailyLog, getLogRange, getMedicationHistory, saveDailyLog, type DailyLog } from "../../../services/logs";
import type { FertilityTracking } from "../../../types";
import {
  RISE_THRESHOLD_C,
  analyseBbt,
  fertileWindow,
  toFahrenheit,
  windowStatus,
  type BbtAnalysis,
  type FertileWindow,
  type WindowStatus,
} from "./fertility";

// ------------------------------------------------------------------ data hook
/** Everything an ovulation screen reads for the selected day. All values are real (backend), nothing is pre-filled. */
export function useOvulationData(state: CycleState) {
  const day = state.date;
  const log = useAsync(useCallback((s: AbortSignal) => getDailyLog(day, s), [day]));
  const range = useAsync(useCallback((s: AbortSignal) => getLogRange(addDays(day, -9), day, s), [day]));
  const meds = useAsync(useCallback((s: AbortSignal) => getMedicationHistory(addDays(day, -60), day, s), [day]));
  const insight = useAsync(useCallback((s: AbortSignal) => getPhaseInsight(day, s), [day]));

  const fw: FertileWindow | null = useMemo(() => fertileWindow(state.ovulation?.date), [state.ovulation?.date]);
  const status: WindowStatus | null = useMemo(() => (fw ? windowStatus(day, fw) : null), [day, fw]);
  const logs = range.data?.logs;
  const bbt: BbtAnalysis = useMemo(() => analyseBbt(logs ?? [], day), [logs, day]);

  const refetchLogs = useCallback(() => {
    log.refetch();
    range.refetch();
  }, [log, range]);

  return { day, log, meds, insight, fw, status, bbt, refetchLogs };
}

/** A card is shown when the user turned that tracking on in Settings, or already logged it for the day. */
export const trackingOn = (tracking: Partial<FertilityTracking>, key: keyof FertilityTracking, logged: boolean) =>
  tracking[key] === true || logged;

// ------------------------------------------------------------------ small shared UI
const panel = "rounded-lu-card border border-lu-brand-line bg-white p-lu-card shadow-lu-card";
const NOT_LOGGED = "Not logged";

export function Hero({
  eyebrow,
  heading,
  description,
  onLogPeriod,
  extra,
  extraFirst = false,
  image,
}: {
  eyebrow?: string;
  heading: string;
  description: string;
  onLogPeriod: () => void;
  extra?: ReactNode;
  /** Render `extra` (e.g. View Tips) before the Log period button. */
  extraFirst?: boolean;
  image?: string;
}) {
  return (
    <section className={`${panel} flex min-h-[190px] items-center justify-between gap-5 overflow-hidden`}>
      <div className="min-w-0 max-w-[640px]">
        {eyebrow && (
          <span className="inline-flex rounded-full bg-lu-brand-soft px-3 py-1 text-lu-caption font-bold uppercase tracking-[0.12em] text-lu-brand-strong">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-2 text-lu-heading font-semibold text-lu-ink">{heading}</h2>
        <p className="mt-2.5 text-lu-body text-lu-ink-muted">{description}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {extraFirst && extra}
          <button type="button" onClick={onLogPeriod} className="rounded-full bg-lu-brand-soft px-5 py-2.5 text-lu-label font-semibold text-lu-brand-strong hover:bg-[#FBCFE8]">
            Log period
          </button>
          {!extraFirst && extra}
        </div>
      </div>
      {image && <img src={image} alt="" className="hidden w-[clamp(110px,12vw,170px)] shrink-0 object-contain sm:block" />}
    </section>
  );
}

export function StatusBanner({ title, text, tone }: { title: string; text: string; tone: "calm" | "alert" }) {
  return (
    <section
      role="status"
      className={`rounded-lu-card border p-lu-card shadow-lu-card ${tone === "alert" ? "border-[#F9A8D4] bg-gradient-to-r from-[#FDF2F8] to-[#F5F0FF]" : "border-lu-brand-line bg-white"}`}
    >
      <h2 className="text-lu-heading font-semibold text-lu-ink">{title}</h2>
      <p className="mt-1 text-lu-body text-lu-ink-muted">{text}</p>
    </section>
  );
}

export interface Fact {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
}

export function FactGrid({ facts }: { facts: Fact[] }) {
  return (
    <ul className="grid grid-cols-1 gap-lu-grid sm:grid-cols-2 xl:grid-cols-4">
      {facts.map(({ icon: Icon, label, value, note }) => (
        <li key={label} className={`${panel} flex items-center gap-3.5 !p-4`}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lu-brand-soft text-lu-brand-strong">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-lu-caption font-semibold uppercase tracking-[0.1em] text-lu-ink-muted">{label}</p>
            <p className="mt-1 truncate text-lu-heading font-bold text-lu-ink">{value}</p>
            <p className="mt-0.5 text-lu-caption text-lu-ink-muted">{note}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CardTitle({ icon: Icon, tone, label }: { icon: LucideIcon; tone: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tone}`} aria-hidden="true">
        <Icon className="size-4" />
      </span>
      <h3 className="text-lu-label font-semibold text-lu-ink">{label}</h3>
    </div>
  );
}

function LogLink({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="mt-3 text-lu-label font-semibold text-lu-brand-strong hover:underline">
      {label}
    </button>
  );
}

// ------------------------------------------------------------------ readiness cards (ovulation-phase design)
const weekday = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });

function BbtSparkline({ points }: { points: BbtAnalysis["points"] }) {
  if (points.length < 2) {
    return <p className="mt-4 text-lu-caption text-lu-ink-muted">Log your temperature on a few mornings to see your trend.</p>;
  }
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 0.1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 460;
    const y = 40 - ((p.value - min) / range) * 34;
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  // At most 7 evenly spaced weekday labels so a long range never crowds the axis.
  const step = Math.max(1, Math.ceil((points.length - 1) / 6));
  const labelled = points.filter((_, i) => i % step === 0 || i === points.length - 1);
  return (
    <div className="mt-3" aria-hidden="true">
      <svg className="h-14 w-full" viewBox="0 0 460 48" preserveAspectRatio="none">
        <path d={`${line} L460,48 L0,48 Z`} fill="#8B7CF6" fillOpacity="0.15" />
        <path d={line} fill="none" stroke="#7C6FF0" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between text-lu-caption text-lu-ink-muted">
        {labelled.map((p) => (
          <span key={p.date}>{weekday(p.date)}</span>
        ))}
      </div>
    </div>
  );
}

/** Today's temperature in °F inside a soft ring, with the rise over baseline underneath. */
function TempRing({ celsius, delta }: { celsius: number; delta: number | null }) {
  return (
    <div className="relative grid size-[clamp(92px,8vw,112px)] shrink-0 place-items-center rounded-full bg-white shadow-[0_6px_18px_-6px_rgba(236,72,153,0.35)]">
      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill="none" stroke="#FBE3EF" strokeWidth="5" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#EC4899" strokeWidth="5" strokeLinecap="round" strokeDasharray="276" strokeDashoffset="70" />
      </svg>
      <div className="relative text-center">
        <p className="text-lu-label font-bold text-lu-ink">{toFahrenheit(celsius).toFixed(2)}°F</p>
        {delta != null && delta > 0 && <p className="text-[9px] leading-tight text-[#EC4899]">+{delta.toFixed(2)}°C above baseline</p>}
      </div>
    </div>
  );
}

export function BbtCard({ analysis, title = "Basal body temp", onOpen }: { analysis: BbtAnalysis; title?: string; onOpen: () => void }) {
  const { latest, baseline, delta, state, points } = analysis;
  const note =
    state === "no_reading"
      ? "No reading for this day yet."
      : state === "not_enough"
        ? "Log a few more mornings to compare with your baseline."
        : state === "rising"
          ? `Your body temperature is ${delta!.toFixed(2)}°C above your baseline. This rise supports that ovulation may be near.`
          : `Close to your recent baseline (${baseline!.toFixed(2)}°C). A rise of ${RISE_THRESHOLD_C}°C or more usually follows ovulation.`;
  const headline = delta != null ? `${delta.toFixed(2)}°` : latest != null ? `${latest.toFixed(2)}°C` : NOT_LOGGED;
  return (
    <section className={panel} aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <CardTitle icon={Thermometer} tone="bg-[#EEF2FF] text-[#6366F1]" label={title} />
        {state === "rising" && <span className="rounded-full bg-[#E9F9EF] px-2.5 py-0.5 text-lu-caption font-semibold text-[#16A34A]">Above baseline</span>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-2 text-lu-title font-bold text-lu-ink">
            {headline}
            {state === "rising" && (
              <span className="inline-flex items-center gap-1 text-lu-caption font-semibold text-[#16A34A]">
                <TrendingUp className="size-3" aria-hidden="true" /> Rising
              </span>
            )}
          </p>
          <p className="mt-2 max-w-[420px] text-lu-label text-lu-ink-muted">{note}</p>
        </div>
        {latest != null && <TempRing celsius={latest} delta={delta} />}
      </div>
      <BbtSparkline points={points} />
      {latest == null && <LogLink label="Log today's temperature" onOpen={onOpen} />}
    </section>
  );
}

export function MucusCard({ log, scale, meta, onOpen }: { log: DailyLog | null; scale: readonly string[]; meta: Record<string, { description: string; badge: string }>; onOpen: () => void }) {
  const value = log?.cervicalMucus ?? null;
  const info = value ? meta[value] : null;
  return (
    <section className={`${panel} relative overflow-hidden`} aria-label="Cervical mucus">
      <div className="flex items-center justify-between gap-3">
        <CardTitle icon={Droplet} tone="bg-lu-brand-soft text-lu-brand-strong" label="Cervical mucus" />
        {info && <span className="rounded-full bg-[#F472B6] px-2.5 py-1 text-lu-caption font-bold text-white">{info.badge}</span>}
      </div>
      <div className="relative z-10 mt-4 max-w-[60%]">
        <p className="text-lu-title font-bold text-lu-ink">{value ?? NOT_LOGGED}</p>
        <p className="mt-1 text-lu-label text-lu-ink-muted">{info?.description ?? "Log it to see what it means for your fertility."}</p>
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Consistency scale">
          {scale.map((s) => (
            <span key={s} title={s} className={`rounded-md px-2 py-0.5 text-lu-caption font-medium ${s === value ? "bg-[#F472B6] text-white" : "bg-[#F3F4F6] text-lu-ink-soft"}`}>
              {s === "Egg white" && s === value ? "EW" : s}
            </span>
          ))}
        </div>
        {!value && <LogLink label="Log today's mucus" onOpen={onOpen} />}
      </div>
      <img src={mucusArt} alt="" className="absolute bottom-0 right-0 hidden w-[clamp(96px,11vw,170px)] object-contain min-[420px]:block" />
    </section>
  );
}

export function LhCard({ log, meta, onOpen }: { log: DailyLog | null; meta: Record<string, string>; onOpen: () => void }) {
  const value = log?.lhTest ?? null;
  return (
    <section className={`${panel} relative min-h-[190px] overflow-hidden`} aria-label="LH ovulation test">
      <CardTitle icon={FlaskConical} tone="bg-[#EAF6FE] text-[#38A5E8]" label="LH Ovulation Test" />
      <div className="relative z-10 mt-4 max-w-[62%]">
        <p className="text-lu-title font-bold text-lu-ink">{value ?? NOT_LOGGED}</p>
        <p className="mt-1 text-lu-label text-lu-ink-muted">{value ? meta[value] : "Log a test result to see it here."}</p>
        {value && (
          <div className="mt-3 flex h-7 w-[clamp(72px,7vw,92px)] items-center rounded-lg border border-lu-brand-line bg-white px-2" aria-hidden="true">
            <span className={`h-4 rounded-sm bg-[#EC4899] ${value === "Peak" || value === "High" ? "w-10" : "w-1.5"}`} />
          </div>
        )}
        {!value && <LogLink label="Log today's test" onOpen={onOpen} />}
      </div>
      <img src={lhArt} alt="" className="absolute bottom-0 right-1 h-[clamp(96px,9vw,140px)] w-auto object-contain" />
    </section>
  );
}

export function LibidoCard({ log, meta, onOpen }: { log: DailyLog | null; meta: Record<string, string>; onOpen: () => void }) {
  const value = log?.libido ?? null;
  return (
    <section className={`${panel} relative min-h-[190px] overflow-hidden`} aria-label="Libido">
      <CardTitle icon={Heart} tone="bg-[#FDECF3] text-[#EC4899]" label="Libido" />
      <div className="relative z-10 mt-4 max-w-[62%]">
        <p className="text-lu-title font-bold text-lu-ink">{value ?? NOT_LOGGED}</p>
        <p className="mt-1 text-lu-label text-lu-ink-muted">{value ? meta[value] : "Log it to track changes through your cycle."}</p>
        {!value && <LogLink label="Log today's libido" onOpen={onOpen} />}
      </div>
      <img src={libidoArt} alt="" className="absolute -bottom-1 -right-2 w-[clamp(96px,9vw,136px)] object-contain" />
    </section>
  );
}

/** Level comes from where today sits in the estimated window. It is not a measured score. */
export function FertilityLevelCard({
  level,
  signals,
}: {
  level: { label: string; percent: number; note: string };
  signals: { label: string; value: string | null }[];
}) {
  return (
    <section className={panel} aria-label="Fertility level">
      <div className="flex items-center justify-between gap-3">
        <CardTitle icon={Heart} tone="bg-[#F1EDFE] text-[#8B5CF6]" label="Fertility level" />
        <span className="text-lu-caption font-bold uppercase tracking-wide text-[#8B5CF6]">{level.label}</span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <p className="text-lu-title font-bold text-lu-ink">
          {level.percent}
          <span className="ml-1 text-lu-label font-normal text-lu-ink-muted">/ 100</span>
        </p>
        <p className="text-lu-caption text-lu-ink-muted">{level.note}</p>
      </div>
      <div className="mt-3 h-[9px] w-full overflow-hidden rounded-full bg-[#EEEEF6]" role="img" aria-label={`Fertility level ${level.label}, estimate`}>
        <div className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#A78BFA]" style={{ width: `${level.percent}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {signals.map((s) => (
          <div key={s.label} className="min-w-0 rounded-full bg-[#F8F7FB] py-1.5 text-center">
            <p className="truncate text-lu-caption uppercase tracking-[0.1em] text-lu-ink-muted">{s.label}</p>
            <p className={`truncate px-2 text-lu-label font-semibold ${s.value ? "text-[#4F46E5]" : "text-lu-ink-muted"}`}>{s.value ?? NOT_LOGGED}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Yes / No for today. Saves straight to the daily log, so Calendar, Trends and the insight see it. */
export function IntercourseCard({ log, day, onSaved }: { log: DailyLog | null; day: string; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const value = log?.intercourse ?? null;

  const choose = async (next: boolean) => {
    if (!log || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveDailyLog(day, { ...log, intercourse: next });
      onSaved();
    } catch {
      setError("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={panel} aria-label="Intercourse">
      <CardTitle icon={CalendarHeart} tone="bg-[#FDECF3] text-[#EC4899]" label="Intercourse today" />
      <p className="mt-3 text-lu-label text-lu-ink-muted">Logged dates are compared with your fertile window.</p>
      <div className="mt-4 flex gap-3">
        {[
          { label: "Yes", v: true },
          { label: "No", v: false },
        ].map(({ label, v }) => (
          <button
            key={label}
            type="button"
            disabled={saving || !log}
            aria-pressed={value === v}
            onClick={() => choose(v)}
            className={`rounded-full px-6 py-2 text-lu-label font-semibold transition-colors disabled:opacity-60 ${value === v ? "bg-lu-brand-strong text-white" : "bg-lu-brand-soft text-lu-brand-strong hover:bg-[#FBCFE8]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-lu-caption text-[#B91C1C]">{error}</p>}
    </section>
  );
}

export function ProtectionCard() {
  return (
    <section className="flex items-start gap-3 rounded-lu-card border border-[#F9A8D4] bg-[#FDF1F6] p-lu-card" aria-label="Protection reminder">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F7A8C8] text-white" aria-hidden="true">
        <ShieldAlert className="size-[18px]" />
      </span>
      <div>
        <h3 className="text-lu-label font-semibold text-lu-ink">Keep your usual protection</h3>
        <p className="mt-1 text-lu-label text-lu-ink-muted">
          Tracking can show when pregnancy is more or less likely, but it cannot guarantee it. Continue using your regular method of protection.
        </p>
      </div>
    </section>
  );
}

export function CheckList({ items, check }: { items: string[]; check: string }) {
  return (
    <ul className="mt-2.5 space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-lu-label text-lu-ink-soft">
          <CircleCheck className={`mt-px size-[18px] shrink-0 ${check}`} aria-hidden="true" />
          <span className="min-w-0">{t}</span>
        </li>
      ))}
    </ul>
  );
}