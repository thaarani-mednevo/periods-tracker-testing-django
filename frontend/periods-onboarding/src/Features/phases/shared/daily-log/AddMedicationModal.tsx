import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { Medication, NewMedication } from '../../../../services/logs';
import { LuModal } from '../ui/LuModal';
import { MEDICATION_FREQUENCIES, MEDICATION_TYPES } from './constants';

type Form = Omit<NewMedication, 'startDate' | 'endDate'> & { startDate: string; endDate: string };

interface AddMedicationModalProps {
  /** Pre-fills the start date (the Daily Log's selected date) */
  defaultStartDate: string;
  onSave: (medication: NewMedication) => void;
  onClose: () => void;
  /** When set, the modal edits this medication instead of adding a new one */
  initial?: Medication;
}

type Errors = Partial<Record<'name' | 'dose' | 'time' | 'startDate' | 'endDate', string>>;

const fieldClass =
  'w-full min-w-0 rounded-full border bg-white px-4 py-[clamp(10px,0.9vw,12px)] text-lu-body text-lu-ink outline-none transition-colors placeholder:text-lu-ink-faint focus:border-lu-brand';

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-lu-label font-semibold text-lu-ink">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-lu-caption font-medium text-[#E11D48]">
          {error}
        </p>
      )}
    </div>
  );
}

export function AddMedicationModal({ defaultStartDate, onSave, onClose, initial }: AddMedicationModalProps) {
  const id = useId();
  const [form, setForm] = useState<Form>({
    name: initial?.name ?? '',
    form: initial?.form || MEDICATION_TYPES[0],
    dose: initial?.dose ?? '',
    frequency: initial?.frequency || MEDICATION_FREQUENCIES[0],
    time: initial?.time ?? '',
    startDate: initial?.startDate ?? defaultStartDate,
    endDate: initial?.endDate ?? '',
    reminder: initial?.reminder ?? true,
  });
  const [errors, setErrors] = useState<Errors>({});
  // Guards against double-clicks / repeated submits creating duplicate medications
  const submitted = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = 'Enter a medication name.';
    if (!form.dose.trim()) e.dose = 'Enter a dosage.';
    if (!form.time) e.time = 'Choose a time.';
    if (!form.startDate) e.startDate = 'Choose a start date.';
    if (form.endDate && form.startDate && form.endDate < form.startDate) e.endDate = 'End date must be on or after the start date.';
    return e;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitted.current) return;
    const problems = validate();
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;
    submitted.current = true;
    onSave({ ...form, name: form.name.trim(), dose: form.dose.trim(), startDate: form.startDate || null, endDate: form.endDate || null });
    onClose();
  };

  const errorProps = (key: keyof Errors) =>
    errors[key] ? { 'aria-invalid': true, 'aria-describedby': `${id}-${key}-error` } : {};
  const border = (key: keyof Errors) => (errors[key] ? 'border-[#FDA4AF]' : 'border-lu-line');

  return (
    <LuModal
      labelledBy={`${id}-title`}
      describedBy={`${id}-desc`}
      onClose={onClose}
      initialFocus={nameInput}
      className="max-h-[92dvh] overflow-y-auto px-[clamp(18px,2.4vw,36px)] pb-[clamp(20px,2.2vw,30px)] pt-3 sm:max-w-[560px] sm:rounded-[32px]"
    >
      <span aria-hidden="true" className="mx-auto mb-4 block h-1.5 w-24 rounded-full bg-lu-brand-soft" />
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-lu-title font-bold text-lu-ink">
            {initial ? 'Edit Medication' : 'Add Medication'}
          </h2>
          <p id={`${id}-desc`} className="mt-1 text-lu-label text-lu-ink-muted">
            Only the details you enter are stored. No recommendations are made.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lu-brand-soft text-lu-brand-strong transition-colors hover:bg-[#FBCFE8]"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={2.4} />
        </button>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mt-[clamp(16px,1.6vw,22px)] flex flex-col gap-[clamp(14px,1.3vw,18px)]">
        <Field id={`${id}-name`} label="Medication Name" error={errors.name}>
          <input
            ref={nameInput}
            id={`${id}-name`}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Iron Supplement"
            maxLength={80}
            autoComplete="off"
            className={`${fieldClass} ${border('name')}`}
            {...errorProps('name')}
          />
        </Field>

        <Field id={`${id}-type`} label="Medication Type">
          <div className="relative">
            <select
              id={`${id}-type`}
              value={form.form}
              onChange={(e) => set('form', e.target.value)}
              className={`${fieldClass} border-lu-line appearance-none pr-10`}
            >
              {MEDICATION_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lu-ink-muted" />
          </div>
        </Field>

        <Field id={`${id}-dose`} label="Dosage" error={errors.dose}>
          <input
            id={`${id}-dose`}
            value={form.dose}
            onChange={(e) => set('dose', e.target.value)}
            placeholder="e.g. 400 mg"
            maxLength={40}
            autoComplete="off"
            className={`${fieldClass} ${border('dose')}`}
            {...errorProps('dose')}
          />
        </Field>

        <Field id={`${id}-frequency`} label="Frequency">
          <div className="relative">
            <select
              id={`${id}-frequency`}
              value={form.frequency}
              onChange={(e) => set('frequency', e.target.value)}
              className={`${fieldClass} border-lu-line appearance-none pr-10`}
            >
              {MEDICATION_FREQUENCIES.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lu-ink-muted" />
          </div>
        </Field>

        <Field id={`${id}-time`} label="Time" error={errors.time}>
          <input
            id={`${id}-time`}
            type="time"
            value={form.time}
            onChange={(e) => set('time', e.target.value)}
            className={`${fieldClass} ${border('time')}`}
            {...errorProps('time')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-[clamp(14px,1.3vw,18px)] min-[480px]:grid-cols-2">
          <Field id={`${id}-startDate`} label="Start Date" error={errors.startDate}>
            <input
              id={`${id}-startDate`}
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              className={`${fieldClass} ${border('startDate')}`}
              {...errorProps('startDate')}
            />
          </Field>
          <Field id={`${id}-endDate`} label="End Date" error={errors.endDate}>
            <input
              id={`${id}-endDate`}
              type="date"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={(e) => set('endDate', e.target.value)}
              className={`${fieldClass} ${border('endDate')}`}
              {...errorProps('endDate')}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[24px] border border-lu-brand-line bg-lu-brand-tint px-[clamp(16px,1.5vw,20px)] py-3.5">
          <div className="min-w-0">
            <p id={`${id}-reminder`} className="text-lu-body font-semibold text-lu-ink">
              Reminder
            </p>
            <p className="text-lu-caption text-lu-ink-muted">Remind me at the scheduled time</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.reminder}
            aria-labelledby={`${id}-reminder`}
            onClick={() => set('reminder', !form.reminder)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${form.reminder ? 'bg-lu-brand' : 'bg-[#E5E7EB]'}`}
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(17,24,39,0.25)] transition-transform ${
                form.reminder ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-lu-line bg-white px-5 py-2.5 text-lu-body font-medium text-lu-ink shadow-lu-pill transition-colors hover:bg-[#F9FAFB]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-lu-brand px-5 py-2.5 text-lu-body font-semibold text-white shadow-lu-glow transition-colors hover:bg-lu-brand-strong"
          >
            {initial ? 'Save Changes' : 'Save Medication'}
          </button>
        </div>
      </form>
    </LuModal>
  );
}