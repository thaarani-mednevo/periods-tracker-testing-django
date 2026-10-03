import { Heart, X } from "lucide-react";
import { useId, useRef } from "react";
import { Icon3D } from "../../../Elements/icon3D/Icon3D";
import { LuModal } from "../shared/ui/LuModal";
import { CARE_TIPS } from "./menstrualContent";

/** "Period Care Tips" dialog opened from the View Period Tips button. */
export function PeriodTipsModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const descId = useId();
  const closeBtn = useRef<HTMLButtonElement>(null);

  return (
    <LuModal labelledBy={titleId} describedBy={descId} onClose={onClose} initialFocus={closeBtn} className="flex max-h-[92dvh] flex-col overflow-hidden sm:max-w-[580px]">
      <header className="flex items-start justify-between gap-4 border-b border-lu-line px-[clamp(18px,2vw,26px)] py-[clamp(16px,1.6vw,22px)]">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lu-brand-soft text-lu-brand-strong">
            <Heart className="size-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-lu-body font-semibold text-lu-ink">Period Care Tips</h2>
            <p id={descId} className="mt-0.5 text-lu-label text-lu-ink-muted">Simple ways to feel more comfortable during your period.</p>
          </div>
        </div>
        <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-full text-lu-ink-muted transition-colors hover:bg-lu-brand-soft hover:text-lu-brand-strong">
          <X className="size-[18px]" strokeWidth={2.2} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-[clamp(18px,2vw,26px)] py-4">
        <ul className="grid gap-3">
          {CARE_TIPS.map(({ icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-[16px] border border-lu-line bg-white p-4">
              <Icon3D icon={icon} size="sm" />
              <div className="min-w-0">
                <h3 className="text-lu-caption font-bold uppercase tracking-[0.08em] text-lu-ink">{title}</h3>
                <p className="mt-1 text-lu-label text-lu-ink-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-lu-caption text-lu-ink-muted">General wellness information, not medical advice.</p>
      </div>

      <footer className="flex justify-end border-t border-lu-line px-[clamp(18px,2vw,26px)] py-4">
        <button type="button" onClick={onClose} className="rounded-full bg-lu-brand px-7 py-2.5 text-lu-label font-semibold text-white shadow-lu-glow transition-colors hover:bg-lu-brand-strong">
          Got it
        </button>
      </footer>
    </LuModal>
  );
}