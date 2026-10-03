import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface Icon3DProps {
  icon?: LucideIcon;
  /** Custom glyph when no Lucide icon fits (e.g. contraceptive methods). */
  glyph?: ReactNode;
  active?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "size-9 rounded-xl", md: "size-11 rounded-2xl", lg: "size-14 rounded-[18px]" } as const;
const ICON_SIZES = { sm: "size-[18px]", md: "size-5", lg: "size-6" } as const;

/**
 * Soft pastel icon tile — a very light blush container with a rose glyph. No drop shadow or glow;
 * the active state only deepens the blush slightly.
 */
export function Icon3D({ icon: Icon, glyph, active, size = "md", className }: Icon3DProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center transition-colors duration-200 ease-out",
        SIZES[size],
        active ? "bg-[#FFE4EF] text-select-icon" : "bg-icon-bg text-rose-icon",
        className,
      )}
    >
      {Icon ? <Icon className={ICON_SIZES[size]} strokeWidth={2} /> : glyph}
    </span>
  );
}

/** Simple, clinical line glyphs for contraceptive methods (24×24, currentColor). */
export function MethodGlyph({ method, className = "size-5" }: { method: string; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactNode> = {
    Pill: (
      <>
        <rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)" {...common} />
        <path d="M9.5 7.5 L14.5 16.5" {...common} />
      </>
    ),
    Condom: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" {...common} />
        <circle cx="12" cy="12" r="4" {...common} />
      </>
    ),
    IUD: <path d="M5 6 Q12 9 19 6 M12 7.5 V19 M10 19 h4" {...common} />,
    Implant: <rect x="10" y="3" width="4" height="18" rx="2" transform="rotate(35 12 12)" {...common} />,
    Injection: <path d="M4 20 l4.5 -4.5 M7.5 12.5 l4 4 M9 11 l8 -8 l4 4 l-8 8 Z M13 7 l1.5 1.5 M11 9 l1.5 1.5" {...common} />,
    Patch: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" {...common} />
        <circle cx="9" cy="9" r="0.6" fill="currentColor" />
        <circle cx="15" cy="9" r="0.6" fill="currentColor" />
        <circle cx="9" cy="15" r="0.6" fill="currentColor" />
        <circle cx="15" cy="15" r="0.6" fill="currentColor" />
      </>
    ),
    Ring: <circle cx="12" cy="12" r="7" {...common} strokeWidth={3} />,
    Other: <path d="M12 5 v14 M5 12 h14" {...common} />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[method] ?? paths.Other}
    </svg>
  );
}
