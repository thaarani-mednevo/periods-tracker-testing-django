import { Minus, Plus } from 'lucide-react';
import { GLASS_ML, WATER_TARGET_ML } from './constants';

interface HydrationSectionProps {
  ml: number;
  percent: number;
  remaining: number;
  glasses: number;
  onChange: (deltaMl: number) => void;
}

const TOTAL_GLASSES = WATER_TARGET_ML / GLASS_ML;
const fmt = (n: number) => n.toLocaleString('en-US');

function Bottle({ percent }: { percent: number }) {
  return (
    <figure className="flex flex-col items-center gap-2">
      <div className="relative h-[clamp(128px,9.5vw,156px)] w-[clamp(76px,5.6vw,92px)]">
        {/* cap */}
        <span className="absolute left-1/2 top-0 h-[10%] w-[44%] -translate-x-1/2 rounded-t-md bg-[#E5E7EB]" />
        {/* glass */}
        <div className="absolute inset-x-0 bottom-0 top-[8%] overflow-hidden rounded-[22px] border-2 border-[#E5E7EB] bg-[#F8FAFC]">
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-[#5EEAD4] to-[#0D9488] transition-[height] duration-300"
            style={{ height: `${percent}%` }}
          />
          <span className="absolute left-2 top-2 bottom-2 w-1 rounded-full bg-white/50" />
          <span className="absolute inset-0 flex items-center justify-center text-lu-heading font-bold text-white drop-shadow">{percent}%</span>
        </div>
      </div>
      <figcaption className="text-lu-caption text-lu-ink-faint">Thermal Crystal Bottle</figcaption>
    </figure>
  );
}

export function HydrationSection({ ml, percent, remaining, glasses, onChange }: HydrationSectionProps) {
  return (
    <section className="lu-card flex min-w-0 flex-col gap-[clamp(12px,1.1vw,18px)] p-lu-card">
      <header className="flex flex-wrap items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#CCFBF1] bg-white">
          <span className="h-4 w-4 rounded-full border-2 border-[#14B8A6]" />
        </span>
        {/* min width lets the status badge wrap below on narrow screens instead of squeezing the title */}
        <div className="min-w-[10rem] flex-1">
          <h3 className="text-lu-heading font-semibold text-lu-ink">Hydration</h3>
          <p className="mt-0.5 text-lu-label text-lu-ink-muted">Stay hydrated throughout the day.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#99F6E4] bg-[#F0FDFA] px-3 py-1 text-lu-caption font-semibold text-[#0F766E]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6]" />
          {percent}% Optimal
        </span>
      </header>

      <div className="flex flex-col items-center gap-[clamp(16px,2vw,32px)] min-[480px]:flex-row">
        <Bottle percent={percent} />
        <div className="w-full min-w-0 flex-1">
          <p className="text-lu-caption font-semibold uppercase tracking-[0.1em] text-lu-ink-muted">Water intake</p>
          <p className="mt-1 text-lu-title font-bold text-lu-ink">
            {fmt(ml)} <span className="text-lu-label font-medium text-lu-ink-muted">ml</span>
          </p>
          <p className="text-lu-caption text-lu-ink-muted">
            Target: {fmt(WATER_TARGET_ML)} ml · <span className="font-semibold text-[#0F766E]">{fmt(remaining)} ml left</span>
          </p>

          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Water intake">
            <div className="h-full rounded-full bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF]" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-lu-caption text-lu-ink-faint">
            <span>0 ml</span>
            <span>Target reached: {percent}%</span>
            <span>{WATER_TARGET_ML} ml</span>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-lu-caption font-semibold text-lu-ink-soft">
              {Math.min(glasses, TOTAL_GLASSES)} / {TOTAL_GLASSES} glasses logged
            </p>
            <p className="text-lu-caption text-lu-ink-faint">{GLASS_ML} ml / glass</p>
          </div>
          <ol className="mt-2 grid grid-cols-8 gap-1.5" aria-hidden="true">
            {Array.from({ length: TOTAL_GLASSES }, (_, i) => (
              <li
                key={i}
                className={`flex h-[clamp(22px,2vw,28px)] items-center justify-center rounded-md ${i < glasses ? 'bg-gradient-to-b from-[#22D3EE] to-[#0EA5E9]' : 'border border-lu-line bg-[#F8FAFC]'}`}
              >
                {i < glasses && <span className="h-2 w-[2px] rounded-full bg-white/80" />}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3">
        <button
          type="button"
          aria-label={`Remove ${GLASS_ML} ml`}
          onClick={() => onChange(-GLASS_ML)}
          disabled={ml <= 0}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-lu-line bg-white text-lu-ink-muted transition-colors hover:border-[#99F6E4] disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onChange(GLASS_ML)}
          className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#2DD4BF] px-4 text-lu-label font-semibold text-white shadow-soft transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          {/* shorter wording on the narrowest phones so the label never gets cut off */}
          <span className="min-[360px]:hidden">Add {GLASS_ML} ml</span>
          <span className="hidden min-[360px]:inline">Add Water ({GLASS_ML} ml)</span>
        </button>
        <button
          type="button"
          aria-label={`Add ${GLASS_ML} ml`}
          onClick={() => onChange(GLASS_ML)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-lu-line bg-white text-lu-ink-muted transition-colors hover:border-[#99F6E4]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="-mt-2 text-center text-lu-caption text-lu-ink-faint">You&apos;re doing well. Keep sipping throughout the day.</p>
    </section>
  );
}
