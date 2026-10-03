import { Zap } from "lucide-react";
import type { Energy, Level, Mood, Sleep } from "../../../../services/logs";
import { Battery } from "./Battery";
import { Emoji } from "./Emoji";

export const MOOD_EMOJI: Record<Mood, string> = { Happy: "😊", Calm: "😌", Neutral: "😐", Irritable: "😣", Sad: "😢" };
export const SLEEP_EMOJI: Record<Sleep, string> = { Poor: "😟", Fair: "😥", Good: "😴", Excellent: "🛌" };
export const CRAVING_EMOJI: Record<Level, string> = { None: "🍌", Mild: "🍪", Moderate: "🧁", High: "🍫" };

/** Battery = energy left, so more fatigue means a lower, redder battery. */
export const FATIGUE_BATTERY: Record<Level, { level: number; color: string }> = {
  None: { level: 1, color: "#22C55E" },
  Mild: { level: 0.75, color: "#22C55E" },
  Moderate: { level: 0.45, color: "#F59E0B" },
  High: { level: 0.15, color: "#F43F5E" },
};

export const ENERGY_BOLT: Record<Energy, string> = { Low: "#F9A8D4", Moderate: "#FACC15", High: "#F43F5E" };

export function FatigueBattery({ value, className }: { value: Level | null; className?: string }) {
  const b = value ? FATIGUE_BATTERY[value] : { level: 0.05, color: "#D1D5DB" };
  return <Battery level={b.level} color={b.color} className={className} />;
}

export function EnergyBolt({ value, className = "h-[clamp(26px,2.1vw,36px)] w-[clamp(26px,2.1vw,36px)]" }: { value: Energy | null; className?: string }) {
  const color = value ? ENERGY_BOLT[value] : "#D1D5DB";
  return <Zap className={className} fill={color} stroke={color} strokeWidth={1.2} aria-hidden="true" />;
}

export function MoodFace({ value, className = "text-[clamp(20px,1.6vw,26px)]" }: { value: Mood; className?: string }) {
  return (
    <span className="flex aspect-square h-full items-center justify-center rounded-full bg-lu-brand-soft">
      <Emoji symbol={MOOD_EMOJI[value]} label={value} className={className} />
    </span>
  );
}