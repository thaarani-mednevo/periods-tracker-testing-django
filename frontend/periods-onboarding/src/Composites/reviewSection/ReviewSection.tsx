import { PencilLine, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { StepId } from "../../types";
import { EditButton } from "../../Elements/editButton/EditButton";
import { Icon3D } from "../../Elements/icon3D/Icon3D";

export interface ReviewRow {
  label: string;
  value: ReactNode;
  /** Step to jump to when editing this row. Omit to rely on the section edit. */
  editStep?: StepId;
}

interface ReviewSectionProps {
  title: string;
  icon: LucideIcon;
  rows: ReviewRow[];
  editStep: StepId;
  onEdit: (step: StepId) => void;
  index: number;
}

/** Compact review card — one section edit, plus per-row edits where a row belongs to another step. */
export function ReviewSection({ title, icon, rows, editStep, onEdit, index }: ReviewSectionProps) {
  const headingId = `review-${editStep}-${index}`;
  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 animate-fade-up rounded-2xl border border-blush-300 bg-white px-3 py-2.5 short:py-2 transition-shadow duration-300 hover:border-hover-border hover:shadow-card-active"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center gap-2">
        <Icon3D icon={icon} size="sm" className="size-7 rounded-[9px] [&_svg]:size-3.5" />
        <h2 id={headingId} className="min-w-0 flex-1 break-words text-caption font-bold uppercase tracking-[0.08em] text-ink-label">
          {title}
        </h2>
        <EditButton onClick={() => onEdit(editStep)} label={title.toLowerCase()} />
      </div>
      <dl className="mt-1 space-y-0.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline gap-2 text-body-sm leading-snug">
            <dt className="shrink-0 text-ink-muted">{r.label}</dt>
            <dd className="min-w-0 flex-1 break-words font-semibold text-ink">{r.value}</dd>
            {r.editStep !== undefined && r.editStep !== editStep && <RowEdit step={r.editStep} label={r.label} onEdit={onEdit} />}
          </div>
        ))}
      </dl>
    </section>
  );
}

function RowEdit({ step, label, onEdit }: { step: StepId; label: string; onEdit: (step: StepId) => void }) {
  return (
    <button
      type="button"
      onClick={() => onEdit(step)}
      aria-label={`Edit ${label.toLowerCase()}`}
      className="grid size-11 shrink-0 place-items-center self-center rounded-lg text-rose-ink transition-colors hover:bg-blush-50 focus-ring pointer-fine:size-7"
    >
      <PencilLine className="size-3.5" aria-hidden="true" />
    </button>
  );
}

/** Joins values for a compact review line, with a muted placeholder when empty. */
export function ValueList({ items, empty = "None selected" }: { items: string[]; empty?: string }) {
  if (items.length === 0) return <span className="font-medium text-ink-placeholder">{empty}</span>;
  return <>{items.join(", ")}</>;
}
