import { useId } from "react";

interface BatteryProps {
  level: number; // 0–1
  color: string;
  className?: string;
}

export function Battery({ level, color, className = "" }: BatteryProps) {
  const innerH = 50;
  const fillH = Math.max(4, innerH * level);
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" x2="1">
          <stop offset="0" stopColor="#E5E7EB" />
          <stop offset="0.45" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D1D5DB" />
        </linearGradient>
        <linearGradient id={`${id}-fill`} x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.75" />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <rect x="10" y="1" width="12" height="6" rx="2" fill="#4B5563" />
      <rect x="3" y="6" width="26" height="57" rx="6" fill={`url(#${id}-glass)`} stroke="#9CA3AF" strokeWidth="1.2" />
      <rect x="6.5" y={9.5 + (innerH - fillH)} width="19" height={fillH} rx="3.5" fill={`url(#${id}-fill)`} />
      <rect x="9" y="12" width="3" height="44" rx="1.5" fill="#FFFFFF" opacity="0.45" />
    </svg>
  );
}