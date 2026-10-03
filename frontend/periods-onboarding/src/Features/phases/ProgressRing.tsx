import type { ReactNode } from "react";

interface ProgressRingProps {
  /** 0–1 */
  value: number;
  size?: number;
  stroke?: number;
  /** Split the ring into equal segments separated by small gaps. */
  segments?: number;
  children?: ReactNode;
  /** Single-ring colours. Ignored when segments > 1. */
  color?: string;
  track?: string;
  /** Segment colours (segments > 1 only). */
  segmentColor?: string;
  segmentTrack?: string;
  className?: string;
}

/** Fluid SVG progress ring: scales down with its container (max `size` px). */
export function ProgressRing({ value, size = 140, stroke = 10, segments = 1, color = "#f34f97", track = "#f8dde7", segmentColor = "#f34f97", segmentTrack = "#f8dde7", children, className = "" }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(Math.max(value, 0), 1);
  const center = size / 2;

  const gap = segments > 1 ? c * 0.07 : 0;
  const seg = c / segments - gap;
  const offset = segments > 1 ? seg / 2 : 0; // centre the first segment at 12 o'clock
  const arc = (key: number, color: string, length: number, start: number) => (
    <circle
      key={key}
      cx={center}
      cy={center}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeDasharray={`${length} ${c}`}
      strokeDashoffset={offset - start}
    />
  );

  const filled = segments > 1 ? Math.round(v * segments) : 0;

  return (
    <div className={`relative aspect-square w-full shrink-0 ${className}`} style={{ maxWidth: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden="true">
        {segments > 1
          ? Array.from({ length: segments }, (_, i) => arc(i, i < filled ? segmentColor : segmentTrack, seg, i * (seg + gap)))
          : [arc(0, track, c, 0), v > 0 && arc(1, color, c * v, 0)]}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}