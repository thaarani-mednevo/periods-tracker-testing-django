import { useId } from "react";
import { calcBmi } from "../../../../lib/health";
import type { CycleState } from "../../../../services/cycle";
import type { OnboardingData } from "../../../../types";

export type LutealTab = "overview" | "calendar" | "daily-log" | "insights" | "settings";

const TABS: { id: LutealTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "calendar", label: "Calendar" },
  { id: "daily-log", label: "Daily Log" },
  { id: "insights", label: "Insights" },
  { id: "settings", label: "Settings" },
];

/** Pink calendar-with-hearts illustration used in the Cycle Tracker header. */
function CalendarArt({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 110" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F9A8D4" />
          <stop offset="1" stopColor="#F472B6" />
        </linearGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F3F4F6" />
        </linearGradient>
        <linearGradient id={`${id}-heart`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FB7185" />
          <stop offset="1" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      <g transform="rotate(-8 60 58)">
        <rect x="16" y="22" width="84" height="74" rx="12" fill={`url(#${id}-body)`} stroke="#F3D5E4" strokeWidth="1.5" />
        <path d="M16 34a12 12 0 0 1 12-12h60a12 12 0 0 1 12 12v6H16z" fill={`url(#${id}-top)`} />
        {[30, 44, 58, 72, 86].map((x) => (
          <g key={x}>
            <rect x={x - 3} y="12" width="6" height="16" rx="3" fill="#F472B6" />
            <circle cx={x} cy="14" r="3" fill="#FBCFE8" />
          </g>
        ))}
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <rect key={`${row}-${col}`} x={24 + col * 15} y={47 + row * 11} width="10" height="7" rx="2" fill={row === 1 && col === 2 ? "#F472B6" : "#E5E7EB"} />
          )),
        )}
        <path d="M58 58c0-3 3-6 6-6 1.5 0 3 1 4 2 1-1 2.5-2 4-2 3 0 6 3 6 6 0 6-10 11-10 11s-10-5-10-11z" fill={`url(#${id}-heart)`} />
      </g>
      <path d="M100 70c0-2.4 2-4.4 4.4-4.4 1.2 0 2.2.6 3 1.4.8-.8 1.8-1.4 3-1.4 2.4 0 4.4 2 4.4 4.4 0 4.6-7.4 8.4-7.4 8.4s-7.4-3.8-7.4-8.4z" fill={`url(#${id}-heart)`} />
      <path d="M2 60c0-2 1.6-3.6 3.6-3.6 1 0 1.8.4 2.4 1 .6-.6 1.4-1 2.4-1 2 0 3.6 1.6 3.6 3.6 0 3.8-6 7-6 7s-6-3.2-6-7z" fill={`url(#${id}-heart)`} />
      <path d="M104 12l3 6M112 16l-5 4M96 8l2 6" stroke="#F472B6" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** Pink patient card. Only shows what the user actually entered during onboarding. */
function PatientCard({ data, state }: { data: OnboardingData; state: CycleState }) {
  const name = data.name.trim() || "Your profile";
  const cycleLength = data.cycleLength ?? (state.cycleProfile.medianCycleLength ? Math.round(state.cycleProfile.medianCycleLength) : undefined);
  const bmi = calcBmi(data.height, data.weight);
  const lines = [
    data.age ? `Age: ${data.age}` : null,
    [data.height ? `Height: ${data.height} cm` : null, data.weight ? `Weight: ${data.weight} kg` : null].filter(Boolean).join(" • ") || null,
    cycleLength ? `Cycle Length: ${cycleLength} days (avg)` : null,
    bmi ? `BMI: ${bmi}` : null,
  ].filter(Boolean) as string[];

  return (
    <aside
      aria-label="Your profile"
      className="relative isolate flex min-h-[clamp(138px,133px_+_1.37vw,160px)] w-full overflow-hidden rounded-[clamp(18px,1.6vw,26px)] bg-gradient-to-r from-[#EC4899] to-[#F472B6] p-[clamp(12px,0.95vw,18px)] text-white shadow-lu-glow sm:max-w-[380px]"
    >
      <div className="relative z-10 flex min-w-0 max-w-[68%] flex-col justify-center gap-0.5">
        <h2 className="truncate text-lu-heading font-bold">{name}</h2>
        {lines.map((l) => (
          <p key={l} className="text-lu-caption text-white/85">{l}</p>
        ))}
      </div>
      <span aria-hidden="true" className="absolute -bottom-[30%] -right-[8%] -z-0 aspect-square w-[52%] rounded-full bg-[#F9A8D4]/70" />
      <span aria-hidden="true" className="absolute right-[10%] top-1/2 z-0 flex size-[clamp(56px,5vw,76px)] -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-lu-title font-bold uppercase text-white">
        {name.charAt(0)}
      </span>
    </aside>
  );
}

interface LutealShellProps {
  data: OnboardingData;
  state: CycleState;
  active: LutealTab;
  onNavigate: (tab: LutealTab) => void;
}

/** "Cycle Tracker" header, patient card and Overview / Calendar / Daily Log / Insights / Settings tabs. */
export function LutealShell({ data, state, active, onNavigate }: LutealShellProps) {
  return (
    <div className="mb-lu-grid flex flex-col gap-[clamp(16px,1.5vw,28px)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-[clamp(10px,1.1vw,18px)]">
          <CalendarArt className="w-[clamp(56px,5vw,92px)] shrink-0" />
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-lu-label font-bold uppercase tracking-[0.2em] text-lu-brand-strong">
              Period
              <span aria-hidden="true" className="h-[2px] w-[clamp(40px,4.5vw,80px)] bg-lu-brand" />
            </p>
            <h1 className="mt-0.5 text-lu-display font-bold text-lu-ink">
              Cycle <span className="text-lu-brand">Tracker</span>
            </h1>
            <p className="mt-1 text-lu-body text-lu-ink-muted">Understand your body, one day at a time.</p>
          </div>
        </div>
        <PatientCard data={data} state={state} />
      </div>

      <nav aria-label="Cycle tracker" className="lu-no-scrollbar overflow-x-auto rounded-full bg-[#FDF0F6] p-[clamp(4px,0.35vw,6px)]">
        <ul className="flex min-w-max items-center gap-[clamp(2px,0.6vw,12px)]">
          {TABS.map(({ id, label }) => {
            const isActive = id === active;
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onNavigate(id)}
                  className={`block whitespace-nowrap rounded-full px-[clamp(14px,1.5vw,24px)] py-[clamp(7px,0.55vw,10px)] text-lu-body transition-colors ${
                    isActive ? "bg-white font-semibold text-lu-brand-strong shadow-lu-pill" : "font-medium text-lu-ink-soft hover:text-lu-brand-strong"
                  }`}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}