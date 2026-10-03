import { useState } from 'react';
import { BellRing, Pencil, Pill, Plus, Trash2 } from 'lucide-react';
import { formatDate, formatTime } from '../../../../lib/dailyLogDate';
import type { Medication, NewMedication } from '../../../../services/logs';
import { Emoji } from '../ui/Emoji';
import { AddMedicationModal } from './AddMedicationModal';

interface MedicationSectionProps {
  medications: Medication[];
  /** The selected Daily Log date (ISO) */
  date: string;
  onStatusChange: (id: number, status: 'taken' | 'skipped') => void;
  onAdd: (medication: NewMedication) => void;
  /** "menstrual" = compact card with delete. Default keeps the original look (luteal etc.). */
  variant?: 'default' | 'menstrual';
  onRemove?: (id: number) => void;
  /** Saves the edited medication; the pencil button only shows when this is passed */
  onUpdate?: (id: number, medication: NewMedication) => void;
}

const STATUS_OPTIONS: { value: 'taken' | 'skipped'; label: string }[] = [
  { value: 'taken', label: 'Taken' },
  { value: 'skipped', label: 'Skipped' },
];

const STATUS_CHIP: Record<'pending' | 'taken' | 'skipped', { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-[#F3F4F6] text-lu-ink-muted' },
  taken: { label: 'Taken', className: 'bg-[#DCFCE7] text-[#15803D]' },
  skipped: { label: 'Skipped', className: 'bg-[#FEF3C7] text-[#B45309]' },
};

const shortDate = (iso: string) => formatDate(iso, { month: 'short', day: 'numeric' }); // "Sep 29", as in the date carousel

/** Where the selected date falls within the medication's schedule. */
function scheduleState(m: Medication, date: string) {
  if (m.startDate && date < m.startDate) return { active: false, label: `Starts ${shortDate(m.startDate)}` };
  if (m.endDate && date > m.endDate) return { active: false, label: `Ended ${shortDate(m.endDate)}` };
  return { active: true, label: 'Active' };
}

export function MedicationSection({ medications, date, onStatusChange, onAdd, variant = 'default', onRemove, onUpdate }: MedicationSectionProps) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);

  if (variant === 'menstrual') {
    return <MenstrualMedication medications={medications} date={date} onStatusChange={onStatusChange} onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate} />;
  }

  return (
    <section className="lu-card-pink flex min-w-0 flex-col gap-[clamp(12px,1.2vw,18px)] p-lu-card">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lu-brand-soft text-lu-brand-strong">
          <Pill className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <h3 className="flex-1 text-lu-heading font-semibold text-lu-ink">Medication</h3>
        <button
          type="button"
          onClick={() => setAdding(true)}
          aria-haspopup="dialog"
          aria-label="Log a new medication"
          className="inline-flex items-center gap-1 rounded-full bg-[#F43F5E] px-4 py-2 text-lu-label font-medium text-white shadow-soft transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Log
        </button>
      </header>
      {/* Mounted only while open, so every "+ Log" starts from a clean form */}
      {adding && <AddMedicationModal defaultStartDate={date} onSave={onAdd} onClose={() => setAdding(false)} />}
      {editing && onUpdate && (
        <AddMedicationModal key={editing.id} initial={editing} defaultStartDate={date} onSave={(med) => onUpdate(editing.id, med)} onClose={() => setEditing(null)} />
      )}
      <ul className="flex flex-col gap-3">
        {medications.map((m) => {
          const schedule = scheduleState(m, date);
          const status = m.status;
          const chip = STATUS_CHIP[status];
          const when = [m.time && formatTime(m.time), m.frequency].filter(Boolean).join(' · ');
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-[clamp(14px,1.2vw,20px)] border border-lu-brand-line bg-white px-3 py-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full bg-lu-brand-tint">
                <Emoji symbol="💊" className="text-[20px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-lu-label font-semibold leading-snug text-lu-ink">{m.name}</p>
                <p className="break-words text-lu-caption text-lu-ink-muted">{[m.dose, m.form].filter(Boolean).join(' · ')}</p>
                {when && <p className="break-words text-lu-caption text-lu-ink-muted">{when}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-lu-caption font-semibold ${
                      schedule.active ? 'bg-lu-brand-soft text-lu-brand-strong' : 'bg-[#F3F4F6] text-lu-ink-muted'
                    }`}
                  >
                    {schedule.label}
                  </span>
                  {schedule.active && (
                    <span className={`rounded-full px-2 py-0.5 text-lu-caption font-semibold ${chip.className}`} aria-live="polite">
                      {chip.label}
                    </span>
                  )}
                  {m.reminder && m.time && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE9FE] px-2 py-0.5 text-lu-caption font-semibold text-[#6D28D9]">
                      <BellRing className="h-3 w-3" aria-hidden="true" />
                      Reminder ON
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {(onUpdate || onRemove) && (
                  <div className="flex gap-1">
                    {onUpdate && (
                      <button type="button" aria-label={`Edit ${m.name}`} onClick={() => setEditing(m)} className="rounded-full p-1.5 text-lu-brand-strong transition-colors hover:bg-lu-brand-soft">
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                    {onRemove && (
                      <button
                        type="button"
                        aria-label={`Remove ${m.name}`}
                        onClick={() => {
                          if (window.confirm(`Remove ${m.name}?`)) onRemove(m.id);
                        }}
                        className="rounded-full p-1.5 text-lu-brand-strong transition-colors hover:bg-lu-brand-soft"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}
                <div role="group" aria-label={`${m.name} status`} className="flex shrink-0 flex-col gap-1.5">
                  {STATUS_OPTIONS.map((s) => {
                    const active = m.status === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        aria-pressed={active}
                        disabled={!schedule.active}
                        title={schedule.active ? undefined : `Not scheduled on this date (${schedule.label})`}
                        onClick={() => onStatusChange(m.id, s.value)}
                        className={`min-w-[72px] rounded-full border px-3 py-1 text-lu-caption font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          active ? 'border-lu-brand bg-lu-brand-soft text-lu-brand-strong' : 'border-lu-line bg-white text-lu-ink-muted hover:border-lu-brand-line'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MenstrualMedication({ medications, date, onStatusChange, onAdd, onRemove, onUpdate }: MedicationSectionProps) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);

  return (
    <section className="min-w-0 rounded-[22px] border border-[#F1EEF3] bg-white p-5 shadow-[0_8px_28px_rgba(23,21,43,0.045)]">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0F6] text-[#F43F8F]">
          <Pill className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-tight text-[#17152B]">Medication</h3>
          <p className="text-[0.7rem] font-medium leading-tight text-[#68708A]">Saved immediately</p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          aria-haspopup="dialog"
          aria-label="Log a new medication"
          className="inline-flex items-center gap-1 rounded-full bg-[#D6155F] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Log
        </button>
      </header>
      {adding && <AddMedicationModal defaultStartDate={date} onSave={onAdd} onClose={() => setAdding(false)} />}
      {editing && onUpdate && (
        <AddMedicationModal key={editing.id} initial={editing} defaultStartDate={date} onSave={(med) => onUpdate(editing.id, med)} onClose={() => setEditing(null)} />
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {medications.map((m) => {
          const schedule = scheduleState(m, date);
          const meta = [m.dose, m.form, m.time && formatTime(m.time)].filter(Boolean).join(' · ');
          return (
            <li key={m.id} className="rounded-[18px] border border-[#F9D5E5] bg-[#FFF7FA] p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold leading-snug text-[#17152B]">{m.name}</p>
                  {meta && <p className="break-words text-xs font-medium text-[#68708A]">{meta}</p>}
                  {!schedule.active && <p className="mt-1 text-[0.7rem] font-semibold text-[#B45309]">{schedule.label}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  {onUpdate && (
                    <button type="button" aria-label={`Edit ${m.name}`} onClick={() => setEditing(m)} className="rounded-full p-1.5 text-[#F43F8F] transition-colors hover:bg-[#FFE4EF]">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      aria-label={`Remove ${m.name}`}
                      onClick={() => {
                        if (window.confirm(`Remove ${m.name}?`)) onRemove(m.id);
                      }}
                      className="rounded-full p-1.5 text-[#F43F8F] transition-colors hover:bg-[#FFE4EF]"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <div role="group" aria-label={`${m.name} status`} className="mt-3 inline-flex rounded-full border border-[#F3D5E2] bg-white p-1">
                {STATUS_OPTIONS.map((s) => {
                  const active = m.status === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={active}
                      disabled={!schedule.active}
                      title={schedule.active ? undefined : `Not scheduled on this date (${schedule.label})`}
                      onClick={() => onStatusChange(m.id, s.value)}
                      className={`rounded-full px-5 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        active ? (s.value === 'taken' ? 'bg-[#047857] text-white' : 'bg-[#B45309] text-white') : 'text-[#68708A] hover:text-[#17152B]'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}