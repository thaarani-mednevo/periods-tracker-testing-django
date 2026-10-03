import { useId } from "react";

const useSvgId = () => useId().replace(/:/g, "");

/** `value` is the real logged weight; "--" when nothing is logged. */
export function ScaleArt({ value, className = "" }: { value?: string; className?: string }) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0F9FF" />
          <stop offset="1" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="57" rx="22" ry="3.5" fill="#E5E7EB" />
      <rect x="8" y="10" width="48" height="45" rx="12" fill={`url(#${id}-body)`} stroke="#BFDBFE" strokeWidth="1.5" />
      <rect x="20" y="17" width="24" height="10" rx="3" fill="#1E3A5F" />
      <text x="32" y="25" textAnchor="middle" fontSize="7" fontWeight="700" fill="#7DD3FC" fontFamily="Inter, sans-serif">
        {value ?? "--"}
      </text>
      <circle cx="32" cy="40" r="7" fill="none" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="2 2.4" />
    </svg>
  );
}

/** `fill` (0–1) = how much of the daily goal is logged. */
export function WaterGlassArt({ fill = 0.5, className = "" }: { fill?: number; className?: string }) {
  const id = useSvgId();
  const f = Math.min(Math.max(fill, 0), 1);
  const top = 54 - f * 35;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7DD3FC" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d="M20.6 14h22.8l-2.4 40a3 3 0 0 1-3 2.6H26a3 3 0 0 1-3-2.6z" />
        </clipPath>
      </defs>
      <ellipse cx="32" cy="58" rx="14" ry="3" fill="#E0F2FE" />
      <path d="M18 14h28l-3.5 40a4 4 0 0 1-4 3.6H25.5a4 4 0 0 1-4-3.6z" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1.5" />
      {f > 0 && <rect x="18" y={top} width="28" height={60 - top} fill={`url(#${id}-water)`} clipPath={`url(#${id}-clip)`} />}
      <path d="M24 20l1.6 30" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 6c0 0-4 5-4 7.4a4 4 0 0 0 8 0C54 11 50 6 50 6z" fill="#38BDF8" />
    </svg>
  );
}