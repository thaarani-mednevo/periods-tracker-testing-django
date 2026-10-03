import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

interface LogCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /** Show the info affordance next to the title block */
  info?: boolean;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Soft-pink Daily Log section card with icon bubble header. */
export function LogCard({ icon, title, subtitle, info, action, children, className = '' }: LogCardProps) {
  return (
    <section className={`lu-card-pink flex min-w-0 flex-col gap-[clamp(12px,1.1vw,18px)] p-lu-card ${className}`}>
      <header className="flex items-center gap-3">
        <span className="flex h-[clamp(40px,2.9vw,48px)] w-[clamp(40px,2.9vw,48px)] shrink-0 items-center justify-center overflow-hidden rounded-full bg-lu-brand-soft">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-lu-heading font-semibold text-lu-ink">
            <span className="truncate">{title}</span>
          </h3>
          {subtitle && <p className="mt-0.5 text-lu-label text-lu-ink-muted">{subtitle}</p>}
        </div>
        {info && <Info className="h-[18px] w-[18px] shrink-0 self-center text-lu-ink-faint" aria-hidden="true" />}
        {action}
      </header>
      {children}
    </section>
  );
}
