import { HeartPulse, Info, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type Variant = "info" | "disclaimer" | "privacy";

interface InfoCardProps {
  variant?: Variant;
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  /** Announce changes to screen readers (for dynamic contextual messages). */
  live?: boolean;
}

const STYLES: Record<Variant, { box: string; icon: string; Icon: LucideIcon }> = {
  info: { box: "bg-blush-50 border-blush-400", icon: "text-rose-icon bg-white", Icon: Info },
  disclaimer: { box: "bg-peach-50 border-peach-border", icon: "text-coral bg-white", Icon: HeartPulse },
  privacy: { box: "bg-blush-50 border-blush-400", icon: "text-rose-icon bg-white", Icon: ShieldCheck },
};

/** Calm contextual message card — informative, never alarming. */
export function InfoCard({ variant = "info", title, icon, children, className, live }: InfoCardProps) {
  const s = STYLES[variant];
  const Icon = icon ?? s.Icon;
  return (
    <div
      className={cn("flex animate-expand gap-2.5 rounded-2xl border px-3 py-2.5", s.box, className)}
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
    >
      <span aria-hidden="true" className={cn("grid size-7 shrink-0 place-items-center rounded-lg shadow-sm", s.icon)}>
        <Icon className="size-3.5" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 pt-0.5 text-body-sm leading-snug text-ink-soft">
        {title && <p className="mb-0.5 font-semibold text-ink">{title}</p>}
        {children}
      </div>
    </div>
  );
}
